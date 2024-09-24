const mongoose = require("mongoose");
const Product = require("./product.model");

const Order = mongoose.model(
  "order",
  new mongoose.Schema(
    {
      id: Number,
      nmId: Number,
      createdAtMarket: String,
      deliveryType: String,
      stickersCount: Number,
      bcUp: String,
      bcDown: String,
      barcode: String,
      barcodeFile: String,
      product: Product.schema,
    },
    { timestamps: true }
  )
);

module.exports = Order;
