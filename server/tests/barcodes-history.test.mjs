import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  db,
  disconnectTestDb,
} from "./helpers/app.mjs";
import { makeOrder } from "./helpers/fixtures.mjs";
import { authed, registerUser } from "./helpers/users.mjs";

describe("barcodes history", () => {
  let app;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("returns the id of the saved history entry", async () => {
    const user = await registerUser(app);

    const added = await request(app)
      .post("/api/barcodes-history/add")
      .set(authed(user.token))
      .send({ type: "wb", orders: [makeOrder(1)] });

    expect(added.status).toBe(200);
    const fetched = await request(app)
      .get(`/api/barcodes/history/${added.body.id}`)
      .set(authed(user.token));
    expect(fetched.body._id).toBe(added.body.id);
    expect(fetched.body.ordersCount).toBe(1);
  });
});

describe("monitoring settings", () => {
  let app;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("returns the user's monitoring settings", async () => {
    const user = await registerUser(app);
    const res = await request(app)
      .get("/api/warehouses/settings/get")
      .set(authed(user.token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ enabled: true, items: [] });
  });

  it("answers 404 for a token of a deleted user instead of crashing", async () => {
    const user = await registerUser(app);
    await db.user.deleteOne({ _id: user.userId });

    const res = await request(app)
      .get("/api/warehouses/settings/get")
      .set(authed(user.token));
    expect(res.status).toBe(404);
  });
});
