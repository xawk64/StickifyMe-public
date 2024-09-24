import { IProduct } from "./ProductType";

export interface IOrder {
  id: number;
  nmId: number;
  createdAtMarket: string;
  deliveryType: string;
  stickersCount: number;
  barcodeFile: string;
  bcUp: string;
  bcDown: string;
  barcode: string;
  product: IProduct;
}
