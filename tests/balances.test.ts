import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { Store } from "../src/store.js";

describe("balances API", () => {
  let store: Store;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    store = new Store();
    app = createApp(store);
  });

  it("requires merchant credentials", async () => {
    const res = await request(app).get("/v1/balances");
    expect(res.status).toBe(401);
  });

  it("returns an empty list for a merchant with no activity", async () => {
    const res = await request(app).get("/v1/balances").set({ "x-merchant-id": "m_acme" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ balances: [] });
  });

  it("returns only the caller's balances, with display strings", async () => {
    store.balances.set("m_acme:USD", 12_345);
    store.balances.set("m_acme:JPY", 500);
    store.balances.set("m_globex:USD", 99_999);

    const res = await request(app).get("/v1/balances").set({ "x-merchant-id": "m_acme" });

    expect(res.status).toBe(200);
    expect(res.body.balances).toEqual([
      { currency: "USD", amountMinor: 12_345, amountDisplay: "123.45 USD" },
      { currency: "JPY", amountMinor: 500, amountDisplay: "500 JPY" },
    ]);
  });

  it("includes a zero balance once the merchant has had activity", async () => {
    store.balances.set("m_acme:EUR", 0);
    const res = await request(app).get("/v1/balances").set({ "x-merchant-id": "m_acme" });
    expect(res.body.balances).toEqual([{ currency: "EUR", amountMinor: 0, amountDisplay: "0.00 EUR" }]);
  });
});
