import type { Express } from "express";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { WbAuthError } from "../src/integrations/wb/errors";
import type { WbCard, WbSticker } from "../src/integrations/wb/schemas";
import type { WbClient } from "../src/integrations/wb/wbClient";
import { logger } from "../src/logger";
import { createRepositories } from "../src/repositories";
import { ImportService } from "../src/services/import.service";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  db,
  disconnectTestDb,
  testSecretBox,
} from "./helpers/app";
import { PNG_1PX_BASE64 } from "./helpers/fixtures";
import { authed, registerUser, type TestUser } from "./helpers/users";

const card = (nmId: number): WbCard => ({
  nmID: nmId,
  vendorCode: `VC-${nmId}`,
  brand: "Brand",
  title: `Product ${nmId}`,
  description: "",
  subjectName: "Футболки",
  createdAt: "",
  updatedAt: "",
  characteristics: [
    { name: "Цвет", value: ["красный"] },
    { name: "Страна производства", value: "Россия" },
  ],
  sizes: [{ skus: ["4006381333931"] }],
});

const sticker = (orderId: number): WbSticker => ({
  orderId,
  partA: "123456",
  partB: "7890",
  barcode: `*${orderId}`,
  file: PNG_1PX_BASE64,
});

/** In-memory WB: orders 1..n, odd ids are "in assembly", order 3 has no sticker. */
function fakeWb(count: number) {
  const ids = Array.from({ length: count }, (_, i) => i + 1);
  return {
    getOrders: vi.fn(async (_key: string, _from?: number, _to?: number) =>
      ids.map((id) => ({
        id,
        nmId: 100 + id,
        createdAt: "2024-10-01T10:00:00Z",
        deliveryType: "fbs",
      })),
    ),
    getOrderStatuses: vi.fn(
      async (_key: string, orderIds: number[]) =>
        new Map(orderIds.map((id) => [id, id % 2 ? "confirm" : "complete"])),
    ),
    getStickers: vi.fn(
      async (_key: string, orderIds: number[]) =>
        new Map(orderIds.filter((id) => id !== 3).map((id) => [id, sticker(id)])),
    ),
    getCard: vi.fn(async (_key: string, nmId: number) => card(nmId)),
    ping: vi.fn(async () => {}),
  };
}

async function withWbKey(user: TestUser) {
  await db.profile.updateOne(
    { _id: user.profileId },
    { wbApiKeyEncrypted: testSecretBox.encrypt("seller-key") },
  );
}

describe("ImportService", () => {
  let app: Express;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  const createService = (
    wb: ReturnType<typeof fakeWb>,
    sleep = vi.fn(async (_ms: number) => {}),
  ) => ({
    sleep,
    service: new ImportService({
      repositories: createRepositories(),
      wbClient: wb,
      secretBox: testSecretBox,
      stickersBatchSize: 2,
      batchDelayMs: 60_000,
      sleep,
      log: logger,
    }),
  });

  it("keeps orders in assembly, skips orders without a sticker and maps the product card", async () => {
    const user = await registerUser(app);
    await withWbKey(user);
    const wb = fakeWb(6);
    const { service } = createService(wb);

    const orders = await service.importFromWb(user.userId, 3);

    expect(orders.map((o) => o.id)).toEqual([1, 5]);
    expect(orders[0]).toMatchObject({
      nmId: 101,
      bcUp: "123456",
      bcDown: "7890",
      barcodeFile: PNG_1PX_BASE64,
      product: {
        barcode: "4006381333931",
        title: "Product 101",
        characteristics: { Цвет: ["красный"], "Страна производства": ["Россия"] },
      },
    });
    expect(wb.getOrders.mock.calls[0]?.[0]).toBe("seller-key");
  });

  it("pauses between sticker batches and reports progress", async () => {
    const user = await registerUser(app);
    await withWbKey(user);
    const { service, sleep } = createService(fakeWb(10)); // 5 in assembly -> 3 batches of 2
    const progress: number[] = [];

    await service.importFromWb(user.userId, 1, (p) => progress.push(p.done));

    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(60_000);
    expect(progress).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("asks for a WB key when the profile has none", async () => {
    const user = await registerUser(app);
    const { service } = createService(fakeWb(1));
    await expect(service.importFromWb(user.userId, 1)).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe("POST /api/imports/*", () => {
  beforeAll(connectTestDb);
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  const lines = (text: string) =>
    text
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { type: string; [key: string]: unknown });

  it("streams progress events followed by the result", async () => {
    const app = createTestApp({ wbClient: fakeWb(4) as unknown as WbClient });
    const user = await registerUser(app);
    await withWbKey(user);

    const res = await request(app)
      .post("/api/imports/wb")
      .set(authed(user.token))
      .send({ days: 3 });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/x-ndjson");
    const events = lines(res.text);
    expect(events.filter((e) => e.type === "progress").length).toBeGreaterThan(0);
    const result = events.at(-1)!;
    expect(result.type).toBe("result");
    expect((result.orders as unknown[]).length).toBe(1); // order 1 (order 3 has no sticker)
  });

  it("reports a rejected WB key as an error event", async () => {
    const wb = fakeWb(2);
    wb.getOrders.mockRejectedValueOnce(new WbAuthError("unauthorized", 401));
    const app = createTestApp({ wbClient: wb as unknown as WbClient });
    const user = await registerUser(app);
    await withWbKey(user);

    const res = await request(app)
      .post("/api/imports/wb")
      .set(authed(user.token))
      .send({ days: 1 });

    const last = lines(res.text).at(-1)!;
    expect(last).toMatchObject({ type: "error", status: 400 });
    expect(last.message).toContain("ключ API");
  });
});
