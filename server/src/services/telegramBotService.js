const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user.model");
const Profile = require("../models/profile.model");
const { notifyAdmin } = require("../utils/sendEmail");
const templates = require("../emails/templates");
const { config } = require("../config");
const { hashToken } = require("../utils/tokens");

const LINK_TOKEN_PATTERN = /^[\w-]{20,64}$/;

class TelegramBotService {
  /**
   * @param {string} token bot token; without it messages are only logged
   * @param {{ bot?: object }} [options] inject a bot client (tests)
   */
  constructor(token, options = {}) {
    this.bot = options.bot || null;
    if (!this.bot && token) {
      try {
        this.bot = new TelegramBot(token, { polling: true });
      } catch (error) {
        console.error("Error initializing Telegram bot:", error);
      }
    }
    if (!this.bot) {
      console.log("Telegram bot token is not set: notifications will be logged only");
      return;
    }
    this.initializeHandlers();
  }

  initializeHandlers() {
    this.bot.on("message", this.handleMessage.bind(this));
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    // stickers, photos etc. have no text
    const messageText = msg.text || "";

    if (messageText.startsWith("/start")) {
      const linkToken = messageText.split("/start ")[1];

      if (linkToken && LINK_TOKEN_PATTERN.test(linkToken)) {
        await this.handleStartCommand(linkToken, chatId);
      } else {
        await this.handleInvalidStartCommand(chatId);
      }
    }
  }

  async handleStartCommand(linkToken, chatId) {
    try {
      // Atomically consume the one-time token: it cannot be replayed.
      const profile = await Profile.findOneAndUpdate(
        {
          telegramLinkTokenHash: hashToken(linkToken),
          telegramLinkTokenExpires: { $gt: new Date() },
        },
        {
          $set: { chatId },
          $unset: { telegramLinkTokenHash: 1, telegramLinkTokenExpires: 1 },
        },
      );
      if (!profile) {
        throw new Error("Link token is invalid or expired");
      }
      const user = await User.findOne({ profileId: String(profile._id) });

      notifyAdmin(
        templates.adminTelegramConnected({
          email: user?.email,
          username: user?.username,
          chatId,
        }),
      );

      await this.sendMessage(
        chatId,
        "Чат настроен на получение данных об коэффициентах на складах в соответствии с вашими настройками",
      );
    } catch (error) {
      console.error("Error handling start command:", error);
      await this.sendMessage(
        chatId,
        "Произошла ошибка при настройке чата. Пожалуйста, попробуйте снова.",
      );
    }
  }

  async handleInvalidStartCommand(chatId) {
    try {
      await this.sendMessage(
        chatId,
        "Вы перешли на бота не по ссылке из личного кабинета. Просьба нажать на кнопку 'Подключить telegram бота' в личном кабинете в разделе настройки",
      );
      await this.resetProfile(chatId);
    } catch (error) {
      console.error("Error handling invalid start command:", error);
    }
  }

  async updateProfile(profileId, chatId) {
    await Profile.updateOne({ _id: profileId }, { $set: { chatId } });
  }

  async resetProfile(chatId) {
    await Profile.updateOne({ chatId }, { $set: { chatId: null } });
  }

  async sendMessage(chatId, message) {
    if (!this.bot) {
      console.log(`[telegram:dry-run] chat=${chatId}\n${message}`);
      return;
    }
    await this.bot.sendMessage(chatId, message, { parse_mode: "markdown" });
  }

  async sendWarehouseInfo(profileChatId, filteredWarehousesItems, oldCoefficientsByInfo) {
    const botMsg = filteredWarehousesItems.reduce((msg, item) => {
      const oldCoeff =
        oldCoefficientsByInfo[`${item.warehouseID}${item.date}${item.boxTypeName}`];

      msg += `Склад: ${item.warehouseName}\n🗓: ${item.date
        .split("T")[0]
        .split("-")
        .reverse()
        .join(".")}\nТип упаковки: ${item.boxTypeName}\nКоэффициент: ${
        item.coefficient === 0
          ? "`бесплатно`"
          : item.coefficient === -1
            ? "нет приёмки"
            : `x${item.coefficient}`
      }${
        oldCoeff !== undefined
          ? `\nПрошлый коэффициент: ${
              oldCoeff === 0
                ? "`бесплатно`"
                : oldCoeff === -1
                  ? "нет приёмки"
                  : `x${oldCoeff}`
            }`
          : ""
      }\n \n`;
      return msg;
    }, "");

    await this.sendMessage(profileChatId, botMsg);
  }
}

module.exports = new TelegramBotService(config.telegramBotToken);
module.exports.TelegramBotService = TelegramBotService;
