import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  clearTestDb,
  connectTestDb,
  db,
  disconnectTestDb,
  require,
} from "./helpers/app.mjs";

const service = require("../../server-app/services/warehousesMonitoringService");

const settingsItem = {
  ID: 507,
  boxTypes: ["Короба"],
  coeff: 1,
  dateStart: new Date("2024-10-01"),
  dateEnd: new Date("2024-10-10"),
};

describe("WarehouseCheckerService lifecycle", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    service.stopAllChecks();
    service.checkers = {};
    await clearTestDb();
  });
  afterAll(disconnectTestDb);

  it("does not reject when monitoring is enabled for a profile without stored settings", async () => {
    const profile = await db.profile.create({ fullName: "x", chatId: 1 });

    await expect(
      service.changeSettings(String(profile._id), {
        enabled: true,
        items: [settingsItem],
      }),
    ).resolves.toBeUndefined();
    expect(service.checkers[String(profile._id)]).toBeUndefined();
  });

  it("ignores removal of a checker that does not exist", () => {
    expect(() => service.removeChecker("missing")).not.toThrow();
  });

  it("starts a checker when enabled and stops it when disabled", async () => {
    const profile = await db.profile.create({ fullName: "x", chatId: 1 });
    const profileId = String(profile._id);
    await db.warehouseSettings.create({
      userProfileId: profileId,
      enabled: true,
      items: [settingsItem],
    });

    await service.changeSettings(profileId, { enabled: true, items: [settingsItem] });
    expect(service.checkers[profileId]?.isChecking).toBe(true);

    await service.changeSettings(profileId, { enabled: false, items: [settingsItem] });
    expect(service.checkers[profileId]).toBeUndefined();
  });
});
