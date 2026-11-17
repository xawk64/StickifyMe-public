import { escapeHtml } from "../utils/html";

export interface EmailTemplate {
  subject: string;
  html: string;
}

// Every value interpolated into HTML goes through escapeHtml:
// usernames, support messages etc. are user input.
const line = (label: string, value: unknown) => `${label}: ${escapeHtml(value)}<br/>`;
const now = () => new Date().toLocaleString("ru-RU");

export const welcome = ({
  username,
  appUrl,
}: {
  username: string;
  appUrl: string;
}): EmailTemplate => ({
  subject: "Подтверждение учетной записи",
  html:
    `Добрый день, ${escapeHtml(username)}! <br />Вы зарегистрировались на сервисе StickifyMe. ` +
    `Для дальнейшей работы вам необходимо ввести ключ API WB. <br />` +
    `Для этого перейдите по ссылке: ${escapeHtml(`${appUrl}/settings`)}`,
});

export const passwordReset = ({
  name,
  link,
}: {
  name: string;
  link: string;
}): EmailTemplate => ({
  subject: "Сброс пароля",
  html: `Добрый день, ${escapeHtml(name)}! Для сброса пароля перейдите по ссылке: ${escapeHtml(link)}`,
});

export const verificationReminder = ({
  username,
  link,
}: {
  username: string;
  link: string;
}): EmailTemplate => ({
  subject: "Подтверждение учетной записи",
  html:
    `Добрый день, ${escapeHtml(username)}! <br />Вы запросили повторное подтверждение почты ` +
    `на сервисе StickifyMe. Для подтверждения перейдите по ссылке: ${escapeHtml(link)} <br />` +
    `Если это делали не Вы, просьба закрыть данное сообщение.`,
});

export const adminNewSignup = ({
  email,
  username,
}: {
  email: string;
  username: string;
}): EmailTemplate => ({
  subject: "Новая регистрация в StickifyMe",
  html:
    "Зарегистрирован новый пользователь:<br/>" +
    line("Email", email) +
    line("Username", username) +
    line("Дата", now()),
});

export const adminLabelsHistory = ({
  username,
  ordersCount,
}: {
  username: string;
  ordersCount: number;
}): EmailTemplate => ({
  subject: "История этикеток",
  html: `Пользователь ${escapeHtml(username)} подготовил историю этикеток для ${Number(ordersCount)} товаров`,
});

export const adminSupportRequest = ({
  email,
  type,
  message,
}: {
  email: string;
  type: string;
  message: string;
}): EmailTemplate => ({
  subject: `Новое обращение: ${type}`,
  html:
    line("От пользователя", email) +
    line("Тип", type) +
    `Сообщение:<br/>${escapeHtml(message).replace(/\n/g, "<br/>")}`,
});

export const adminMonitoringSettings = ({
  email,
  username,
  settings,
}: {
  email: string;
  username: string;
  settings: unknown;
}): EmailTemplate => ({
  subject: "Обновление настроек мониторинга",
  html:
    "Пользователь обновил настройки мониторинга:<br/>" +
    line("Email", email) +
    line("Username", username) +
    `Настройки: <pre>${escapeHtml(JSON.stringify(settings, null, 2))}</pre>` +
    line("Дата", now()),
});

export const adminMonitoringSettingsError = ({
  userId,
}: {
  userId: string;
}): EmailTemplate => ({
  subject: "Обновление настроек мониторинга",
  html:
    "Произошла ошибка при обработке запроса:<br/>" +
    line("UserId", userId) +
    line("Дата", now()),
});

export const adminTelegramConnected = ({
  email,
  username,
  chatId,
}: {
  email?: string;
  username?: string;
  chatId: number;
}): EmailTemplate => ({
  subject: "Подключение Telegram бота",
  html:
    "Пользователь подключил Telegram бота:<br/>" +
    line("Email", email) +
    line("Username", username) +
    line("ChatId", chatId) +
    line("Дата", now()),
});

export const adminCrash = ({
  title,
  details,
}: {
  title: string;
  details: string;
}): EmailTemplate => ({
  subject: title,
  html: `<pre>${escapeHtml(details)}</pre>`,
});
