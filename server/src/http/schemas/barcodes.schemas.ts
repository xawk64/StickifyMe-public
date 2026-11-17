import { z } from "zod";

const text = (max: number) => z.string().max(max);
const optionalText = (max: number) => text(max).optional();

const product = z.object({
  id: z.number().int().nullable().optional(),
  barcode: optionalText(64),
  subjectName: optionalText(500),
  vendorCode: optionalText(200),
  brand: optionalText(200),
  title: optionalText(1000),
  description: optionalText(10000),
  characteristics: z.record(z.string(), z.array(z.string().nullable())).optional(),
  createdAtMarket: optionalText(64),
  updatedAtMarket: optionalText(64),
});

const order = z.object({
  id: z.number().int().nullable().optional(),
  nmId: z.number().int().nullable().optional(),
  createdAtMarket: optionalText(64),
  deliveryType: optionalText(32),
  stickersCount: z.number().int().min(0).max(1000).optional(),
  bcUp: optionalText(64),
  bcDown: optionalText(64),
  barcode: optionalText(64),
  barcodeFile: z.base64().max(2_000_000).optional(),
  product,
});

const MAX_ORDERS = 2000;

// Labels are rendered with an EAN-13 barcode: reject what the encoder cannot draw.
const printableOrder = order.extend({
  barcodeFile: z.base64().min(1).max(2_000_000),
  product: product.extend({
    barcode: z.string().regex(/^\d{12,13}$/, "EAN-13 expected"),
  }),
});

const generateLabels = z.object({
  mode: z.enum(["thermo", "a4"]),
  withEAC: z.boolean().optional().default(false),
  orders: z.array(printableOrder).min(1).max(MAX_ORDERS),
});

const addHistory = z.object({
  type: optionalText(32),
  orders: z.array(order).max(MAX_ORDERS),
});

const historyPage = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const historyId = z.object({
  historyId: z.string().regex(/^[a-f\d]{24}$/i, "invalid id"),
});

export { generateLabels, addHistory, historyPage, historyId };
