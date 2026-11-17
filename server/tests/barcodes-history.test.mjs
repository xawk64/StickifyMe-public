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

describe("barcodes history listing", () => {
  let app;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  const add = (user, count) =>
    request(app)
      .post("/api/barcodes-history/add")
      .set(authed(user.token))
      .send({
        type: "wb",
        orders: Array.from({ length: count }, (_, i) => makeOrder(i)),
      });

  it("paginates the user's entries in insertion order without heavy fields", async () => {
    const user = await registerUser(app);
    await add(user, 1);
    await add(user, 2);
    await add(user, 3);

    const res = await request(app)
      .get("/api/barcodes/history?page=2&limit=2")
      .set(authed(user.token));

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].ordersCount).toBe(3);
    expect(res.body.items[0].orders).toBeUndefined();
    expect(res.body.items[0].userId).toBeUndefined();
  });

  it("returns an empty object for another user's entry", async () => {
    const owner = await registerUser(app);
    const added = await add(owner, 1);
    const other = await registerUser(app);

    const res = await request(app)
      .get(`/api/barcodes/history/${added.body.id}`)
      .set(authed(other.token));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
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
