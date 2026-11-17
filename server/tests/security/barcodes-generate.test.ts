import type { Express } from "express";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  disconnectTestDb,
} from "../helpers/app";
import { makeOrder } from "../helpers/fixtures";
import { binaryParser, countPdfPages } from "../helpers/pdf";
import { authed, registerUser, type TestUser } from "../helpers/users";

describe("label PDF generation isolation", () => {
  let app: Express;
  let user: TestUser;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
    user = await registerUser(app);
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  const generate = (orders: ReturnType<typeof makeOrder>[]) =>
    request(app)
      .post("/api/barcodes/generate")
      .set(authed(user.token))
      .send({ mode: "thermo", withEAC: false, orders })
      .buffer(true)
      .parse(binaryParser);

  it("returns each caller its own document under concurrent requests", async () => {
    const small = [makeOrder(1)];
    const large = Array.from({ length: 5 }, (_, i) => makeOrder(i + 1));

    const [smallRes, largeRes] = await Promise.all([generate(small), generate(large)]);

    expect(smallRes.status).toBe(200);
    expect(largeRes.status).toBe(200);
    expect(smallRes.body.subarray(0, 4).toString()).toBe("%PDF");
    // thermo mode: one WB sticker page and one product sticker page per order
    expect(countPdfPages(smallRes.body)).toBe(2);
    expect(countPdfPages(largeRes.body)).toBe(10);
  });

  it.each([
    [1, 1],
    [9, 1],
    [10, 2],
    [20, 3],
  ])(
    "lays out %i orders on %i A4 page(s), two stickers per order",
    async (count, pages) => {
      const orders = Array.from({ length: count }, (_, i) => makeOrder(i + 1));
      const res = await request(app)
        .post("/api/barcodes/generate")
        .set(authed(user.token))
        .send({ mode: "a4", withEAC: true, orders })
        .buffer(true)
        .parse(binaryParser);

      expect(res.status).toBe(200);
      expect(countPdfPages(res.body)).toBe(pages);
    },
  );

  it("does not write a shared stickers.pdf file to the working directory", async () => {
    const shared = path.resolve("stickers.pdf");
    fs.rmSync(shared, { force: true });

    await generate([makeOrder(1)]);

    expect(fs.existsSync(shared)).toBe(false);
  });
});
