import type { HydratedDocument } from "mongoose";
import {
  WarehouseModel,
  WarehouseSettingsModel,
  type WarehouseSettings,
  type WarehouseSettingsItem,
  type WarehouseSnapshot,
} from "../models";

export type WarehouseSettingsDocument = HydratedDocument<WarehouseSettings>;

/** Monitoring settings of a profile and the last seen coefficients ("snapshot"). */
export class MonitoringRepository {
  getSettings(profileId: string): Promise<WarehouseSettingsDocument | null> {
    return WarehouseSettingsModel.findOne({ userProfileId: profileId }).exec();
  }

  async createDefaults(profileId: string): Promise<{ deleteAll: () => Promise<void> }> {
    await Promise.all([
      WarehouseModel.create({ items: [], userProfileId: profileId }),
      WarehouseSettingsModel.create({
        items: [],
        userProfileId: profileId,
        enabled: true,
      }),
    ]);
    return {
      deleteAll: async () => {
        await Promise.all([
          WarehouseModel.deleteMany({ userProfileId: profileId }),
          WarehouseSettingsModel.deleteMany({ userProfileId: profileId }),
        ]);
      },
    };
  }

  /** Saves new settings and forgets the snapshot, so the next check reports everything again. */
  async replaceSettings(
    profileId: string,
    settings: { enabled: boolean; items: WarehouseSettingsItem[] },
  ): Promise<void> {
    await Promise.all([
      WarehouseSettingsModel.updateOne(
        { userProfileId: profileId },
        { ...settings, userProfileId: profileId },
        { upsert: true },
      ),
      WarehouseModel.updateOne(
        { userProfileId: profileId },
        { items: [], userProfileId: profileId },
        { upsert: true },
      ),
    ]);
  }

  async getSnapshot(profileId: string): Promise<WarehouseSnapshot | null> {
    return WarehouseModel.findOne({ userProfileId: profileId })
      .lean<WarehouseSnapshot>()
      .exec();
  }

  async saveSnapshot(snapshot: WarehouseSnapshot): Promise<void> {
    await WarehouseModel.updateOne({ userProfileId: snapshot.userProfileId }, snapshot, {
      upsert: true,
    });
  }
}
