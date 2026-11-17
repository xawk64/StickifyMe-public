import TelegramBotApi from "node-telegram-bot-api";
import type { Logger } from "../logger";
import * as templates from "../mail/templates";
import type { MailSender } from "../services/auth.service";
import type { TelegramLinkService } from "../services/telegramLink.service";

/** The part of the Bot API client the app uses (faked in tests). */
export interface BotClient {
  on(event: "message", listener: (msg: TelegramBotApi.Message) => void): unknown;
  sendMessage(
    chatId: number,
    text: string,
    options?: TelegramBotApi.SendMessageOptions,
  ): Promise<unknown>;
}

export interface TelegramBotDeps {
  client: BotClient | null;
  telegramLink: Pick<TelegramLinkService, "linkChat" | "unlinkChat">;
  mailer: Pick<MailSender, "notifyAdmin">;
  log: Logger;
}

const MESSAGES = {
  linked:
    "Чат настроен на получение данных об коэффициентах на складах в соответствии с вашими настройками",
  linkFailed: "Произошла ошибка при настройке чата. Пожалуйста, попробуйте снова.",
  notFromCabinet:
    "Вы перешли на бота не по ссылке из личного кабинета. Просьба нажать на кнопку 'Подключить telegram бота' в личном кабинете в разделе настройки",
};

/**
 * Telegram side of the product: links chats to accounts (/start <one-time token>)
 * and delivers monitoring notifications. Without a client (no token) it only logs.
 */
export class TelegramBot {
  constructor(private readonly deps: TelegramBotDeps) {}

  start(): void {
    if (!this.deps.client) {
      this.deps.log.warn(
        "TELEGRAM_BOT_TOKEN is not set: notifications will be logged only",
      );
      return;
    }
    this.deps.client.on("message", (msg) => {
      this.handleMessage(msg).catch((err: unknown) =>
        this.deps.log.error({ err }, "telegram message handling failed"),
      );
    });
  }

  async handleMessage(msg: Pick<TelegramBotApi.Message, "chat" | "text">): Promise<void> {
    const chatId = msg.chat.id;
    // stickers, photos etc. have no text
    const text = msg.text ?? "";
    if (!text.startsWith("/start")) {
      return;
    }
    const token = text.split("/start ")[1];
    if (token) {
      await this.linkChat(token, chatId);
    } else {
      await this.sendMessage(chatId, MESSAGES.notFromCabinet);
      await this.deps.telegramLink.unlinkChat(chatId);
    }
  }

  private async linkChat(token: string, chatId: number): Promise<void> {
    const linked = await this.deps.telegramLink.linkChat(token, chatId);
    if (!linked) {
      this.deps.log.info({ chatId }, "telegram link token is invalid or expired");
      await this.sendMessage(chatId, MESSAGES.linkFailed);
      return;
    }
    void this.deps.mailer.notifyAdmin(
      templates.adminTelegramConnected({
        email: linked.user?.email,
        username: linked.user?.username,
        chatId,
      }),
    );
    await this.sendMessage(chatId, MESSAGES.linked);
  }

  /** Kept until message formatting moves into the monitoring module. */
  async sendWarehouseInfo(
    chatId: number,
    items: {
      warehouseID: number;
      warehouseName: string;
      date: string;
      boxTypeName: string;
      coefficient: number;
    }[],
    oldCoefficients: Record<string, number>,
  ): Promise<void> {
    const formatCoefficient = (value: number) =>
      value === 0 ? "`бесплатно`" : value === -1 ? "нет приёмки" : `x${value}`;
    const message = items.reduce((text, item) => {
      const oldCoefficient =
        oldCoefficients[`${item.warehouseID}${item.date}${item.boxTypeName}`];
      const date = item.date.split("T")[0]?.split("-").reverse().join(".");
      return (
        text +
        `Склад: ${item.warehouseName}\n🗓: ${date}\nТип упаковки: ${item.boxTypeName}\n` +
        `Коэффициент: ${formatCoefficient(item.coefficient)}` +
        (oldCoefficient !== undefined
          ? `\nПрошлый коэффициент: ${formatCoefficient(oldCoefficient)}`
          : "") +
        "\n \n"
      );
    }, "");
    await this.sendMessage(chatId, message);
  }

  async sendMessage(chatId: number, text: string): Promise<void> {
    if (!this.deps.client) {
      this.deps.log.info({ chatId, text }, "telegram dry-run: message not sent");
      return;
    }
    await this.deps.client.sendMessage(chatId, text, { parse_mode: "Markdown" });
  }
}

export function createBotClient(token: string): BotClient | null {
  return token ? new TelegramBotApi(token, { polling: true }) : null;
}
