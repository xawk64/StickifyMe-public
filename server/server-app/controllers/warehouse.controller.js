const db = require("../models");
const WarehouseCheckerService = require("../services/warehousesMonitoringService");
const { sendEmail } = require("../utils/sendEmail");
const User = db.user;
const Profile = db.profile;
const WarehouseSettings = db.warehouseSettings;
const Warehouses = db.warehouse;

exports.setSettings = async (req, res) => {
   try {
    const user = await User.findById(req.userId);
    if (!user || !user.profileId) {
      throw new Error("User or profile not found");
    }

    const settings = {
      items: req.body.settings.items,
      enabled: req.body.settings.enabled,
      userProfileId: user.profileId,
    };

    await Promise.all([
      WarehouseSettings.updateOne({ userProfileId: user.profileId }, settings, {
        upsert: true,
      }),
      Warehouses.updateOne(
        { userProfileId: user.profileId },
        { items: [], userProfileId: user.profileId },
        { upsert: true }
      ),
    ]);

    if (WarehouseCheckerService.isInit) {
      // Обновляем настройки для пользователя
      await WarehouseCheckerService.changeSettings(user.profileId, settings);

      res.status(200).send({ message: "Настройки успешно сохранены!" });
    } else {
      res.status(400).send({ message: "Некорректные данные" });
    }

    // Добавить в метод handleStartCommand после строки 47
    sendEmail(
      "admin@example.com",
      "Обновление настроек мониторинга",
      `Пользователь обновил настройки мониторинга:<br/>
       Email: ${user.email}<br/>
       Username: ${user.username}<br/>
       Настройки: ${JSON.stringify(settings, null, 2)}<br/>
       Дата: ${new Date().toLocaleString()}`
    );
  } catch (error) {
    console.error("Ошибка при сохранении настроек:", error);
    res.status(500).send({ message: "Произошла ошибка при обработке запроса" });
    sendEmail(
      "admin@example.com",
      "Обновление настроек мониторинга",
      `Произошла ошибка при обработке запроса:<br/>
      UserId: ${req.userId}<br/>
       Дата: ${new Date().toLocaleString()}`
    );
  }
};

exports.getSettings = (req, res) => {
  User.findById(req.userId, (err, user) => {
    if (err) {
      res.status(500).send({ message: err });
    }

    Profile.findById(user.profileId, (err, userProfile) => {
      if (err) {
        res.status(500).send({ message: err });
      }

      WarehouseSettings.find(
        { userProfileId: user.profileId },
        (err, settings) => {
          if (err) {
            res.status(500).send({ message: err });
          }

          settings = settings[0];
          res.status(200).json(settings);
        }
      );
    });
  });
};
