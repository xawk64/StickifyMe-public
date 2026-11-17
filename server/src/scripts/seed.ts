/**
 * Demo data for the local stack: a seller account with a WB key (accepted by the
 * mock), monitoring settings, a linked "chat" and a few label history entries.
 * Idempotent: re-running it resets the demo account to the same state.
 *
 *   docker compose run --rm seed      (or: yarn seed, with MONGO_URI set)
 */
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { config } from "../config";
import { logger } from "../logger";
import {
  BarcodesHistoryModel,
  ProfileModel,
  UserModel,
  WarehouseModel,
  WarehouseSettingsModel,
  type Order,
} from "../models";
import { hashPassword } from "../utils/password";
import { SecretBox } from "../utils/secretBox";

export const DEMO_USER = {
  username: "demo",
  email: "demo@example.com",
  password: "demo12345",
};
const DEMO_WB_API_KEY = process.env.DEMO_WB_API_KEY ?? "demo-wb-api-key";
// Notifications for this fake chat are only logged unless a real bot token is configured.
const DEMO_CHAT_ID = 100_000_001;

// 1x1 PNG standing in for the WB sticker image in history entries
const BLANK_STICKER_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000);

function demoOrders(count: number, offset: number): Order[] {
  return Array.from({ length: count }, (_, i) => ({
    id: 3_000_000_000 + offset + i,
    nmId: 180_000_000 + i * 1371,
    createdAtMarket: daysFromNow(-offset).toISOString(),
    deliveryType: "fbs",
    stickersCount: 1,
    bcUp: String(100_000 + offset + i),
    bcDown: String(1_000 + i),
    barcode: `*demo${offset + i}`,
    barcodeFile: BLANK_STICKER_PNG,
    product: {
      id: 180_000_000 + i * 1371,
      barcode: "4600000000003",
      title: `Демо-товар ${i + 1}`,
      vendorCode: `ART-${1001 + i}`,
      brand: "NordWear",
      subjectName: "Футболки",
      characteristics: { Цвет: ["чёрный"], "Страна производства": ["Россия"] },
    },
  }));
}

export async function seed(): Promise<void> {
  const secretBox = new SecretBox(config.wb.keyEncryptionKey);

  const existing = await UserModel.findOne({ username: DEMO_USER.username });
  if (existing) {
    await Promise.all([
      ProfileModel.deleteOne({ _id: existing.profileId }),
      WarehouseModel.deleteMany({ userProfileId: existing.profileId }),
      WarehouseSettingsModel.deleteMany({ userProfileId: existing.profileId }),
      BarcodesHistoryModel.deleteMany({ userId: existing.id }),
      existing.deleteOne(),
    ]);
  }

  const profile = await ProfileModel.create({
    fullName: "ООО «Демо Селлер»",
    chatId: DEMO_CHAT_ID,
    wbApiKeyEncrypted: secretBox.encrypt(DEMO_WB_API_KEY),
  });
  const profileId = String(profile._id);
  const user = await UserModel.create({
    ...DEMO_USER,
    password: await hashPassword(DEMO_USER.password),
    emailVerification: true,
    emailVerificationHash: randomUUID(),
    profileId,
  });

  await WarehouseModel.create({ items: [], userProfileId: profileId });
  await WarehouseSettingsModel.create({
    userProfileId: profileId,
    enabled: true,
    items: [
      {
        ID: 507,
        boxTypes: ["Короба"],
        coeff: 2,
        dateStart: daysFromNow(0),
        dateEnd: daysFromNow(13),
      },
      {
        ID: 117986,
        boxTypes: ["Короба", "Монопаллеты"],
        coeff: 1,
        dateStart: daysFromNow(0),
        dateEnd: daysFromNow(13),
      },
    ],
  });

  for (const [count, offset] of [
    [3, 1],
    [5, 2],
  ] as const) {
    const orders = demoOrders(count, offset);
    await BarcodesHistoryModel.create({
      userId: user.id,
      type: "wb",
      orders,
      ordersCount: count,
    });
  }

  logger.info(
    { username: DEMO_USER.username, password: DEMO_USER.password },
    "demo account is ready",
  );
}

if (require.main === module) {
  mongoose
    .connect(config.mongoUri)
    .then(seed)
    .then(() => mongoose.disconnect())
    .catch(async (err: unknown) => {
      logger.fatal({ err }, "seeding failed");
      await mongoose.disconnect();
      process.exit(1);
    });
}
