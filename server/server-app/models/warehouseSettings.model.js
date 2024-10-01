const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
  {
    ID: { type: Number, required: true },
    boxTypes: [{ type: String }],
    coeff: { type: Number, min: 0, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
  },
  { _id: false }
);

const WarehouseSettings = mongoose.model(
  "warehouseSettings",
  new mongoose.Schema(
    {
      items: [ItemSchema],
      userProfileId: String,
    },
    { timestamps: true }
  )
);

module.exports = WarehouseSettings;
