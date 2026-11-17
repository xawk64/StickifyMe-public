import { describe, expect, it, vi } from "vitest";
import { WbAuthError, WbBadResponseError } from "../src/integrations/wb/errors";
import { WbClient } from "../src/integrations/wb/wbClient";
import { logger } from "../src/logger";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status });

function clientWith(handler: (url: string, init?: RequestInit) => Response) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => handler(url, init));
  const client = new WbClient({
    baseUrls: {
      marketplace: "http://mp",
      content: "http://content",
      supplies: "http://sup",
    },
    timeoutMs: 1_000,
    retry: { retries: 2, baseDelayMs: 1, maxDelayMs: 10 },
    log: logger,
    fetch: fetch as unknown as typeof globalThis.fetch,
    sleep: async () => {},
  });
  return { client, fetch };
}

describe("WbClient", () => {
  it("follows the orders cursor until a page is not full", async () => {
    const full = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      nmId: 1,
      createdAt: "x",
    }));
    const { client, fetch } = clientWith((url) =>
      url.includes("next=0")
        ? json(200, { next: 77, orders: full })
        : json(200, { next: 0, orders: [{ id: 5000, nmId: 1, createdAt: "x" }] }),
    );

    const orders = await client.getOrders("key", 1, 2);

    expect(orders).toHaveLength(1001);
    expect(fetch.mock.calls[1]?.[0]).toContain("next=77");
  });

  it("normalises numeric sticker parts to strings", async () => {
    const { client } = clientWith(() =>
      json(200, {
        stickers: [
          { orderId: 1, partA: 231648, partB: 9753, barcode: "*abc", file: "AAAA" },
        ],
      }),
    );
    const stickers = await client.getStickers("key", [1]);
    expect(stickers.get(1)).toMatchObject({ partA: "231648", partB: "9753" });
  });

  it("turns a payload that breaks the contract into WbBadResponseError", async () => {
    const { client } = clientWith(() => json(200, { cards: [{ nmID: "not-a-number" }] }));
    await expect(client.getCard("key", 1)).rejects.toBeInstanceOf(WbBadResponseError);
  });

  it("rejects an error object where an array of coefficients is expected", async () => {
    const { client } = clientWith(() => json(200, { detail: "something went wrong" }));
    await expect(client.getAcceptanceCoefficients("key", [1])).rejects.toBeInstanceOf(
      WbBadResponseError,
    );
  });

  it("reports an invalid key on ping without retrying", async () => {
    const { client, fetch } = clientWith(() => json(401, {}));
    await expect(client.ping("bad")).rejects.toBeInstanceOf(WbAuthError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
