import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectTestDb, createTestApp, disconnectTestDb } from "./helpers/app.mjs";

describe("error handling", () => {
  let app;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterAll(disconnectTestDb);

  it("answers unknown routes with a JSON 404", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.message).toEqual(expect.any(String));
  });

  it("answers malformed JSON with a JSON 400 instead of an HTML stack trace", async () => {
    const res = await request(app)
      .post("/api/auth/signin")
      .set("Content-Type", "application/json")
      .send('{"username":');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Некорректный JSON" });
    expect(res.text).not.toContain("SyntaxError");
  });
});

describe("request size limits", () => {
  let app;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterAll(disconnectTestDb);

  it("rejects a large JSON body on regular endpoints", async () => {
    const res = await request(app)
      .post("/api/auth/signin")
      .send({ username: "x".repeat(2 * 1024 * 1024), password: "y" });
    expect(res.status).toBe(413);
  });
});
