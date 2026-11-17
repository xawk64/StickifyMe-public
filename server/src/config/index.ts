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
  WB_MARKETPLACE_API_URL: z.string().default("https://marketplace-api.wildberries.ru"),
  WB_CONTENT_API_URL: z.string().default("https://content-api.wildberries.ru"),
  WB_SUPPLIES_API_URL: z.string().default("https://supplies-api.wildberries.ru"),
  WB_TIMEOUT_MS: intFromEnv(15000),
  WB_MAX_RETRIES: intFromEnv(4),
  WB_RETRY_BASE_DELAY_MS: intFromEnv(1000),
  WB_RETRY_MAX_DELAY_MS: intFromEnv(65000),
  WB_STICKERS_BATCH_SIZE: intFromEnv(15),
  WB_BATCH_DELAY_MS: intFromEnv(60000),
  // 32 bytes, base64. Required in production; a fixed development key is used otherwise.
  WB_KEY_ENCRYPTION_KEY: z.string().optional(),
});

const DEVELOPMENT_ENCRYPTION_KEY = Buffer.alloc(32, "stickifyme-dev-only").toString(
  "base64",
);

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

  if (!e.WB_KEY_ENCRYPTION_KEY && e.NODE_ENV === "production") {
    throw new Error(
      "Invalid environment configuration: WB_KEY_ENCRYPTION_KEY is required",
    );
  }
  const wbKeyEncryptionKey = Buffer.from(
    e.WB_KEY_ENCRYPTION_KEY || DEVELOPMENT_ENCRYPTION_KEY,
    "base64",
  );
  if (wbKeyEncryptionKey.length !== 32) {
    throw new Error(
      "Invalid environment configuration: WB_KEY_ENCRYPTION_KEY must be 32 bytes",
    );
  }

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
    wb: {
      baseUrls: {
        marketplace: stripTrailingSlash(e.WB_MARKETPLACE_API_URL),
        content: stripTrailingSlash(e.WB_CONTENT_API_URL),
        supplies: stripTrailingSlash(e.WB_SUPPLIES_API_URL),
      },
      timeoutMs: e.WB_TIMEOUT_MS,
      retry: {
        retries: e.WB_MAX_RETRIES,
        baseDelayMs: e.WB_RETRY_BASE_DELAY_MS,
        maxDelayMs: e.WB_RETRY_MAX_DELAY_MS,
      },
      // WB limits sticker requests: orders are processed in batches with a pause
      stickersBatchSize: e.WB_STICKERS_BATCH_SIZE,
      batchDelayMs: e.WB_BATCH_DELAY_MS,
      keyEncryptionKey: wbKeyEncryptionKey,
    },
  };
}

export const config: Config = loadConfig();
