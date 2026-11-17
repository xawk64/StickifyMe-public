import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  db,
  disconnectTestDb,
} from "./helpers/app.mjs";

describe("auth", () => {
  let app;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("persists user, profile and monitoring documents before responding to signup", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      username: "seller",
      email: "seller@example.com",
      password: "password123",
    });
    expect(res.status).toBe(200);

    const user = await db.user.findOne({ username: "seller" });
    expect(user.profileId).toBeTruthy();
    const [profile, warehouse, settings] = await Promise.all([
      db.profile.findById(user.profileId),
      db.warehouse.findOne({ userProfileId: user.profileId }),
      db.warehouseSettings.findOne({ userProfileId: user.profileId }),
    ]);
    expect(profile.fullName).toBe("seller");
    expect(warehouse).not.toBeNull();
    expect(settings.enabled).toBe(true);
  });
});
