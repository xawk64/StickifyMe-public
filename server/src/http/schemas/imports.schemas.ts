import { z } from "zod";

export const importFromWb = z.object({
  days: z.number().int().min(1).max(30),
});

export const enrichOrders = z.object({
  orders: z
    .array(
      z.object({
        id: z.number().int().positive(),
        nmId: z.number().int().positive(),
        createdAtMarket: z.string().max(64).optional(),
        deliveryType: z.string().max(32).optional(),
      }),
    )
    .min(1)
    .max(2000),
});
