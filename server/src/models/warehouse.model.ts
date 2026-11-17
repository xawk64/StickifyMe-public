import { Schema, model } from "mongoose";

/** Last seen acceptance coefficient for a warehouse / date / box type. */
export interface WarehouseCoefficient {
  date: string;
  coefficient: number;
  warehouseID: number;
  warehouseName: string;
  boxTypeName: string;
  boxTypeID?: number;
}

export interface WarehouseSnapshot {
  items: WarehouseCoefficient[];
  userProfileId: string;
}

const warehouseSchema = new Schema<WarehouseSnapshot>(
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
    userProfileId: { type: String, index: true },
  },
  { timestamps: true },
);

export const WarehouseModel = model<WarehouseSnapshot>("warehouse", warehouseSchema);
