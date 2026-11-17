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
import { registerUser } from "../helpers/users";

describe("authentication hardening", () => {
  let app: Express;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("answers an unknown user and a wrong password identically", async () => {
    const user = await registerUser(app);

    const unknown = await request(app)
      .post("/api/auth/signin")
      .send({ username: "nobody", password: "password123" });
    const wrongPassword = await request(app)
      .post("/api/auth/signin")
      .send({ username: user.username, password: "wrong-password" });

    expect(unknown.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(unknown.body).toEqual(wrongPassword.body);
  });

  it("does not reveal whether an email is registered on password reset", async () => {
    const user = await registerUser(app);

    const known = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: user.email });
    const unknown = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: "nobody@example.com" });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual(known.body);
  });

  it("stores only a hash of the password reset token", async () => {
    const user = await registerUser(app);
    await request(app).post("/api/auth/reset-password").send({ email: user.email });

    const stored = (await db.user.findById(user.userId))!.resetPasswordToken;
    expect(stored).toMatch(/^[a-f0-9]{64}$/);

    // the stored value itself must not work as a token
    const res = await request(app)
      .post("/api/auth/confirm-reset-password")
      .send({ token: stored, password: "new-password-123" });
    expect(res.status).toBe(400);
  });

  it("hashes passwords with bcrypt cost 12", async () => {
    const user = await registerUser(app);
    const { password } = (await db.user.findById(user.userId))!;
    expect(password).toMatch(/^\$2[aby]\$12\$/);
  });
});
