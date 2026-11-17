import os from "node:os";
import path from "node:path";

// Runs before every test file, before application modules are loaded.
process.env.NODE_ENV = "test";
process.env.WB_BATCH_DELAY_MS = "0";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.TELEGRAM_BOT_TOKEN = "";
process.env.SMTP_HOST = "";
process.env.ADMIN_EMAIL = "";
process.env.UPLOADS_DIR = path.join(
  os.tmpdir(),
  "stickifyme-test-uploads",
  String(process.pid),
);
process.env.AUTH_RATE_LIMIT_MAX = "1000";
process.env.LOG_LEVEL = "silent";
