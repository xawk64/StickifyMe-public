// warehouseChecker.js

const User = require("../models/user.model");
const Profile = require("../models/profile.model");
const WarehouseSettings = require("../models/warehouseSettings.model");
const Warehouses = require("../models/warehouse.model");
const TelegramBotService = require("./telegramBotService");

const config = require("../config");

const timeoutInterval = config.monitoringIntervalMs;

class WarehouseChecker {
  constructor(profile, settings, warehouses) {
    this.profile = profile;
    this.settings = settings;
    this.warehouses = warehouses;
    this.isChecking = false;
    this.intervalId = null;
  }

  startCheckCycle() {
    if (!this.isChecking) {
      this.isChecking = true;
      this.intervalId = setInterval(() => {
        this.performCheck();
      }, timeoutInterval);
    }
  }

  restartCheckCycle(newSettings) {
    this.settings = newSettings;
    this.warehouses = { items: [], userProfileId: this.profile._id };
    this.stopCheckCycle();
    this.startCheckCycle();
  }

  stopCheckCycle() {
    if (this.isChecking && this.intervalId) {
      clearInterval(this.intervalId);
      this.isChecking = false;
    }
  }

  async performCheck() {
    try {
      console.log("Проверка информации о складах...");

      const settings = this.settings;
      if (!settings) {
        throw new Error("Warehouse settings not found");
      }

      const warehouses = this.warehouses.items;

      const warehouseSettingsById = {};
      const warehouseIDs = settings.items
        .map((item) => {
          warehouseSettingsById[item.ID] = item;
          return item.ID;
        })
        .join(",");

      let warehousesItemsResponse;
      try {
        warehousesItemsResponse = await fetch(
          `https://supplies-api.wildberries.ru/api/v1/acceptance/coefficients?warehouseIDs=${warehouseIDs}`,
          {
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
              Authorization: this.profile.wbApiKey,
            },
          }
        );
      } catch (fetchError) {
        console.error(
          "Ошибка при запросе к API Wildberries:",
          fetchError.message
        );
        return;
      }

      let warehousesItems;
      try {
        warehousesItems = await warehousesItemsResponse.json();
      } catch (jsonError) {
        console.error("Ошибка при парсинге ответа:", jsonError.message);
        return;
      }

      if (!Array.isArray(warehousesItems) && warehousesItems?.detail) {
        console.log(
          "Ошибка получения данных складов: " + warehousesItems.detail
        );
        return;
      }

      let isItemInOldWarehouseInfoChanged = false;
      let isNewWarehouseAdded = false;

      const oldCoefficientsByInfo = {};

      const newWarehouses = [];
      const filteredWarehousesItems = warehousesItems.filter((item) => {
        try {
          const settingsItem = warehouseSettingsById[item.warehouseID];
          const oldInfo = warehouses.find(
            (warehouse) =>
              warehouse.date === item.date &&
              warehouse.warehouseID === item.warehouseID &&
              warehouse.boxTypeName === item.boxTypeName
          );
          const condition =
            item.coefficient > -1 &&
            new Date(item.date) >= new Date(settingsItem.dateStart) &&
            new Date(item.date) <= new Date(settingsItem.dateEnd) &&
            settingsItem.boxTypes.includes(item.boxTypeName) &&
            item.coefficient <= settingsItem.coeff &&
            (oldInfo ? item.coefficient !== oldInfo.coefficient : true);

          if (condition && !oldInfo) {
            isNewWarehouseAdded = true;
            newWarehouses.push(item);
          }
          if (oldInfo && oldInfo.coefficient !== item.coefficient) {
            oldCoefficientsByInfo[
              `${item.warehouseID}${item.date}${item.boxTypeName}`
            ] = oldInfo.coefficient;
            oldInfo.coefficient = item.coefficient;
            isItemInOldWarehouseInfoChanged = true;
          }
          return condition;
        } catch (filterError) {
          console.error("Ошибка при фильтрации элемента:", filterError.message);
          return false;
        }
      });

      let warehouseInfo = {
        items: [],
        userProfileId: this.profile._id,
      };

      try {
        if (!warehouses.length) {
          warehouseInfo.items = filteredWarehousesItems;
        }
        if (isItemInOldWarehouseInfoChanged) {
          warehouseInfo.items = warehouses;
        }
        if (isNewWarehouseAdded && warehouses.length) {
          if (!warehouseInfo.items.length) {
            warehouseInfo.items = warehouses;
          }
          warehouseInfo.items = [...warehouseInfo.items, ...newWarehouses];
        }

        if (filteredWarehousesItems?.length) {
          await TelegramBotService.sendWarehouseInfo(
            this.profile.chatId,
            filteredWarehousesItems,
            oldCoefficientsByInfo
          );
        }

        if (warehouseInfo.items.length) {
          this.warehouses = warehouseInfo;
          await Warehouses.updateOne(
            { userProfileId: this.profile._id },
            warehouseInfo,
            {
              upsert: true,
            }
          );
        }

        return {
          filteredWarehousesItems,
          oldCoefficientsByInfo,
          warehouseInfo,
        };
      } catch (error) {
        console.error("Ошибка при обработке данных складов:", error.message);
        return null;
      }
    } catch (error) {
      console.error("Критическая ошибка в performCheck:", error.message);
      return null;
    }
  }
}

class WarehouseCheckerService {
  constructor() {
    this.checkers = {};
    this.isInit = false;
  }

  async addNewChecker(profileId) {
    const profile = await Profile.findById(profileId);
    const settings = await WarehouseSettings.findOne({
      userProfileId: profileId,
    });

    if (!settings.enabled || !profile.chatId) {
      return;
    }
    const warehouses = await Warehouses.findOne({
      userProfileId: profileId,
    });

    if (!settings) {
      throw new Error(`No settings found for user ${profile.username}`);
    }

    // Создаем новый WarehouseChecker для каждого пользователя
    const checker = new WarehouseChecker(profile, settings, warehouses);

    // Запускаем первый цикл проверок
    checker.startCheckCycle();

    // Сохраняем ссылку на checker в объекте сервиса
    this.checkers[profileId] = checker;
  }

  removeChecker(profileId) {
    const checker = this.checkers[profileId];
    checker.stopCheckCycle();
    delete this.checkers[profileId];
  }

  async initialize() {
    try {
      if (this.isInit) {
        console.log("WarehouseCheckerService уже инициализирован");
        return;
      }

      const users = await User.find();
      for (const user of users) {
        try {
          await this.addNewChecker(user.profileId);
        } catch (userError) {
          console.error(
            `Ошибка при инициализации checker для пользователя ${user.profileId}:`,
            userError.message
          );
        }
      }
      this.isInit = true;
      console.log("WarehouseCheckerService успешно инициализирован");
    } catch (error) {
      console.error("Ошибка при инициализации WarehouseCheckerService:", error);
      this.isInit = false;
    }
  }

  async changeSettings(profileId, newSettings) {
    let checker = this.checkers[profileId];

    if (!checker) {
      if (newSettings.enabled && newSettings.items.length) {
        this.addNewChecker(profileId);
      }
      return;
    }

    if (!newSettings.enabled || !newSettings.items.length) {
      this.removeChecker(profileId);
      return;
    }
    // Перезапускаем цикл проверок с обновленными настройками
    checker.restartCheckCycle(newSettings);
  }

  // Метод для остановки всех активных проверок
  stopAllChecks() {
    Object.values(this.checkers).forEach((checker) => {
      checker.stopCheckCycle();
    });
  }
}

module.exports = new WarehouseCheckerService();
