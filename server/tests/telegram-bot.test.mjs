import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { clearTestDb, connectTestDb, disconnectTestDb, require } from "./helpers/app.mjs";

const { TelegramBotService } = require("../../dist/services/telegramBotService");

function createFakeBot() {
  return { on: vi.fn(), sendMessage: vi.fn().mockResolvedValue(undefined) };
}

describe("TelegramBotService", () => {
  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  it("ignores messages without text instead of crashing", async () => {
    const service = new TelegramBotService("", { bot: createFakeBot() });
    await expect(service.handleMessage({ chat: { id: 1 } })).resolves.toBeUndefined();
  });

  it("logs instead of sending when no bot token is configured", async () => {
    const service = new TelegramBotService("");
    await expect(service.sendMessage(1, "hello")).resolves.toBeUndefined();
  });
});
