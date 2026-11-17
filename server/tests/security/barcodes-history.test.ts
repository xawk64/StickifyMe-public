import type { Express } from "express";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  disconnectTestDb,
} from "../helpers/app";
import { makeOrder } from "../helpers/fixtures";
import { authed, registerUser, type TestUser } from "../helpers/users";

describe("barcodes history access control", () => {
  let app: Express;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  async function addHistory(user: TestUser, title: string) {
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

describe("barcode endpoints authentication", () => {
  let app: Express;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("rejects anonymous history requests instead of returning everybody's history", async () => {
    const victim = await registerUser(app);
    await request(app)
      .post("/api/barcodes-history/add")
      .set(authed(victim.token))
      .send({ type: "wb", orders: [makeOrder(1)] });

    const res = await request(app).get("/api/barcodes/history?page=1&limit=10");

    expect(res.status).toBe(403);
    expect(res.body.items).toBeUndefined();
  });

  it("rejects an invalid token with 401 and keeps serving requests", async () => {
    const res = await request(app)
      .get("/api/barcodes/history?page=1&limit=10")
      .set(authed("not-a-jwt"));
    expect(res.status).toBe(401);

    const health = await request(app).get("/");
    expect(health.status).toBe(200);
  });

  it("rejects anonymous label generation", async () => {
    const res = await request(app)
      .post("/api/barcodes/generate")
      .send({ mode: "thermo", withEAC: false, orders: [makeOrder(1)] });
    expect(res.status).toBe(403);
  });
});
