import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEMO_USER, seed } from "../src/scripts/seed";
import {
  connectTestDb,
  createTestApp,
  db,
  disconnectTestDb,
  testSecretBox,
} from "./helpers/app";

describe("demo seed", () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  it("creates a ready-to-use demo account and is idempotent", async () => {
    await seed();
    await seed();

    expect(await db.user.countDocuments({ username: DEMO_USER.username })).toBe(1);
    const user = (await db.user.findOne({ username: DEMO_USER.username }))!;
    const profile = (await db.profile.findById(user.profileId))!;
    expect(testSecretBox.decrypt(profile.wbApiKeyEncrypted!)).toBe("demo-wb-api-key");
    expect(
      (await db.warehouseSettings.findOne({ userProfileId: user.profileId }))!.enabled,
    ).toBe(true);
    expect(await db.barcodesHistory.countDocuments({ userId: user.id })).toBe(2);

    const signin = await request(createTestApp())
      .post("/api/auth/signin")
      .send({ username: DEMO_USER.username, password: DEMO_USER.password });
    expect(signin.status).toBe(200);
    expect(signin.body.hasWbApiKey).toBe(true);
  });
});
