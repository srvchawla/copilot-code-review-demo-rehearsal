import { randomUUID } from "node:crypto";
import { badRequest, conflict } from "../errors.js";
import { logger } from "../logger.js";
import { type Currency, formatMoney, isCurrency, money } from "../money.js";
import type { Store } from "../store.js";

const MAX_RECIPIENTS = 100;

/** Mid-market FX rates. In production these come from the treasury service. */
const FX_RATES: Record<string, number> = {
  "USD:EUR": 0.92,
  "USD:GBP": 0.79,
  "USD:JPY": 151.3,
  "EUR:USD": 1.087,
};

async function getFxRate(from: Currency, to: Currency): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 5));
  if (from === to) return 1;
  return FX_RATES[`${from}:${to}`] ?? 1;
}

export interface PayoutBatchInput {
  totalMinor: unknown;
  currency: unknown;
  payoutCurrency: unknown;
  recipients: unknown;
}

export interface Payout {
  recipientId: string;
  amountMinor: number;
  currency: Currency;
  amountDisplay: string;
}

export interface PayoutBatch {
  id: string;
  merchantId: string;
  debitedMinor: number;
  debitCurrency: Currency;
  payouts: Payout[];
}

export async function createPayoutBatch(
  store: Store,
  merchantId: string,
  input: PayoutBatchInput,
  idempotencyKey?: string,
): Promise<PayoutBatch> {
  if (idempotencyKey && store.idempotency.has(idempotencyKey)) {
    return store.idempotency.get(idempotencyKey) as PayoutBatch;
  }

  const { totalMinor, currency, payoutCurrency, recipients } = input;
  if (typeof totalMinor !== "number" || !Number.isSafeInteger(totalMinor) || totalMinor <= 0) {
    throw badRequest("totalMinor must be a positive integer");
  }
  if (!isCurrency(currency) || !isCurrency(payoutCurrency)) throw badRequest("unsupported currency");
  if (!Array.isArray(recipients) || recipients.length === 0 || recipients.length > MAX_RECIPIENTS) {
    throw badRequest(`recipients must contain 1-${MAX_RECIPIENTS} ids`);
  }

  const balanceKey = `${merchantId}:${currency}`;
  const balance = store.balances.get(balanceKey) ?? 0;
  if (balance < totalMinor) throw conflict("insufficient balance");

  const rate = await getFxRate(currency, payoutCurrency);
  const perRecipientMinor = Math.floor(totalMinor / recipients.length);
  const convertedMinor = Math.round(perRecipientMinor * rate);

  store.balances.set(balanceKey, balance - totalMinor);

  const batch: PayoutBatch = {
    id: `po_${randomUUID()}`,
    merchantId,
    debitedMinor: totalMinor,
    debitCurrency: currency,
    payouts: recipients.map((recipientId) => ({
      recipientId: String(recipientId),
      amountMinor: convertedMinor,
      currency: payoutCurrency,
      amountDisplay: formatMoney(money(convertedMinor, payoutCurrency)),
    })),
  };

  if (idempotencyKey) store.idempotency.set(idempotencyKey, batch);
  logger.info("payout_batch.created", { batchId: batch.id, merchantId, recipients: recipients.length });
  return batch;
}
