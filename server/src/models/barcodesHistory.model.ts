import { Schema, model } from "mongoose";
import { orderSchema, type Order } from "./order.model";

export interface BarcodesHistory {
  orders: Order[];
  type?: string;
  ordersCount: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const barcodesHistorySchema = new Schema<BarcodesHistory>(
  {
    orders: [orderSchema],
    type: String,
    ordersCount: Number,
    userId: { type: String, index: true },
  },
  { timestamps: true },
);

export const BarcodesHistoryModel = model<BarcodesHistory>(
  "barcodesHistory",
  barcodesHistorySchema,
);
