/**
 * Composition root: the only place where infrastructure is created and wired.
 * Everything else receives its dependencies explicitly.
 */
import type { Server } from "node:http";
import mongoose from "mongoose";
import { createApp } from "./app";
import { config } from "./config";
import { createServices } from "./container";
import { logger } from "./logger";
import { createMailer } from "./mail/mailer";
import * as templates from "./mail/templates";
import { createRepositories } from "./repositories";
import { WbClient } from "./integrations/wb/wbClient";
import { SecretBox } from "./utils/secretBox";
import { WarehouseMonitor } from "./services/monitoring/warehouseMonitor";
import { TelegramLinkService } from "./services/telegramLink.service";
import { TelegramBot, createBotClient } from "./telegram/telegramBot";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const repositories = createRepositories();
const secretBox = new SecretBox(config.wb.keyEncryptionKey);
const wbClient = new WbClient({ ...config.wb, log: logger.child({ module: "wb" }) });
const mailer = createMailer(config, logger.child({ module: "mail" }));
const botClient = createBotClient(config.telegramBotToken);
const bot: TelegramBot = new TelegramBot({
  client: botClient,
  telegramLink: new TelegramLinkService(repositories),
  mailer,
  log: logger.child({ module: "telegram" }),
  // `monitor` is created below; the callback runs only after startup
  onChatLinked: (profileId: string): Promise<void> => monitor.addChecker(profileId),
});
const monitor: WarehouseMonitor = new WarehouseMonitor({
  repositories,
  wbClient,
  notifier: bot,
  intervalMs: config.monitoringIntervalMs,
  secretBox,
  log: logger.child({ module: "monitoring" }),
});
const services = createServices({
  config,
  mailer,
  monitor,
  log: logger,
  wbClient,
  secretBox,
  repositories,
});
const app = createApp({ config, services, log: logger });

let httpServer: Server | null = null;
let shuttingDown = false;

async function shutdown(exitCode: number): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  logger.info("shutting down");
  setTimeout(() => {
    logger.error("could not close connections in time, forcing exit");
    process.exit(exitCode);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  try {
    monitor.stopAll();
    await bot.stop();
    if (httpServer) {
      await new Promise((resolve) => httpServer?.close(resolve));
    }
    await mongoose.disconnect();
  } catch (err) {
    logger.error({ err }, "error during shutdown");
  } finally {
    process.exit(exitCode);
  }
}

async function crash(title: string, err: unknown): Promise<void> {
  logger.fatal({ err }, title);
  const details = err instanceof Error ? (err.stack ?? err.message) : String(err);
  await mailer.notifyAdmin(templates.adminCrash({ title, details }));
  await shutdown(1);
}

process.on("uncaughtException", (err) => void crash("Uncaught Exception in Server", err));
process.on(
  "unhandledRejection",
  (reason) => void crash("Unhandled Rejection in Server", reason),
);
process.on("SIGTERM", () => void shutdown(0));
process.on("SIGINT", () => void shutdown(0));

async function main(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  logger.info("connected to MongoDB");

  // Start accepting requests only after the database is reachable
  httpServer = app.listen(config.port, () =>
    logger.info({ port: config.port }, "API listening"),
  );
  bot.start();
  await monitor.initialize();
  await mailer.verify();
}

main().catch((err: unknown) => {
  logger.fatal({ err }, "failed to start");
  process.exit(1);
});
