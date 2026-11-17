const mongoose = require("mongoose");

const Product = mongoose.model(
  "product",
  new mongoose.Schema(
    {
      id: Number,
      barcode: String,
      subjectName: String,
      vendorCode: String,
      brand: String,
      title: String,
      description: String,
      characteristics: {
        type: Map,
        of: [String],
      },
      createdAtMarket: String,
      updatedAtMarket: String,
    },
    { timestamps: true },
  ),
);

module.exports = Product;
