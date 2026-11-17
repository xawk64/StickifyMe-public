import type { Config } from "./config";
import { createRepositories, type Repositories } from "./repositories";
import { AuthService, type MailSender } from "./services/auth.service";
import { ProfileService } from "./services/profile.service";
import { SupportService } from "./services/support.service";
import { HistoryService } from "./services/history.service";

export interface Services {
  auth: AuthService;
  profile: ProfileService;
  support: SupportService;
  history: HistoryService;
}

export interface ServiceDeps {
  config: Config;
  mailer: MailSender;
  repositories?: Repositories;
}

/** Builds the application services with their dependencies passed explicitly. */
export function createServices({
  config,
  mailer,
  repositories = createRepositories(),
}: ServiceDeps): Services {
  return {
    auth: new AuthService({
      repositories,
      mailer,
      jwtSecret: config.jwtSecret,
      appUrl: config.appUrl,
    }),
    profile: new ProfileService({ repositories, uploadsDir: config.uploadsDir }),
    support: new SupportService({ repositories, mailer }),
    history: new HistoryService({ repositories, mailer }),
  };
}
