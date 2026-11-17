import { vi } from "vitest";
import { logger } from "../../src/logger";
import { createRepositories } from "../../src/repositories";
import { TelegramLinkService } from "../../src/services/telegramLink.service";
import { TelegramBot, type BotClient } from "../../src/telegram/telegramBot";

export function createFakeBotClient() {
  return { on: vi.fn(), sendMessage: vi.fn().mockResolvedValue(undefined) };
}

/** A TelegramBot wired to the real repositories and a fake Bot API client. */
export function createTestBot({
  client = createFakeBotClient(),
  onChatLinked,
}: {
  client?: (BotClient & ReturnType<typeof createFakeBotClient>) | null;
  onChatLinked?: (profileId: string) => Promise<void>;
} = {}) {
  const bot = new TelegramBot({
    client,
    telegramLink: new TelegramLinkService(createRepositories()),
    mailer: { notifyAdmin: vi.fn().mockResolvedValue(undefined) },
    log: logger,
    onChatLinked,
  });
  return { bot, client };
}
