import { AppError, NotFoundError } from "../errors";
import type { Logger } from "../logger";
import * as templates from "../mail/templates";
import type { Repositories, WarehouseSettingsDocument } from "../repositories";
import type { MailSender } from "./auth.service";
import type { MonitoringSettings, WarehouseMonitor } from "./monitoring/warehouseMonitor";

export interface MonitoringSettingsServiceDeps {
  repositories: Pick<Repositories, "users" | "monitoring">;
  monitor: Pick<WarehouseMonitor, "isInitialized" | "changeSettings">;
  mailer: MailSender;
  log: Logger;
}

export class MonitoringSettingsService {
  constructor(private readonly deps: MonitoringSettingsServiceDeps) {}

  private async profileIdOf(
    userId: string,
  ): Promise<{ profileId: string; email: string; username: string }> {
    const user = await this.deps.repositories.users.findById(userId);
    if (!user || !user.profileId) {
      throw new NotFoundError("Пользователь не найден");
    }
    return { profileId: user.profileId, email: user.email, username: user.username };
  }

  async get(userId: string): Promise<WarehouseSettingsDocument | null> {
    const { profileId } = await this.profileIdOf(userId);
    return this.deps.repositories.monitoring.getSettings(profileId);
  }

  /** Saves settings and restarts (or stops) the profile's monitoring loop. */
  async save(userId: string, settings: MonitoringSettings): Promise<void> {
    try {
      const user = await this.profileIdOf(userId);
      await this.deps.repositories.monitoring.replaceSettings(user.profileId, settings);
      if (!this.deps.monitor.isInitialized) {
        throw new AppError(400, "Некорректные данные");
      }
      await this.deps.monitor.changeSettings(user.profileId, settings);
      void this.deps.mailer.notifyAdmin(
        templates.adminMonitoringSettings({
          email: user.email,
          username: user.username,
          settings: { ...settings, userProfileId: user.profileId },
        }),
      );
    } catch (err) {
      if (!(err instanceof AppError)) {
        this.deps.log.error({ err, userId }, "failed to save monitoring settings");
        void this.deps.mailer.notifyAdmin(
          templates.adminMonitoringSettingsError({ userId }),
        );
      }
      throw err;
    }
  }
}
