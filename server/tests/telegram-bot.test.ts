import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { clearTestDb, connectTestDb, disconnectTestDb } from "./helpers/app";
import { createTestBot } from "./helpers/telegram";

describe("TelegramBot", () => {
  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("ignores messages without text instead of crashing", async () => {
    const { bot } = createTestBot();
    await expect(bot.handleMessage({ chat: { id: 1 } })).resolves.toBeUndefined();
  });

  it("logs instead of sending when no bot token is configured", async () => {
    const { bot } = createTestBot({ client: null });
    await expect(bot.sendMessage(1, "hello")).resolves.toBeUndefined();
  });

  it("asks to use the link from the web app for a bare /start", async () => {
    const { bot, client } = createTestBot();
    await bot.handleMessage({ chat: { id: 7 }, text: "/start" });
    expect(client!.sendMessage).toHaveBeenCalledWith(
      7,
      expect.stringContaining("не по ссылке"),
      expect.anything(),
    );
  });
});
