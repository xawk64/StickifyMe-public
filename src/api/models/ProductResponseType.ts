export interface IProductResponse {
  id: number;
  barcode: string;
  subjectName: string;
  vendorCode: string;
  brand: string;
  title: string;
  description: string;
  characteristics: { [key: string]: string[] };
  createdAtMarket: string;
  updatedAtMarket: string;
  createdAt: string;
  updatedAt: string;
  _id: string;
}
