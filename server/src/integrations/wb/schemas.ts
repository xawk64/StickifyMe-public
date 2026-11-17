import { z } from "zod";

// Only the fields the product uses are declared; unknown fields are ignored,
// so additive changes on the WB side do not break parsing.

const numericString = z.union([z.string(), z.number()]).transform(String);

export const orderSchema = z.object({
  id: z.number().int(),
  nmId: z.number().int(),
  createdAt: z.string(),
  deliveryType: z.string().optional().default(""),
});
export type WbOrder = z.infer<typeof orderSchema>;

export const ordersPageSchema = z.object({
  next: z.number().int(),
  orders: z.array(orderSchema),
});

export const orderStatusesSchema = z.object({
  orders: z.array(
    z.object({
      id: z.number().int(),
      supplierStatus: z.string(),
      wbStatus: z.string().optional(),
    }),
  ),
});

export const stickersSchema = z.object({
  stickers: z.array(
    z.object({
      orderId: z.number().int(),
      partA: numericString,
      partB: numericString,
      barcode: z.string(),
      file: z.string(), // base64 PNG
    }),
  ),
});
export type WbSticker = z.infer<typeof stickersSchema>["stickers"][number];

export const cardsSchema = z.object({
  cards: z.array(
    z.object({
      nmID: z.number().int(),
      vendorCode: z.string().optional().default(""),
      brand: z.string().optional().default(""),
      title: z.string().optional().default(""),
      description: z.string().optional().default(""),
      subjectName: z.string().optional().default(""),
      createdAt: z.string().optional().default(""),
      updatedAt: z.string().optional().default(""),
      characteristics: z
        .array(z.object({ name: z.string(), value: z.unknown() }))
        .optional()
        .default([]),
      sizes: z
        .array(z.object({ skus: z.array(z.string()).optional().default([]) }))
        .min(1),
    }),
  ),
});
export type WbCard = z.infer<typeof cardsSchema>["cards"][number];

export const coefficientsSchema = z.array(
  z.object({
    date: z.string(),
    coefficient: z.number(),
    warehouseID: z.number().int(),
    warehouseName: z.string(),
    boxTypeName: z.string(),
    boxTypeID: z.number().int().optional(),
  }),
);
export type WbCoefficient = z.infer<typeof coefficientsSchema>[number];
