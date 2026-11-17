import path from "node:path";
import { z } from "zod";

const intFromEnv = (fallback: number) =>
  z.preprocess(
    (value) => (value === undefined || value === "" ? fallback : value),
    z.coerce.number().int(),
  );

const listFromEnv = (fallback: string) =>
  z
    .string()
    .optional()
    .transform((value) =>
      (value || fallback)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    );

const stripTrailingSlash = (value: string) => value.replace(/\/$/, "");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  PORT: intFromEnv(4000),
  MONGO_URI: z.string().min(1).default("mongodb://localhost:27017/stickifyme"),
  JWT_SECRET: z.string({ error: "JWT_SECRET environment variable is required" }).min(1),
  CORS_ORIGINS: listFromEnv("http://localhost:3000"),
  APP_URL: z.string().default("http://localhost:3000").transform(stripTrailingSlash),
  ADMIN_EMAIL: z.string().default(""),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: intFromEnv(465),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  MAIL_FROM: z.string().default('"StickifyMe" <no-reply@example.com>'),
  TELEGRAM_BOT_TOKEN: z.string().default(""),
  UPLOADS_DIR: z.string().optional(),
  TRUST_PROXY: intFromEnv(0),
  AUTH_RATE_LIMIT_MAX: intFromEnv(20),
  MONITORING_INTERVAL_MS: intFromEnv(17000),
});

export type Config = ReturnType<typeof loadConfig>;

/** Parses and validates environment variables; throws with a readable message. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  const e = parsed.data;

  return {
    nodeEnv: e.NODE_ENV,
    logLevel: e.LOG_LEVEL,
    port: e.PORT,
    mongoUri: e.MONGO_URI,
    jwtSecret: e.JWT_SECRET,
    corsOrigins: e.CORS_ORIGINS,
    appUrl: e.APP_URL,
    adminEmail: e.ADMIN_EMAIL,
    mail: {
      host: e.SMTP_HOST,
      port: e.SMTP_PORT,
      user: e.SMTP_USER,
      password: e.SMTP_PASSWORD,
      from: e.MAIL_FROM,
    },
    telegramBotToken: e.TELEGRAM_BOT_TOKEN,
    // server/uploads both from src/config and dist/config
    uploadsDir: path.resolve(e.UPLOADS_DIR || path.join(__dirname, "../../uploads")),
    // "1" when running behind a single reverse proxy, so rate limiting sees the real client IP
    trustProxy: e.TRUST_PROXY,
    authRateLimit: {
      windowMs: 15 * 60 * 1000,
      limit: e.AUTH_RATE_LIMIT_MAX,
    },
    monitoringIntervalMs: e.MONITORING_INTERVAL_MS,
  };
}

export const config: Config = loadConfig();
