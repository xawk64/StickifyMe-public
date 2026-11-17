import { vi } from "vitest";
import { require } from "./app.mjs";

const { TelegramBot } = require("../../dist/telegram/telegramBot");
const { TelegramLinkService } = require("../../dist/services/telegramLink.service");
const { createRepositories } = require("../../dist/repositories");
const { logger } = require("../../dist/logger");

export function createFakeBotClient() {
  return { on: vi.fn(), sendMessage: vi.fn().mockResolvedValue(undefined) };
}

/** A TelegramBot wired to the real repositories and a fake Bot API client. */
export function createTestBot({ client = createFakeBotClient() } = {}) {
  const bot = new TelegramBot({
    client,
    telegramLink: new TelegramLinkService(createRepositories()),
    mailer: { notifyAdmin: vi.fn().mockResolvedValue(undefined) },
    log: logger,
  });
  return { bot, client };
}
