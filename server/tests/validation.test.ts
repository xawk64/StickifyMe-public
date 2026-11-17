import type { Express } from "express";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  disconnectTestDb,
} from "./helpers/app";
import { makeOrder } from "./helpers/fixtures";
import { authed, registerUser, type TestUser } from "./helpers/users";

describe("request validation", () => {
  let app: Express;
  let user: TestUser;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("rejects a label with an invalid EAN-13 barcode with 400, not 500", async () => {
    user = await registerUser(app);
    const order = makeOrder(1);
    order.product.barcode = "not-a-barcode";

    const res = await request(app)
      .post("/api/barcodes/generate")
      .set(authed(user.token))
      .send({ mode: "thermo", withEAC: false, orders: [order] });

    expect(res.status).toBe(400);
  });

  it("rejects an unknown print mode", async () => {
    user = await registerUser(app);
    const res = await request(app)
      .post("/api/barcodes/generate")
      .set(authed(user.token))
      .send({ mode: "letter", withEAC: false, orders: [makeOrder(1)] });
    expect(res.status).toBe(400);
  });

  it("rejects a malformed history id with 400", async () => {
    user = await registerUser(app);
    const res = await request(app)
      .get("/api/barcodes/history/not-an-object-id")
      .set(authed(user.token));
    expect(res.status).toBe(400);
  });

  it("rejects non-numeric pagination", async () => {
    user = await registerUser(app);
    const res = await request(app)
      .get("/api/barcodes/history?page=abc&limit=10")
      .set(authed(user.token));
    expect(res.status).toBe(400);
  });

  it("rejects monitoring settings with a negative coefficient", async () => {
    user = await registerUser(app);
    const res = await request(app)
      .post("/api/warehouses/settings")
      .set(authed(user.token))
      .send({
        settings: {
          enabled: true,
          items: [
            {
              ID: 507,
              boxTypes: ["Короба"],
              coeff: -5,
              dateStart: "2024-10-01",
              dateEnd: "2024-10-10",
            },
          ],
        },
      });
    expect(res.status).toBe(400);
  });

  it("rejects an empty support message", async () => {
    user = await registerUser(app);
    const res = await request(app)
      .post("/api/support/feedback")
      .set(authed(user.token))
      .send({ type: "problem", message: "" });
    expect(res.status).toBe(400);
  });
});
