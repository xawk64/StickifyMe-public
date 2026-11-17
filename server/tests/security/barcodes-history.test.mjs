import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  disconnectTestDb,
} from "../helpers/app.mjs";
import { makeOrder } from "../helpers/fixtures.mjs";
import { authed, registerUser } from "../helpers/users.mjs";

describe("barcodes history access control", () => {
  let app;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  async function addHistory(user, title) {
    const res = await request(app)
      .post("/api/barcodes-history/add")
      .set(authed(user.token))
      .send({ type: "wb", orders: [makeOrder(1, { product: { title } })] });
    expect(res.status).toBe(200);
  }

  it("does not list other users' history", async () => {
    const victim = await registerUser(app);
    await addHistory(victim, "victim-secret-product");
    const attacker = await registerUser(app);

    const res = await request(app)
      .get("/api/barcodes-history")
      .set(authed(attacker.token));

    expect(JSON.stringify(res.body)).not.toContain("victim-secret-product");
  });
});
