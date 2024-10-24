export const PAGES = {
  AUTH: "/auth",
  HOME: "/",
  IMPORTS: "/imports",
  SETTINGS: "/settings",
  SUPPORT: "/support",
  TELEGRAM_BOT: "/telegram-bot",
  HISTORY: "/history",
  // ... другие существующие страницы
};

export const PROTECTED_PAGES = [
  PAGES.IMPORTS,
  PAGES.SETTINGS,
  PAGES.SUPPORT,
  PAGES.TELEGRAM_BOT,
  PAGES.HISTORY,
  // ... другие защищенные страницы
];

export const PROTECTED_PAGES_WB = [
  PAGES.IMPORTS,
  PAGES.TELEGRAM_BOT,
  PAGES.HISTORY,
  // ... другие защищенные страницы
];
