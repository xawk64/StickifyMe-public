import request from "supertest";
import { db } from "./app.mjs";

let counter = 0;

/** Registers a user through the public API and returns its token and ids. */
export async function registerUser(app, overrides = {}) {
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
  return {
    ...credentials,
    token: signin.body.accessToken,
    userId: String(user._id),
    profileId: String(user.profileId),
  };
}

export const authed = (token) => ({ "x-access-token": token });
