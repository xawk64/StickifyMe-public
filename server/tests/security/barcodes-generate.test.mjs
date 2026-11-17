import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  createTestApp,
  disconnectTestDb,
} from "../helpers/app.mjs";
import { makeOrder } from "../helpers/fixtures.mjs";
import { binaryParser, countPdfPages } from "../helpers/pdf.mjs";
import { authed, registerUser } from "../helpers/users.mjs";

describe("label PDF generation isolation", () => {
  let app;
  let user;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
    user = await registerUser(app);
  });
  afterEach(clearTestDb);
  afterAll(disconnectTestDb);

  const generate = (orders) =>
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

  it("does not write a shared stickers.pdf file to the working directory", async () => {
    const shared = path.resolve("stickers.pdf");
    fs.rmSync(shared, { force: true });

    await generate([makeOrder(1)]);

    expect(fs.existsSync(shared)).toBe(false);
  });
});
