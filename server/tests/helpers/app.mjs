import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { inject } from "vitest";

// Application code is CommonJS: load it through Node's require so that tests
// and the app share the same mongoose instance.
export const require = createRequire(import.meta.url);

export const db = require("../../server-app/models");

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

export function createTestApp() {
  const { createApp } = require("../../server-app/app");
  return createApp();
}
