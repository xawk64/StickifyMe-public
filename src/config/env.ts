// Public runtime settings. Next.js inlines NEXT_PUBLIC_* variables at build time,
// so every variable must be referenced literally.
const trimSlash = (value: string) => value.replace(/\/$/, "");

export const API_URL = trimSlash(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
);
export const SITE_URL = trimSlash(
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
);
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com";
export const TELEGRAM_BOT_NAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || "your_monitoring_bot";
export const TELEGRAM_CHANNEL_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL || "https://t.me/";
