import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  db,
  disconnectTestDb,
} from "../helpers/app.mjs";
import { authed, registerUser } from "../helpers/users.mjs";

describe("profile access control", () => {
  let app;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("does not expose another user's profile or WB API key", async () => {
    const victim = await registerUser(app);
    await db.profile.updateOne({ _id: victim.profileId }, { wbApiKey: "victim-wb-key" });
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
