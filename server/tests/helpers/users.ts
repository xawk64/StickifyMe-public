import type { Express } from "express";
import request from "supertest";
import { db } from "./app";

let counter = 0;

export interface TestUser {
  username: string;
  email: string;
  password: string;
  token: string;
  userId: string;
  profileId: string;
}

/** Registers a user through the public API and returns its token and ids. */
export async function registerUser(
  app: Express,
  overrides: Partial<Pick<TestUser, "username" | "email" | "password">> = {},
): Promise<TestUser> {
  counter += 1;
  const credentials = {
    username: `seller${counter}`,
    email: `seller${counter}@example.com`,
    password: "password123",
    ...overrides,
  };

  const signup = await request(app).post("/api/auth/signup").send(credentials);
  if (signup.status !== 200) {
    throw new Error(`signup failed: ${signup.status} ${JSON.stringify(signup.body)}`);
  }
  const signin = await request(app)
    .post("/api/auth/signin")
    .send({ username: credentials.username, password: credentials.password });

  const user = await db.user.findOne({ username: credentials.username });
  if (!user) {
    throw new Error("registered user not found");
  }
  return {
    ...credentials,
    token: signin.body.accessToken,
    userId: String(user._id),
    profileId: String(user.profileId),
  };
}

export const authed = (token: string) => ({ "x-access-token": token });
