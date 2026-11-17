import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";

const TOKEN_HEADER = "x-access-token";

interface TokenPayload {
  id: string;
}

const isTokenPayload = (value: unknown): value is TokenPayload =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as TokenPayload).id === "string";

/**
 * Requires a valid JWT in the x-access-token header and exposes the user id as req.userId.
 * 403 without a token, 401 for an invalid or expired one (kept for the web client).
 */
export function requireAuth(jwtSecret: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers[TOKEN_HEADER];
    if (typeof token !== "string" || !token) {
      res.status(403).send({ message: "No token provided!" });
      return;
    }
    try {
      const payload = jwt.verify(token, jwtSecret);
      if (!isTokenPayload(payload)) {
        throw new Error("unexpected token payload");
      }
      req.userId = payload.id;
      next();
    } catch {
      res.status(401).send({ message: "Unauthorized!" });
    }
  };
}

export function signAccessToken(
  userId: string,
  jwtSecret: string,
  ttlSeconds: number,
): string {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: ttlSeconds });
}

/** Narrows req.userId for handlers mounted behind requireAuth. */
export function currentUserId(req: Request): string {
  if (!req.userId) {
    throw new Error("currentUserId used on a route without requireAuth");
  }
  return req.userId;
}
