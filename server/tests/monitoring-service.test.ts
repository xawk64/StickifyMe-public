import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  db,
  disconnectTestDb,
  testSecretBox,
} from "./helpers/app";

import { WbAuthError } from "../src/integrations/wb/errors";
import {
  INVALID_KEY_MESSAGE,
  WarehouseMonitor,
  type WarehouseMonitorDeps,
} from "../src/services/monitoring/warehouseMonitor";
import { createRepositories } from "../src/repositories";
import { logger } from "../src/logger";

const settingsItem = {
  ID: 507,
  boxTypes: ["Короба"],
  coeff: 1,
  dateStart: new Date("2024-10-01"),
  dateEnd: new Date("2024-10-10"),
};

function createMonitor(overrides: Partial<WarehouseMonitorDeps> = {}) {
  return new WarehouseMonitor({
    repositories: createRepositories(),
    wbClient: { getAcceptanceCoefficients: vi.fn().mockResolvedValue([]) },
    notifier: { sendMessage: vi.fn().mockResolvedValue(undefined) },
    intervalMs: 60_000,
    secretBox: testSecretBox,
    log: logger,
    ...overrides,
  });
}

describe("WarehouseMonitor lifecycle", () => {
  let monitor: WarehouseMonitor | undefined;

  beforeAll(connectTestDb);
  afterEach(async () => {
    monitor?.stopAll();
    await clearTestDb();
  });
  afterAll(disconnectTestDb);

  it("does not reject when monitoring is enabled for a profile without stored settings", async () => {
    monitor = createMonitor();
    const profile = await db.profile.create({ fullName: "x", chatId: 1 });

    await expect(
      monitor.changeSettings(String(profile._id), {
        enabled: true,
        items: [settingsItem],
      }),
    ).resolves.toBeUndefined();
    expect(monitor.getChecker(String(profile._id))).toBeUndefined();
  });

  it("ignores removal of a checker that does not exist", () => {
    const fresh = createMonitor();
    monitor = fresh;
    expect(() => fresh.removeChecker("missing")).not.toThrow();
  });

  it("starts a checker when enabled and stops it when disabled", async () => {
    monitor = createMonitor();
    const profile = await db.profile.create({
      fullName: "x",
      chatId: 1,
      wbApiKeyEncrypted: testSecretBox.encrypt("key"),
    });
    const profileId = String(profile._id);
    await db.warehouseSettings.create({
      userProfileId: profileId,
      enabled: true,
      items: [settingsItem],
    });

    await monitor.changeSettings(profileId, { enabled: true, items: [settingsItem] });
    expect(monitor.getChecker(profileId)?.isChecking).toBe(true);

    await monitor.changeSettings(profileId, { enabled: false, items: [settingsItem] });
    expect(monitor.getChecker(profileId)).toBeUndefined();
  });

  it("notifies the linked chat and stores the snapshot after a check", async () => {
    const coefficient = {
      date: "2024-10-05T00:00:00Z",
      coefficient: 0,
      warehouseID: 507,
      warehouseName: "Коледино",
      boxTypeName: "Короба",
    };
    const notifier = { sendMessage: vi.fn().mockResolvedValue(undefined) };
    monitor = createMonitor({
      notifier,
      wbClient: { getAcceptanceCoefficients: vi.fn().mockResolvedValue([coefficient]) },
    });
    const profile = await db.profile.create({
      fullName: "x",
      chatId: 42,
      wbApiKeyEncrypted: testSecretBox.encrypt("key"),
    });
    const profileId = String(profile._id);
    await db.warehouseSettings.create({
      userProfileId: profileId,
      enabled: true,
      items: [settingsItem],
    });

    await monitor.addChecker(profileId);
    await monitor.getChecker(profileId)!.performCheck();

    expect(notifier.sendMessage).toHaveBeenCalledWith(
      42,
      expect.stringContaining("Коледино"),
    );
    const snapshot = (await db.warehouse.findOne({ userProfileId: profileId }))!;
    expect(snapshot.items).toHaveLength(1);
  });

  async function watchedProfile() {
    const profile = await db.profile.create({
      fullName: "x",
      chatId: 42,
      wbApiKeyEncrypted: testSecretBox.encrypt("key"),
    });
    const profileId = String(profile._id);
    await db.warehouseSettings.create({
      userProfileId: profileId,
      enabled: true,
      items: [settingsItem],
    });
    return profileId;
  }

  it("never runs two checks for one profile at the same time", async () => {
    let release!: () => void;
    const getAcceptanceCoefficients = vi.fn(
      () => new Promise<never[]>((resolve) => (release = () => resolve([]))),
    );
    monitor = createMonitor({ wbClient: { getAcceptanceCoefficients } });
    const profileId = await watchedProfile();
    await monitor.addChecker(profileId);
    const checker = monitor.getChecker(profileId)!;

    const first = checker.performCheck();
    await checker.performCheck(); // a tick while WB is still answering
    release();
    await first;

    expect(getAcceptanceCoefficients).toHaveBeenCalledTimes(1);
  });

  it("stops monitoring and tells the seller when WB rejects the key", async () => {
    const notifier = { sendMessage: vi.fn().mockResolvedValue(undefined) };
    monitor = createMonitor({
      notifier,
      wbClient: {
        getAcceptanceCoefficients: vi
          .fn()
          .mockRejectedValue(new WbAuthError("unauthorized", 401)),
      },
    });
    const profileId = await watchedProfile();
    await monitor.addChecker(profileId);

    await monitor.getChecker(profileId)!.performCheck();

    expect(monitor.getChecker(profileId)).toBeUndefined();
    expect(notifier.sendMessage).toHaveBeenCalledWith(42, INVALID_KEY_MESSAGE);
  });
});
