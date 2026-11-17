const db = require("../models");
const User = db.user;
const BarcodesHistory = db.barcodesHistory;
const { v4: uuidv4 } = require("uuid");
const { sendEmail } = require("../utils/sendEmail");
const config = require("../config");

exports.addBarcodes = async (req, res) => {
  try {
    const orders = req.body.orders;

    if (!Array.isArray(orders)) {
      return res.status(400).send({ message: "orders must be an array" });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).send({ message: "Пользователь не найден" });
    }

    const id = uuidv4();

    await BarcodesHistory.create({
      orders,
      type: req.body.type,
      userId: req.userId,
      ordersCount: orders.length,
    });

    await sendEmail(
      config.adminEmail,
      "История этикеток",
      `Пользователь ${user.username} подготовил историю этикеток для ${orders.length} товаров`
    );

    return res.status(200).json({ id });
  } catch (err) {
    console.error("Error saving barcodes history:", err);
    return res.status(500).send({ message: err.message || err });
  }
};

exports.getBarcodesHistory = (req, res) => {
  BarcodesHistory.find((err, barcodesHistory) => {
    if (err) {
      return res.status(500).send({ message: err });
    }

    return res.status(200).json({ barcodesHistory });
  });
};
