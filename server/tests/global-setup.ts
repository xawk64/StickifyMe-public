import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer | undefined;

export async function setup(project: {
  provide: (key: "mongoUri", value: string) => void;
}): Promise<void> {
  mongod = await MongoMemoryServer.create();
  project.provide("mongoUri", mongod.getUri());
}

export async function teardown(): Promise<void> {
  await mongod?.stop();
}
