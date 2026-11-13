import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { Store } from "../src/store.js";

const MERCHANT = { "x-merchant-id": "m_acme" };

describe("payouts API", () => {
  let store: Store;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    store = new Store();
    app = createApp(store);
  });

  it("pays out an even split in the same currency", async () => {
    store.balances.set("m_acme:USD", 10_000);

    const res = await request(app)
      .post("/v1/payouts")
      .set(MERCHANT)
      .send({ totalMinor: 6_000, currency: "USD", payoutCurrency: "USD", recipients: ["r_1", "r_2", "r_3"] });

    expect(res.status).toBe(201);
    expect(res.body.payouts).toHaveLength(3);
    expect(res.body.payouts[0]).toMatchObject({ amountMinor: 2_000, currency: "USD", amountDisplay: "20.00 USD" });
    expect(store.balances.get("m_acme:USD")).toBe(4_000);
  });
});
