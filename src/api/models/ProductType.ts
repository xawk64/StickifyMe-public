export interface IProduct {
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
}
