// Runs before every test file, before application modules are loaded.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.TELEGRAM_BOT_TOKEN = "";
process.env.SMTP_HOST = "";
process.env.ADMIN_EMAIL = "";
