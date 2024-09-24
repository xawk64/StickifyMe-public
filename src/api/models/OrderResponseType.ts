import { IProduct } from "./ProductType";

export interface IOrderResponse {
  id: number;
  nmId: number;
  createdAtMarket: string;
  deliveryType: string;
  stickersCount: number;
  bcUp: string;
  bcDown: string;
  barcode: string;
  barcodeFile: string;
  product: IProduct;
  createdAt: string;
  updatedAt: string;
  _id: string;
}
