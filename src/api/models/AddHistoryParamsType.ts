import { ImportBarcodeMode } from "./GenerateBarcodesParamsType";
import { IOrder } from "./OrderType";

export type IAddHistoryParams = {
  orders: IOrder[];
  type: ImportBarcodeMode;
};
