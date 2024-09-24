import { IOrderResponse } from "./OrderResponseType";

export interface IGetHistoryByIdResponse {
  orders: IOrderResponse[];
  withEAC: boolean;
  mode: string;
  ordersCount: number;
  createdAt: string;
  updatedAt: string;
  _id: string;
}
