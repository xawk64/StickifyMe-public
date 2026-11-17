const mongoose = require("mongoose");

const Warehouse = mongoose.model(
  "warehouse",
  new mongoose.Schema(
    {
      items: [
        {
          date: String,
          coefficient: Number,
          warehouseID: Number,
          warehouseName: String,
          boxTypeName: String,
          boxTypeID: Number,
        },
      ],
      userProfileId: String,
    },
    { timestamps: true },
  ),
);

module.exports = Warehouse;
