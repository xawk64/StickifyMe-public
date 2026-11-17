import type { Express } from "express";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  db,
  disconnectTestDb,
} from "../helpers/app";
import { authed, registerUser } from "../helpers/users";

describe("profile access control", () => {
  let app: Express;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("does not expose another user's profile or WB API key", async () => {
    const victim = await registerUser(app);
    await db.profile.updateOne(
      { _id: victim.profileId },
      { wbApiKeyEncrypted: "victim-wb-key" },
    );
    const attacker = await registerUser(app);

    const byId = await request(app)
      .get(`/api/profile/${victim.profileId}`)
      .set(authed(attacker.token));
    const listing = await request(app)
      .get("/api/profile/any?page=1&limit=100")
      .set(authed(attacker.token));

    expect(JSON.stringify(byId.body)).not.toContain("victim-wb-key");
    expect(JSON.stringify(listing.body)).not.toContain("victim-wb-key");
  });
});

describe("profile update", () => {
  let app: Express;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("updates only whitelisted fields", async () => {
    const user = await registerUser(app);

    const res = await request(app).post("/api/profile/").set(authed(user.token)).send({
      fullName: "Shop LLC",
      chatId: 424242,
      avatarUrl: "https://evil.example/x.svg",
    });

    expect(res.status).toBe(200);
    const profile = (await db.profile.findById(user.profileId))!;
    expect(profile.fullName).toBe("Shop LLC");
    expect(profile.chatId).toBeUndefined();
    expect(profile.avatarUrl).toBeUndefined();
  });
});
