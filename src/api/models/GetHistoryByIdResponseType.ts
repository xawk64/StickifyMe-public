import { IOrderResponse } from "./OrderResponseType";

export interface IGetHistoryByIdResponse {
  orders: IOrderResponse[];
  type: string;
  ordersCount: number;
  createdAt: string;
  updatedAt: string;
  _id: string;
}
