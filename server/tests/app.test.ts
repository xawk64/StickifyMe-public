import type { Express } from "express";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  disconnectTestDb,
} from "./helpers/app";

describe("app smoke test", () => {
  let app: Express;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("responds on the root endpoint", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "StickifyMe API" });
  });

  it("signs up and signs in a user", async () => {
    const credentials = {
      username: "seller",
      email: "seller@example.com",
      password: "password123",
    };

    const signup = await request(app).post("/api/auth/signup").send(credentials);
    expect(signup.status).toBe(200);

    const signin = await request(app)
      .post("/api/auth/signin")
      .send({ username: credentials.email, password: credentials.password });
    expect(signin.status).toBe(200);
    expect(signin.body.accessToken).toEqual(expect.any(String));
    expect(signin.body.username).toBe("seller");
  });
});
