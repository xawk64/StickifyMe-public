import { IOrder } from "./OrderType";

export enum GenerateBarcodeMode {
  thermo = "thermo",
  a4 = "a4",
}

export enum ImportBarcodeMode {
  excel = "excel",
  wb = "wb",
}

export type GenerateBarcodesParams = {
  orders: IOrder[];
  mode: GenerateBarcodeMode;
  withEAC: boolean;
};
