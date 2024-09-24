const mongoose = require("mongoose");
const Order = require("./order.model");

const BarcodesHistory = mongoose.model(
  "barcodesHistory",
  new mongoose.Schema(
    {
      orders: [Order.schema],
      withEAC: Boolean,
      mode: String,
      ordersCount: Number,
      userId: String,
    },
    { timestamps: true }
  )
);

module.exports = BarcodesHistory;
