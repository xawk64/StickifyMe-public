const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user.model");
const Profile = require("../models/profile.model");
const { sendEmail } = require("../utils/sendEmail");
const config = require("../config");

class TelegramBotService {
  constructor(token) {
    if (!token) {
      console.error("Error initializing Telegram bot: no token provided!");
      return;
    }
    try {
      this.bot = new TelegramBot(token, { polling: true });
      this.initializeHandlers();
    } catch (error) {
      console.error("Error initializing Telegram bot:", error);
    }
  }

  initializeHandlers() {
    this.bot.on("message", this.handleMessage.bind(this));
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    if (messageText.startsWith("/start")) {
      const userId = messageText.split("/start ")[1];

      if (userId) {
        await this.handleStartCommand(userId, chatId);
      } else {
        await this.handleInvalidStartCommand(chatId);
      }
    }
  }

  async handleStartCommand(userId, chatId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.profileId) {
        throw new Error("User or profile not found");
      }

      await this.updateProfile(user.profileId, chatId);

      // Добавить в метод handleStartCommand после строки 47
      sendEmail(
        config.adminEmail,
        "Подключение Telegram бота",
        `Пользователь подключил Telegram бота:<br/>
         Email: ${user.email}<br/>
         Username: ${user.username}<br/>
         ChatId: ${chatId}<br/>
         Дата: ${new Date().toLocaleString()}`,
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
