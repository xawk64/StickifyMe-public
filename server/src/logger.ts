import pino from "pino";
import { config } from "./config";

/**
 * Structured JSON logs (one line per event) in production; human-readable
 * output in development when pino-pretty is installed.
 */
export const logger = pino({
  level: config.logLevel,
  base: { service: "stickifyme-api" },
  redact: {
    paths: ["req.headers['x-access-token']", "req.headers.authorization", "*.password"],
    censor: "[redacted]",
  },
  ...(config.nodeEnv === "development"
    ? { transport: { target: "pino-pretty", options: { translateTime: "SYS:HH:MM:ss" } } }
    : {}),
});

export type Logger = typeof logger;
