import type { Config } from "./config";
import { createRepositories, type Repositories } from "./repositories";
import { AuthService, type MailSender } from "./services/auth.service";

export interface Services {
  auth: AuthService;
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
  };
}
