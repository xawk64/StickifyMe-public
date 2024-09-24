import { GenerateBarcodeMode } from "./GenerateBarcodesParamsType";
import { IOrder } from "./OrderType";

export type IAddHistoryParams = {
  orders: IOrder[];
  withEAC: boolean;
  mode: GenerateBarcodeMode;
};
