import type { ZodType } from "zod";
import type { Logger } from "../../logger";
import { WbBadResponseError } from "./errors";
import { defaultSleep, wbRequest, type HttpDeps, type RetryPolicy } from "./http";
import {
  cardsSchema,
  coefficientsSchema,
  orderStatusesSchema,
  ordersPageSchema,
  stickersSchema,
  type WbCard,
  type WbCoefficient,
  type WbOrder,
  type WbSticker,
} from "./schemas";

export interface WbClientOptions {
  baseUrls: { marketplace: string; content: string; supplies: string };
  timeoutMs: number;
  retry: RetryPolicy;
  log: Logger;
  /** Injected in tests. */
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

const ORDERS_PAGE_SIZE = 1000;
const STATUS_BATCH_SIZE = 1000;

/**
 * Typed client for the parts of the Wildberries seller API the product uses.
 * Every response is validated with zod: a payload that does not match the
 * contract becomes a WbBadResponseError instead of a TypeError deep in the code.
 */
export class WbClient {
  private readonly http: HttpDeps;

  constructor(private readonly options: WbClientOptions) {
    this.http = {
      fetch: options.fetch ?? fetch,
      sleep: options.sleep ?? defaultSleep,
      random: options.random ?? Math.random,
      log: options.log,
    };
  }

  private async call<T>(
    schema: ZodType<T>,
    apiKey: string,
    url: string,
    init: { method?: "GET" | "POST"; body?: unknown } = {},
  ): Promise<T> {
    const payload = await wbRequest(
      {
        url,
        apiKey,
        timeoutMs: this.options.timeoutMs,
        retry: this.options.retry,
        ...init,
      },
      this.http,
    );
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      this.options.log.warn(
        { url: url.split("?")[0], issues: parsed.error.issues.slice(0, 5) },
        "unexpected WB response",
      );
      throw new WbBadResponseError(`Unexpected response from ${url.split("?")[0]}`);
    }
    return parsed.data;
  }

  /** Resolves when the key is accepted by WB; throws WbAuthError otherwise. */
  async ping(apiKey: string): Promise<void> {
    await wbRequest(
      {
        url: `${this.options.baseUrls.content}/ping`,
        apiKey,
        timeoutMs: this.options.timeoutMs,
        retry: { ...this.options.retry, retries: 0 },
      },
      this.http,
    );
  }

  /** All FBS orders created in [dateFrom, dateTo] (unix seconds), following the `next` cursor. */
  async getOrders(apiKey: string, dateFrom: number, dateTo: number): Promise<WbOrder[]> {
    const orders: WbOrder[] = [];
    let next = 0;
    do {
      const page = await this.call(
        ordersPageSchema,
        apiKey,
        `${this.options.baseUrls.marketplace}/api/v3/orders?limit=${ORDERS_PAGE_SIZE}&next=${next}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
      );
      orders.push(...page.orders);
      next = page.orders.length === ORDERS_PAGE_SIZE ? page.next : 0;
    } while (next !== 0);
    return orders;
  }

  /** supplierStatus per order id ("confirm" = in assembly). */
  async getOrderStatuses(
    apiKey: string,
    orderIds: number[],
  ): Promise<Map<number, string>> {
    const statuses = new Map<number, string>();
    for (let i = 0; i < orderIds.length; i += STATUS_BATCH_SIZE) {
      const { orders } = await this.call(
        orderStatusesSchema,
        apiKey,
        `${this.options.baseUrls.marketplace}/api/v3/orders/status`,
        { method: "POST", body: { orders: orderIds.slice(i, i + STATUS_BATCH_SIZE) } },
      );
      orders.forEach(({ id, supplierStatus }) => statuses.set(id, supplierStatus));
    }
    return statuses;
  }

  /** 58x40 PNG stickers for the given orders, keyed by order id. */
  async getStickers(apiKey: string, orderIds: number[]): Promise<Map<number, WbSticker>> {
    const { stickers } = await this.call(
      stickersSchema,
      apiKey,
      `${this.options.baseUrls.marketplace}/api/v3/orders/stickers?type=png&width=58&height=40`,
      { method: "POST", body: { orders: orderIds } },
    );
    return new Map(stickers.map((sticker) => [sticker.orderId, sticker]));
  }

  /** Product card found by its WB article (nmId), or null. */
  async getCard(apiKey: string, nmId: number): Promise<WbCard | null> {
    const { cards } = await this.call(
      cardsSchema,
      apiKey,
      `${this.options.baseUrls.content}/content/v2/get/cards/list?locale=ru`,
      {
        method: "POST",
        body: {
          settings: {
            cursor: { limit: 100 },
            filter: { textSearch: `${nmId}`, withPhoto: -1 },
          },
        },
      },
    );
    return cards.find((card) => card.nmID === nmId) ?? cards[0] ?? null;
  }

  async getAcceptanceCoefficients(
    apiKey: string,
    warehouseIds: number[],
  ): Promise<WbCoefficient[]> {
    return this.call(
      coefficientsSchema,
      apiKey,
      `${this.options.baseUrls.supplies}/api/v1/acceptance/coefficients?warehouseIDs=${warehouseIds.join(",")}`,
    );
  }
}
