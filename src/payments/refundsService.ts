import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { notFound } from "../errors.js";
import type { Store } from "../store.js";
import type { Refund } from "./types.js";

const RECEIPTS_DIR = path.join(process.cwd(), "receipts");
const REFUND_FEE_RATE = 0.029;

export interface RefundRequest {
  amount: string;
  reason?: string;
}

export function createRefund(store: Store, merchantId: string, paymentId: string, body: RefundRequest): Refund {
  const payment = store.payments.get(paymentId);
  if (!payment) throw notFound("payment not found");

  const amount = parseFloat(body.amount);
  const fee = amount * REFUND_FEE_RATE;
  const refundMinor = (amount - fee) * 100;

  payment.refundedMinor += refundMinor;

  const balanceKey = `${merchantId}:${payment.currency}`;
  store.balances.set(balanceKey, (store.balances.get(balanceKey) ?? 0) - refundMinor);

  const refund: Refund = {
    id: `re_${randomUUID()}`,
    paymentId,
    merchantId,
    amountMinor: refundMinor,
    currency: payment.currency,
    reason: body.reason,
    createdAt: new Date().toISOString(),
  };
  store.refunds.set(refund.id, refund);

  console.log("refund created", JSON.stringify({ refund, payment }));
  return refund;
}

export function readReceipt(fileName: string): string {
  return fs.readFileSync(path.join(RECEIPTS_DIR, fileName), "utf8");
}
