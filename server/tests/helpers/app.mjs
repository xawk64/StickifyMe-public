import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { inject } from "vitest";

// Application code is CommonJS: load it through Node's require so that tests
// and the app share the same mongoose instance.
export const require = createRequire(import.meta.url);

export const { db } = require("../../dist/models");

export async function connectTestDb() {
  const uri = inject("mongoUri");
  await db.mongoose.connect(uri, {
    dbName: `test_${randomUUID()}`,
  });
}

export async function clearTestDb() {
  const collections = Object.values(db.mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function disconnectTestDb() {
  await db.mongoose.connection.dropDatabase();
  await db.mongoose.disconnect();
}

/**
 * Builds the app the same way the composition root does, with a dry-run mailer
 * and a monitor stub (no polling in tests).
 */
export function createTestApp(overrides = {}) {
  const { createApp } = require("../../dist/app");
  const { createServices } = require("../../dist/container");
  const { config } = require("../../dist/config");
  const { logger } = require("../../dist/logger");
  const { createMailer } = require("../../dist/mail/mailer");
  const monitor = { isInitialized: true, changeSettings: async () => {} };
  const services = createServices({
    config,
    mailer: createMailer(config, logger),
    monitor,
    log: logger,
  });
  return createApp({ config, services, log: logger, ...overrides });
}
