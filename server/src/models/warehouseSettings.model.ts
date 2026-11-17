import { Schema, model } from "mongoose";

/** What the seller wants to be notified about for one warehouse. */
export interface WarehouseSettingsItem {
  ID: number;
  boxTypes: string[];
  coeff: number;
  dateStart: Date;
  dateEnd: Date;
}

export interface WarehouseSettings {
  items: WarehouseSettingsItem[];
  enabled: boolean;
  userProfileId: string;
}

const itemSchema = new Schema<WarehouseSettingsItem>(
  {
    ID: { type: Number, required: true },
    boxTypes: [{ type: String }],
    coeff: { type: Number, min: 0, required: true },
    dateStart: { type: Date, required: true },
    dateEnd: { type: Date, required: true },
  },
  { _id: false },
);

const warehouseSettingsSchema = new Schema<WarehouseSettings>(
  {
    items: [itemSchema],
    enabled: Boolean,
    userProfileId: { type: String, index: true },
  },
  { timestamps: true },
);

export const WarehouseSettingsModel = model<WarehouseSettings>(
  "warehouseSettings",
  warehouseSettingsSchema,
);
