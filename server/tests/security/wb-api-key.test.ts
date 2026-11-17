import type { Express } from "express";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { WbAuthError } from "../../src/integrations/wb/errors";
import type { WbClient } from "../../src/integrations/wb/wbClient";
import { SecretBox } from "../../src/utils/secretBox";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  db,
  disconnectTestDb,
  testSecretBox,
} from "../helpers/app";
import { authed, registerUser } from "../helpers/users";

const WB_KEY = "eyJ-real-looking-wb-api-key-0123456789";

describe("WB API key storage", () => {
  let app: Express;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("stores the key encrypted and never returns it to the client", async () => {
    const user = await registerUser(app);

    const saved = await request(app)
      .put("/api/profile/wb-api-key")
      .set(authed(user.token))
      .send({ apiKey: WB_KEY });
    expect(saved.status).toBe(200);

    const profile = (await db.profile.findById(user.profileId))!;
    expect(profile.wbApiKeyEncrypted).toMatch(/^v1\./);
    expect(profile.wbApiKeyEncrypted).not.toContain(WB_KEY);
    expect(testSecretBox.decrypt(profile.wbApiKeyEncrypted!)).toBe(WB_KEY);

    const me = await request(app).get("/api/auth/me").set(authed(user.token));
    const signin = await request(app)
      .post("/api/auth/signin")
      .send({ username: user.username, password: user.password });
    for (const res of [me, signin]) {
      expect(res.body.hasWbApiKey).toBe(true);
      expect(JSON.stringify(res.body)).not.toContain(WB_KEY);
      expect(res.body).not.toHaveProperty("wbApiKey");
    }
  });

  it("rejects a key that WB does not accept and stores nothing", async () => {
    const rejectingClient = {
      ping: async () => {
        throw new WbAuthError("unauthorized", 401);
      },
    } as unknown as WbClient;
    const appWithRejectingWb = createTestApp({ wbClient: rejectingClient });
    const user = await registerUser(appWithRejectingWb);

    const res = await request(appWithRejectingWb)
      .put("/api/profile/wb-api-key")
      .set(authed(user.token))
      .send({ apiKey: WB_KEY });

    expect(res.status).toBe(400);
    expect(
      (await db.profile.findById(user.profileId))!.wbApiKeyEncrypted,
    ).toBeUndefined();
  });

  it("cannot be set through the generic profile update anymore", async () => {
    const user = await registerUser(app);
    await request(app)
      .post("/api/profile/")
      .set(authed(user.token))
      .send({ fullName: "Shop", wbApiKey: WB_KEY });
    const profile = (await db.profile.findById(user.profileId))!;
    expect(JSON.stringify(profile.toObject())).not.toContain(WB_KEY);
  });
});

describe("SecretBox", () => {
  it("detects tampering and a wrong key", () => {
    const token = testSecretBox.encrypt("secret");
    const parts = token.split(".");
    const tampered = [
      ...parts.slice(0, 3),
      Buffer.from("other").toString("base64url"),
    ].join(".");
    expect(() => testSecretBox.decrypt(tampered)).toThrow();
    expect(() => new SecretBox(Buffer.alloc(32, 7)).decrypt(token)).toThrow();
  });
});
