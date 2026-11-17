import type { Express } from "express";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  db,
  disconnectTestDb,
} from "../helpers/app";
import { PNG_1PX_BASE64 } from "../helpers/fixtures";
import { authed, registerUser, type TestUser } from "../helpers/users";

const png = Buffer.from(PNG_1PX_BASE64, "base64");
const uploadsDir = process.env.UPLOADS_DIR as string;

describe("avatar upload", () => {
  let app: Express;
  let user: TestUser;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(async () => {
    fs.rmSync(uploadsDir, { recursive: true, force: true });
    await disconnectTestDb();
  });

  const upload = (buffer: Buffer, filename: string, contentType: string) =>
    request(app)
      .post("/api/upload-avatar")
      .set(authed(user.token))
      .attach("avatar", buffer, { filename, contentType });

  it("stores the file under a server-generated name inside the avatars directory", async () => {
    user = await registerUser(app);
    const res = await upload(png, "../../escape.png", "image/png");

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toMatch(/^\/uploads\/avatars\/[\w-]+\.png$/);
    expect(
      fs.existsSync(path.join(uploadsDir, res.body.avatarUrl.replace("/uploads", ""))),
    ).toBe(true);
    expect(
      fs.existsSync(path.resolve(uploadsDir, "avatars", "..", "..", "escape.png")),
    ).toBe(false);

    const profile = (await db.profile.findById(user.profileId))!;
    expect(profile.avatarUrl).toBe(res.body.avatarUrl);
  });

  it("rejects files that are not images even with an image content type", async () => {
    user = await registerUser(app);
    const html = Buffer.from("<script>alert(document.cookie)</script>");

    const res = await upload(html, "avatar.png", "image/png");

    expect(res.status).toBe(400);
  });

  it("rejects files larger than the avatar size limit", async () => {
    user = await registerUser(app);
    const big = Buffer.concat([png, Buffer.alloc(3 * 1024 * 1024)]);

    const res = await upload(big, "big.png", "image/png");

    expect(res.status).toBe(413);
  });
});
