import crypto from "node:crypto";

/** One-way hash for single-use tokens stored in the database. */
export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

/** URL-safe random token, e.g. for Telegram deep links. */
export const randomToken = (bytes = 24): string =>
  crypto.randomBytes(bytes).toString("base64url");
