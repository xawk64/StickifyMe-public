import { randomUUID } from "node:crypto";
import type { Express } from "express";
import mongoose from "mongoose";
import { inject } from "vitest";
import { createApp, type AppDeps } from "../../src/app";
import { config } from "../../src/config";
import { createServices } from "../../src/container";
import { logger } from "../../src/logger";
import { createMailer } from "../../src/mail/mailer";

export { db } from "../../src/models";

declare module "vitest" {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

export async function connectTestDb(): Promise<void> {
  await mongoose.connect(inject("mongoUri"), { dbName: `test_${randomUUID()}` });
}

export async function clearTestDb(): Promise<void> {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

/**
 * Builds the app the same way the composition root does, with a dry-run mailer
 * and a monitor stub (no polling in tests).
 */
export function createTestApp(overrides: Partial<AppDeps> = {}): Express {
  const services = createServices({
    config,
    mailer: createMailer(config, logger),
    monitor: { isInitialized: true, changeSettings: async () => {} },
    log: logger,
  });
  return createApp({ config, services, log: logger, ...overrides });
}
