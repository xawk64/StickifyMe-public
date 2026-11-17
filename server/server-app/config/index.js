const path = require("path");

const toList = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

function loadConfig(env = process.env) {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  return {
    nodeEnv: env.NODE_ENV || "development",
    port: toInt(env.PORT, 4000),
    mongoUri: env.MONGO_URI || "mongodb://localhost:27017/stickifyme",
    jwtSecret: env.JWT_SECRET,
    corsOrigins: toList(env.CORS_ORIGINS || "http://localhost:3000"),
    appUrl: (env.APP_URL || "http://localhost:3000").replace(/\/$/, ""),
    adminEmail: env.ADMIN_EMAIL || "",
    mail: {
      host: env.SMTP_HOST || "",
      port: toInt(env.SMTP_PORT, 465),
      user: env.SMTP_USER || "",
      password: env.SMTP_PASSWORD || "",
      from: env.MAIL_FROM || '"StickifyMe" <no-reply@example.com>',
    },
    telegramBotToken: env.TELEGRAM_BOT_TOKEN || "",
    uploadsDir: path.resolve(env.UPLOADS_DIR || path.join(__dirname, "../../uploads")),
    monitoringIntervalMs: toInt(env.MONITORING_INTERVAL_MS, 17000),
  };
}

module.exports = loadConfig();
module.exports.loadConfig = loadConfig;
