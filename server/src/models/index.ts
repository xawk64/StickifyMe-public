import mongoose from "mongoose";
import { BarcodesHistoryModel } from "./barcodesHistory.model";
import { FeedbackModel } from "./feedback.model";
import { OrderModel, ProductModel } from "./order.model";
import { ProfileModel } from "./profile.model";
import { UserModel } from "./user.model";
import { WarehouseModel } from "./warehouse.model";
import { WarehouseSettingsModel } from "./warehouseSettings.model";

export * from "./barcodesHistory.model";
export * from "./feedback.model";
export * from "./order.model";
export * from "./profile.model";
export * from "./user.model";
export * from "./warehouse.model";
export * from "./warehouseSettings.model";

/** Model registry kept for modules that still look models up by name. */
export const db = {
  mongoose,
  user: UserModel,
  profile: ProfileModel,
  barcodesHistory: BarcodesHistoryModel,
  order: OrderModel,
  product: ProductModel,
  warehouse: WarehouseModel,
  warehouseSettings: WarehouseSettingsModel,
  feedback: FeedbackModel,
};
