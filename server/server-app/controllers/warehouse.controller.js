const db = require("../models");
const User = db.user;
const WarehouseSettings = db.warehouseSettings;
const Warehouse = db.warehouse;

exports.setSettings = (req, res) => {
  console.log(req.body);
  User.findById(req.userId, (err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    const settings = {
      items: req.body.settings.items,
      userProfileId: user.profileId,
    };

    console.log(settings, "settings new!!");

    // Warehouse.updateOne(
    //   { userProfileId: user.profileId },
    //   { items: [], userProfileId: user.profileId },
    //   { upsert: true },
    //   (err) => {
    //     if (err) {
    //       res.status(500).send({ message: err });
    //     }
    //   }
    // );

    // const warehouseSettings = new WarehouseSettings(settings);

    // warehouseSettings.markModified("items");
    // warehouseSettings.save((err, settings) =>
    //   console.log(settings, "crete settings!")
    // );

    WarehouseSettings.updateOne(
      { userProfileId: user.profileId },
      settings,
      { upsert: false },
      (err) => {
        if (err) {
          res.status(500).send({ message: err });
        }
      }
    );

    Warehouse.updateOne(
      { userProfileId: user.profileId },
      { items: [], userProfileId: user.profileId },
      { upsert: true },
      (err) => {
        if (err) {
          res.status(500).send({ message: err });
        }
      }
    );
    res.status(200).send({ msg: "was success!" });
  });
};
