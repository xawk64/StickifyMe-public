const db = require("../models");
const WarehouseCheckerService = require("../services/warehousesMonitoringService");
const User = db.user;
const Profile = db.profile;
const WarehouseSettings = db.warehouseSettings;
const Warehouses = db.warehouse;

exports.setSettings = async (req, res) => {
  console.log(req.body);
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

      res.status(200).send({ msg: "Настройки успешно сохранены!" });
    } else {
      res.status(400).send({ msg: "Некорректные данные" });
    }
  } catch (error) {
    console.error("Ошибка при сохранении настроек:", error);
    res.status(500).send({ msg: "Произошла ошибка при обработке запроса" });
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

          settings = settings[0].items;
          res.status(200).json(settings);
        }
      );
    });
  });
};
