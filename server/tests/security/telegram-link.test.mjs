import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  db,
  disconnectTestDb,
  require,
} from "../helpers/app.mjs";
import { authed, registerUser } from "../helpers/users.mjs";

const { TelegramBotService } = require("../../dist/services/telegramBotService");

describe("telegram account linking", () => {
  let app;
  let bot;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  const startCommand = (payload, chatId) => {
    bot = { on: vi.fn(), sendMessage: vi.fn().mockResolvedValue(undefined) };
    const service = new TelegramBotService("", { bot });
    return service.handleMessage({ chat: { id: chatId }, text: `/start ${payload}` });
  };

  it("does not link a chat to an account by its user id", async () => {
    const victim = await registerUser(app);

    await startCommand(victim.userId, 777);

    const profile = await db.profile.findById(victim.profileId);
    expect(profile.chatId).toBeUndefined();
  });

  it("links a chat with a one-time token issued to the logged-in user", async () => {
    const user = await registerUser(app);
    const res = await request(app)
      .post("/api/telegram/link-token")
      .set(authed(user.token));
    expect(res.status).toBe(200);
    expect(res.body.token).toMatch(/^[\w-]{20,64}$/);

    await startCommand(res.body.token, 555);
    expect((await db.profile.findById(user.profileId)).chatId).toBe(555);

    // the token cannot be reused for another chat
    await startCommand(res.body.token, 666);
    expect((await db.profile.findById(user.profileId)).chatId).toBe(555);
  });

  it("requires authentication to issue a link token", async () => {
    const res = await request(app).post("/api/telegram/link-token");
    expect(res.status).toBe(403);
  });
});
