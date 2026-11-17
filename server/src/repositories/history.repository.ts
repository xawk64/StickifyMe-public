import type { HydratedDocument } from "mongoose";
import { BarcodesHistoryModel, type BarcodesHistory, type Order } from "../models";

export type HistoryDocument = HydratedDocument<BarcodesHistory>;

export type HistorySummary = Omit<BarcodesHistory, "orders" | "userId"> & {
  _id: unknown;
};

export class HistoryRepository {
  create(
    userId: string,
    type: string | undefined,
    orders: Order[],
  ): Promise<HistoryDocument> {
    return BarcodesHistoryModel.create({
      userId,
      type,
      orders,
      ordersCount: orders.length,
    });
  }

  findById(id: string): Promise<HistoryDocument | null> {
    return BarcodesHistoryModel.findById(id).exec();
  }

  /** One page of a user's history in insertion order, without heavy fields. */
  async findPage(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: HistorySummary[]; count: number }> {
    const filter = { userId };
    const [items, count] = await Promise.all([
      BarcodesHistoryModel.find(filter, { orders: 0, rows: 0, userId: 0 })
        .sort({ _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<HistorySummary[]>()
        .exec(),
      BarcodesHistoryModel.countDocuments(filter).exec(),
    ]);
    return { items, count };
  }
}
