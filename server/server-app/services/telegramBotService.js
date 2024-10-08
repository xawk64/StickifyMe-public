const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user.model");
const Profile = require("../models/profile.model");

class TelegramBotService {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
    this.initializeHandlers();
  }

  initializeHandlers() {
    this.bot.on("message", this.handleMessage.bind(this));
  }

  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    console.log(chatId, messageText, "messageText");

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
      await this.sendMessage(
        chatId,
        "Чат настроен на получение данных об коэффициентах на складах в соответствии с вашими настройками"
      );
    } catch (error) {
      console.error("Error handling start command:", error);
      await this.sendMessage(
        chatId,
        "Произошла ошибка при настройке чата. Пожалуйста, попробуйте снова."
      );
    }
  }

  async handleInvalidStartCommand(chatId) {
    try {
      await this.sendMessage(
        chatId,
        "Вы перешли на бота не по ссылке из личного кабинета. Просьба нажать на кнопку 'Подключить telegram бота' в личном кабинете в разделе настройки"
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

  async sendWarehouseInfo(
    profileChatId,
    filteredWarehousesItems,
    oldCoefficientsByInfo
  ) {
    const botMsg = filteredWarehousesItems.reduce((msg, item) => {
      const oldCoeff =
        oldCoefficientsByInfo[
          `${item.warehouseID}${item.date}${item.boxTypeName}`
        ];

      msg += `Склад: ${item.warehouseName}\n🗓: ${item.date
        .split("T")[0]
        .split("-")
        .reverse()
        .join(".")}\nТип упаковки: ${item.boxTypeName}\nКоэффициент: ${
        item.coefficient === 0 ? "`бесплатно`" : `x${item.coefficient}`
      }${
        oldCoeff !== undefined
          ? `\nСтарый коэффициент: ${
              oldCoeff === 0 ? "`бесплатно`" : `x${oldCoeff}`
            }`
          : ""
      }\n \n`;
      return msg;
    }, "");

    await this.sendMessage(profileChatId, botMsg);
  }
}

module.exports = new TelegramBotService(process.env.telegramBotToken);
