import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  db,
  disconnectTestDb,
} from "../helpers/app.mjs";
import { registerUser } from "../helpers/users.mjs";

describe("NoSQL operator injection", () => {
  let app;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("rejects query operators in signin credentials and keeps the server alive", async () => {
    await registerUser(app);

    const res = await request(app)
      .post("/api/auth/signin")
      .send({ username: { $ne: null }, password: { $ne: null } });

    expect(res.status).toBe(400);
    expect(res.body.accessToken).toBeUndefined();
    expect((await request(app).get("/")).status).toBe(200);
  });

  it("does not issue a password reset token for an operator-matched user", async () => {
    const victim = await registerUser(app);

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: { $ne: null } });

    expect(res.status).toBe(400);
    const user = await db.user.findById(victim.userId);
    expect(user.resetPasswordToken).toBeUndefined();
  });

  it("rejects operator payloads in email verification", async () => {
    const res = await request(app)
      .post("/api/auth/verify")
      .send({ hash: { $ne: null } });
    expect(res.status).toBe(400);
  });
});
