// Transitional shared instance until the composition root wires the monitor.
import { config } from "../../config";
import { logger } from "../../logger";
import { createRepositories } from "../../repositories";
import { telegramBot } from "../../telegram/legacyInstance";
import { WarehouseMonitor } from "./warehouseMonitor";
import { fetchCoefficients } from "./wbCoefficients";

export const monitor = new WarehouseMonitor({
  repositories: createRepositories(),
  fetchCoefficients,
  notifier: telegramBot,
  intervalMs: config.monitoringIntervalMs,
  log: logger,
});
