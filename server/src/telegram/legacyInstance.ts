// Transitional shared instance for the monitoring module until the composition root wires it.
import { config } from "../config";
import { logger } from "../logger";
import { mailer } from "../mail/mailer";
import { createRepositories } from "../repositories";
import { TelegramLinkService } from "../services/telegramLink.service";
import { TelegramBot, createBotClient } from "./telegramBot";

export const telegramBot = new TelegramBot({
  client: createBotClient(config.telegramBotToken),
  telegramLink: new TelegramLinkService(createRepositories()),
  mailer,
  log: logger,
});
telegramBot.start();
