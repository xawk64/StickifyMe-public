import { AppError, NotFoundError } from "../errors";
import type { WbCard, WbSticker } from "../integrations/wb/schemas";
import type { WbClient } from "../integrations/wb/wbClient";
import type { Logger } from "../logger";
import type { Order, Product } from "../models";
import type { Repositories } from "../repositories";
import type { SecretBox } from "../utils/secretBox";

/** Order fields known before stickers and product cards are loaded. */
export interface BaseOrder {
  id: number;
  nmId: number;
  createdAtMarket?: string;
  deliveryType?: string;
}

export interface ImportProgress {
  done: number;
  total: number;
  /** Rough estimate based on the pauses between sticker batches. */
  remainingMs: number;
}

export type ProgressListener = (progress: ImportProgress) => void;

export interface ImportServiceDeps {
  repositories: Pick<Repositories, "users" | "profiles">;
  wbClient: Pick<WbClient, "getOrders" | "getOrderStatuses" | "getStickers" | "getCard">;
  secretBox: SecretBox;
  stickersBatchSize: number;
  batchDelayMs: number;
  sleep: (ms: number) => Promise<void>;
  log: Logger;
}

/** supplierStatus of orders that are being assembled and need labels. */
const IN_ASSEMBLY = "confirm";
const DAY_SECONDS = 24 * 60 * 60;

export function toProduct(card: WbCard): Product {
  return {
    id: card.nmID,
    barcode: card.sizes[0]?.skus[0] ?? "",
    brand: card.brand,
    description: card.description,
    subjectName: card.subjectName,
    title: card.title,
    vendorCode: card.vendorCode,
    createdAtMarket: card.createdAt,
    updatedAtMarket: card.updatedAt,
    characteristics: Object.fromEntries(
      card.characteristics.map(({ name, value }) => [
        name,
        (Array.isArray(value) ? value : [value]).map(String),
      ]),
    ),
  };
}

const toLabelOrder = (order: BaseOrder, product: Product, sticker: WbSticker): Order => ({
  id: order.id,
  nmId: order.nmId,
  createdAtMarket: order.createdAtMarket ?? "",
  deliveryType: order.deliveryType ?? "",
  stickersCount: 1,
  product,
  bcUp: sticker.partA,
  bcDown: sticker.partB,
  barcode: sticker.barcode,
  barcodeFile: sticker.file,
});

/**
 * Prepares data for labels: keeps orders that are in assembly, loads WB stickers
 * and product cards. This used to run in the browser with the seller's key.
 */
export class ImportService {
  constructor(private readonly deps: ImportServiceDeps) {}

  private async apiKeyOf(userId: string): Promise<string> {
    const user = await this.deps.repositories.users.findById(userId);
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }
    const profile = await this.deps.repositories.profiles.findById(user.profileId);
    if (!profile?.wbApiKeyEncrypted) {
      throw new AppError(400, "Не найден ключ API для Wildberries");
    }
    return this.deps.secretBox.decrypt(profile.wbApiKeyEncrypted);
  }

  /** Orders created during the last `days` days, ready to be printed. */
  async importFromWb(userId: string, days: number, onProgress?: ProgressListener) {
    const apiKey = await this.apiKeyOf(userId);
    const now = Math.floor(Date.now() / 1000);
    const orders = await this.deps.wbClient.getOrders(
      apiKey,
      now - days * DAY_SECONDS,
      now,
    );
    return this.prepare(
      apiKey,
      orders.map(({ id, nmId, createdAt, deliveryType }) => ({
        id,
        nmId,
        createdAtMarket: createdAt,
        deliveryType,
      })),
      onProgress,
    );
  }

  private async prepare(
    apiKey: string,
    orders: BaseOrder[],
    onProgress?: ProgressListener,
  ): Promise<Order[]> {
    const { wbClient, stickersBatchSize, batchDelayMs } = this.deps;
    if (!orders.length) {
      return [];
    }
    const statuses = await wbClient.getOrderStatuses(
      apiKey,
      orders.map((order) => order.id),
    );
    const inAssembly = orders.filter((order) => statuses.get(order.id) === IN_ASSEMBLY);

    const batches: BaseOrder[][] = [];
    for (let i = 0; i < inAssembly.length; i += stickersBatchSize) {
      batches.push(inAssembly.slice(i, i + stickersBatchSize));
    }

    const result: Order[] = [];
    let done = 0;
    const report = (batchesLeft: number) =>
      onProgress?.({
        done,
        total: inAssembly.length,
        remainingMs: batchesLeft * batchDelayMs,
      });
    report(Math.max(batches.length - 1, 0));

    for (const [index, batch] of batches.entries()) {
      if (index > 0) {
        // WB limits sticker requests; the pause keeps the import under the limit
        await this.deps.sleep(batchDelayMs);
      }
      const stickers = await wbClient.getStickers(
        apiKey,
        batch.map((order) => order.id),
      );
      const prepared = await Promise.all(
        batch.map(async (order) => {
          const card = await wbClient.getCard(apiKey, order.nmId);
          if (!card) {
            throw new AppError(
              502,
              `Wildberries не вернул карточку товара ${order.nmId}`,
            );
          }
          done += 1;
          report(batches.length - index - 1);
          const sticker = stickers.get(order.id);
          // without a sticker there is nothing to print: never substitute other values
          return sticker ? toLabelOrder(order, toProduct(card), sticker) : null;
        }),
      );
      result.push(...prepared.filter((order): order is Order => order !== null));
    }

    this.deps.log.info(
      {
        requested: orders.length,
        inAssembly: inAssembly.length,
        prepared: result.length,
      },
      "orders prepared for labels",
    );
    return result;
  }
}
