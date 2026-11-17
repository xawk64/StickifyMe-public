import { Schema, model } from "mongoose";

export interface Product {
  id?: number | null;
  barcode?: string;
  subjectName?: string;
  vendorCode?: string;
  brand?: string;
  title?: string;
  description?: string;
  characteristics?: Map<string, (string | null)[]> | Record<string, (string | null)[]>;
  createdAtMarket?: string;
  updatedAtMarket?: string;
}

/** An FBS order together with its WB sticker and product card, as printed on a label. */
export interface Order {
  id?: number | null;
  nmId?: number | null;
  createdAtMarket?: string;
  deliveryType?: string;
  stickersCount?: number;
  bcUp?: string;
  bcDown?: string;
  barcode?: string;
  barcodeFile?: string;
  product: Product;
}

export const productSchema = new Schema<Product>(
  {
    id: Number,
    barcode: String,
    subjectName: String,
    vendorCode: String,
    brand: String,
    title: String,
    description: String,
    characteristics: { type: Map, of: [String] },
    createdAtMarket: String,
    updatedAtMarket: String,
  },
  { timestamps: true },
);

export const orderSchema = new Schema<Order>(
  {
    id: Number,
    nmId: Number,
    createdAtMarket: String,
    deliveryType: String,
    stickersCount: Number,
    bcUp: String,
    bcDown: String,
    barcode: String,
    barcodeFile: String,
    product: productSchema,
  },
  { timestamps: true },
);

export const OrderModel = model<Order>("order", orderSchema);
export const ProductModel = model<Product>("product", productSchema);
