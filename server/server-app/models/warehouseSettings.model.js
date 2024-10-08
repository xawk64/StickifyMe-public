const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
  {
    ID: { type: Number, required: true },
    boxTypes: [{ type: String }],
    coeff: { type: Number, min: 0, required: true },
    dateStart: { type: Date, required: true },
    dateEnd: { type: Date, required: true },
  },
  { _id: false }
);

const WarehouseSettings = mongoose.model(
  "warehouseSettings",
  new mongoose.Schema(
    {
      items: [ItemSchema],
      enabled: Boolean,
      userProfileId: String,
    },
    { timestamps: true }
  )
);

module.exports = WarehouseSettings;
