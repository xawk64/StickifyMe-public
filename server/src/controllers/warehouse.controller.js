const db = require("../models");
const WarehouseCheckerService = require("../services/warehousesMonitoringService");
const { notifyAdmin } = require("../mail/mailer");
const templates = require("../mail/templates");
const { NotFoundError } = require("../errors");
const User = db.user;
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
        { upsert: true },
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
    notifyAdmin(
      templates.adminMonitoringSettings({
        email: user.email,
        username: user.username,
        settings,
      }),
    );
  } catch (error) {
    console.error("Ошибка при сохранении настроек:", error);
    res.status(500).send({ message: "Произошла ошибка при обработке запроса" });
    notifyAdmin(templates.adminMonitoringSettingsError({ userId: req.userId }));
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }
    const settings = await WarehouseSettings.findOne({ userProfileId: user.profileId });
    return res.status(200).json(settings);
  } catch (err) {
    return next(err);
  }
};
