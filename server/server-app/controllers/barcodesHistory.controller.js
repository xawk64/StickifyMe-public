const db = require("../models");
const User = db.user;
const BarcodesHistory = db.barcodesHistory;
const { v4: uuidv4 } = require("uuid");

exports.addBarcodes = (req, res) => {
  User.findById(req.userId, (err, user) => {
    if (err) {
      res.status(500).send({ message: err });
    }

    const id = uuidv4();

    if (req.userId) {
      const history = new BarcodesHistory({
        orders: req.body.orders,
        type: req.body.type,
        userId: req.userId,
        ordersCount: req.body.orders.length,
      });
      history.save((err, history) => {
        console.log(history, "history");
        if (err) {
          res.status(500).send({ message: err });
          return;
        }
      });
    }

    res.status(200).json({ id });
  });
};

exports.getBarcodesHistory = (req, res) => {
  BarcodesHistory.find((err, barcodesHistory) => {
    if (err) {
      res.status(500).send({ message: err });
    }

    res.status(200).json({ barcodesHistory });
  });
};
