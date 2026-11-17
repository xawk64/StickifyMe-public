const db = require("../models");
const User = db.user;
const BarcodesHistory = db.barcodesHistory;
const { v4: uuidv4 } = require("uuid");
const { notifyAdmin } = require("../utils/sendEmail");
const templates = require("../emails/templates");

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

    await notifyAdmin(
      templates.adminLabelsHistory({
        username: user.username,
        ordersCount: orders.length,
      }),
    );

    return res.status(200).json({ id });
  } catch (err) {
    console.error("Error saving barcodes history:", err);
    return res.status(500).send({ message: err.message || err });
  }
};
