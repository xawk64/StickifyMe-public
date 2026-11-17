import type { Config } from "./config";
import type { WbClient } from "./integrations/wb/wbClient";
import type { SecretBox } from "./utils/secretBox";
import type { Logger } from "./logger";
import { createRepositories, type Repositories } from "./repositories";
import { AuthService, type MailSender } from "./services/auth.service";
import { HistoryService } from "./services/history.service";
import { ImportService } from "./services/import.service";
import { defaultSleep } from "./integrations/wb/http";
import type { WarehouseMonitor } from "./services/monitoring/warehouseMonitor";
import { MonitoringSettingsService } from "./services/monitoringSettings.service";
import { ProfileService } from "./services/profile.service";
import { SupportService } from "./services/support.service";
import { TelegramLinkService } from "./services/telegramLink.service";

export interface Services {
  auth: AuthService;
  profile: ProfileService;
  telegramLink: TelegramLinkService;
  support: SupportService;
  history: HistoryService;
  monitoringSettings: MonitoringSettingsService;
  imports: ImportService;
}

export interface ServiceDeps {
  config: Config;
  mailer: MailSender;
  monitor: Pick<WarehouseMonitor, "isInitialized" | "changeSettings" | "addChecker">;
  log: Logger;
  wbClient: WbClient;
  secretBox: SecretBox;
  repositories?: Repositories;
}

/** Builds the application services with their dependencies passed explicitly. */
export function createServices({
  config,
  mailer,
  monitor,
  log,
  wbClient,
  secretBox,
  repositories = createRepositories(),
}: ServiceDeps): Services {
  return {
    auth: new AuthService({
      repositories,
      mailer,
      jwtSecret: config.jwtSecret,
      appUrl: config.appUrl,
    }),
    profile: new ProfileService({
      repositories,
      uploadsDir: config.uploadsDir,
      wbClient,
      secretBox,
      onWbApiKeyChanged: (profileId) => monitor.addChecker(profileId),
    }),
    telegramLink: new TelegramLinkService(repositories),
    support: new SupportService({ repositories, mailer }),
    history: new HistoryService({ repositories, mailer }),
    imports: new ImportService({
      repositories,
      wbClient,
      secretBox,
      stickersBatchSize: config.wb.stickersBatchSize,
      batchDelayMs: config.wb.batchDelayMs,
      sleep: defaultSleep,
      log: log.child({ module: "import" }),
    }),
    monitoringSettings: new MonitoringSettingsService({
      repositories,
      monitor,
      mailer,
      log,
    }),
  };
}
