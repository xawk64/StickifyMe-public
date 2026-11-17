import { randomUUID } from "node:crypto";
import type { Express } from "express";
import mongoose from "mongoose";
import { inject } from "vitest";
import { createApp, type AppDeps } from "../../src/app";
import { config } from "../../src/config";
import { createServices } from "../../src/container";
import { logger } from "../../src/logger";
import type { WbClient } from "../../src/integrations/wb/wbClient";
import { createMailer } from "../../src/mail/mailer";
import { SecretBox } from "../../src/utils/secretBox";

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
export const testSecretBox = new SecretBox(config.wb.keyEncryptionKey);

/** WB client stub: every key is valid unless a test overrides it. */
export const fakeWbClient = () => ({ ping: async () => {} }) as unknown as WbClient;

export function createTestApp(
  overrides: Partial<AppDeps> & { wbClient?: WbClient } = {},
): Express {
  const { wbClient = fakeWbClient(), ...appOverrides } = overrides;
  const services = createServices({
    config,
    mailer: createMailer(config, logger),
    monitor: {
      isInitialized: true,
      changeSettings: async () => {},
      addChecker: async () => {},
    },
    log: logger,
    wbClient,
    secretBox: testSecretBox,
  });
  return createApp({ config, services, log: logger, ...appOverrides });
}
