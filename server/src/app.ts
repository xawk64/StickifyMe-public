import cors from "cors";
import express, { type Express } from "express";
import fileUpload from "express-fileupload";
import { rateLimit } from "express-rate-limit";
import { pinoHttp } from "pino-http";
import type { Config } from "./config";
import type { Services } from "./container";
import { requireAuth } from "./http/middlewares/auth";
import { createErrorHandler, notFoundHandler } from "./http/middlewares/errorHandler";
import { createAuthRouter } from "./http/routes/auth.routes";
import { createHistoryRouter } from "./http/routes/history.routes";
import { createImportsRouter } from "./http/routes/imports.routes";
import { createLabelsRouter } from "./http/routes/labels.routes";
import { createMonitoringRouter } from "./http/routes/monitoring.routes";
import { createProfileRouter } from "./http/routes/profile.routes";
import { createSupportRouter } from "./http/routes/support.routes";
import { createTelegramRouter } from "./http/routes/telegram.routes";
import type { Logger } from "./logger";

// Only label endpoints carry sticker images; everything else gets a small body limit.
const LARGE_PAYLOAD_ROUTES = ["/api/barcodes/generate", "/api/barcodes-history/add"];

const AUTH_ROUTES = [
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/reset-password",
  "/api/auth/confirm-reset-password",
];

export interface AppDeps {
  config: Config;
  services: Services;
  log: Logger;
  /** Overrides for tests. */
  authRateLimit?: Partial<Config["authRateLimit"]>;
}

/** HTTP layer only: middlewares and routers. No I/O happens at construction time. */
export function createApp({ config, services, log, authRateLimit }: AppDeps): Express {
  const app = express();
  app.set("trust proxy", config.trustProxy);

  app.use(pinoHttp({ logger: log, autoLogging: { ignore: (req) => req.url === "/" } }));
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(
    "/uploads",
    express.static(config.uploadsDir, {
      setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
    }),
  );
  app.use(fileUpload({ createParentPath: true, limits: { fileSize: 50 * 1024 * 1024 } }));
  // body-parser skips requests that were already parsed, so the order matters
  app.use(LARGE_PAYLOAD_ROUTES, express.json({ limit: "50mb" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    AUTH_ROUTES,
    rateLimit({
      ...config.authRateLimit,
      ...authRateLimit,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { message: "Слишком много попыток, попробуйте позже" },
    }),
  );

  const auth = requireAuth(config.jwtSecret);
  app.use(createAuthRouter(services.auth, auth));
  app.use(createProfileRouter(services.profile, auth));
  app.use(createHistoryRouter(services.history, auth));
  app.use(createLabelsRouter(auth));
  app.use(createImportsRouter(services.imports, auth, log));
  app.use(createMonitoringRouter(services.monitoringSettings, auth));
  app.use(createSupportRouter(services.support, auth));
  app.use(createTelegramRouter(services.telegramLink, auth));
  app.get("/", (_req, res) => {
    res.json({ message: "StickifyMe API" });
  });

  app.use(notFoundHandler);
  app.use(createErrorHandler(log));
  return app;
}
