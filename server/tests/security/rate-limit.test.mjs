import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectTestDb, disconnectTestDb, require } from "../helpers/app.mjs";

describe("auth rate limiting", () => {
  let app;

  beforeAll(async () => {
    await connectTestDb();
    const { createApp } = require("../../server-app/app");
    app = createApp({ authRateLimit: { windowMs: 60_000, limit: 3 } });
  });
  afterAll(disconnectTestDb);

  it("returns 429 after too many sign-in attempts from one client", async () => {
    const attempt = () =>
      request(app).post("/api/auth/signin").send({ username: "x", password: "y" });

    for (let i = 0; i < 3; i += 1) {
      expect((await attempt()).status).toBe(401);
    }
    expect((await attempt()).status).toBe(429);
  });
});
