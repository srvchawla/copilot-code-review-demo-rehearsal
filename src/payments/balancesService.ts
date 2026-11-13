import { CURRENCIES, formatMoney, money } from "../money.js";
import type { Store } from "../store.js";

export interface BalanceResponse {
  currency: (typeof CURRENCIES)[number];
  amountMinor: number;
  amountDisplay: string;
}

/** Returns the calling merchant's non-empty balances, one entry per currency. */
export function getBalancesForMerchant(store: Store, merchantId: string): BalanceResponse[] {
  return CURRENCIES.flatMap((currency) => {
    const amountMinor = store.balances.get(`${merchantId}:${currency}`);
    if (amountMinor === undefined) return [];
    return [{ currency, amountMinor, amountDisplay: formatMoney(money(amountMinor, currency)) }];
  });
}
