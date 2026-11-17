const { escapeHtml } = require("../utils/html");

// Every value interpolated into HTML goes through escapeHtml:
// usernames, support messages etc. are user input.
const line = (label, value) => `${label}: ${escapeHtml(value)}<br/>`;
const now = () => new Date().toLocaleString("ru-RU");

const welcome = ({ username, appUrl }) => ({
  subject: "Подтверждение учетной записи",
  html:
    `Добрый день, ${escapeHtml(username)}! <br />Вы зарегистрировались на сервисе StickifyMe. ` +
    `Для дальнейшей работы вам необходимо ввести ключ API WB. <br />` +
    `Для этого перейдите по ссылке: ${escapeHtml(`${appUrl}/settings`)}`,
});

const passwordReset = ({ name, link }) => ({
  subject: "Сброс пароля",
  html: `Добрый день, ${escapeHtml(name)}! Для сброса пароля перейдите по ссылке: ${escapeHtml(link)}`,
});

const verificationReminder = ({ username, link }) => ({
  subject: "Подтверждение учетной записи",
  html:
    `Добрый день, ${escapeHtml(username)}! <br />Вы запросили повторное подтверждение почты ` +
    `на сервисе StickifyMe. Для подтверждения перейдите по ссылке: ${escapeHtml(link)} <br />` +
    `Если это делали не Вы, просьба закрыть данное сообщение.`,
});

const adminNewSignup = ({ email, username }) => ({
  subject: "Новая регистрация в StickifyMe",
  html:
    "Зарегистрирован новый пользователь:<br/>" +
    line("Email", email) +
    line("Username", username) +
    line("Дата", now()),
});

const adminLabelsHistory = ({ username, ordersCount }) => ({
  subject: "История этикеток",
  html: `Пользователь ${escapeHtml(username)} подготовил историю этикеток для ${Number(ordersCount)} товаров`,
});

const adminSupportRequest = ({ email, type, message }) => ({
  subject: `Новое обращение: ${type}`,
  html:
    line("От пользователя", email) +
    line("Тип", type) +
    `Сообщение:<br/>${escapeHtml(message).replace(/\n/g, "<br/>")}`,
});

const adminMonitoringSettings = ({ email, username, settings }) => ({
  subject: "Обновление настроек мониторинга",
  html:
    "Пользователь обновил настройки мониторинга:<br/>" +
    line("Email", email) +
    line("Username", username) +
    `Настройки: <pre>${escapeHtml(JSON.stringify(settings, null, 2))}</pre>` +
    line("Дата", now()),
});

const adminMonitoringSettingsError = ({ userId }) => ({
  subject: "Обновление настроек мониторинга",
  html:
    "Произошла ошибка при обработке запроса:<br/>" +
    line("UserId", userId) +
    line("Дата", now()),
});

const adminTelegramConnected = ({ email, username, chatId }) => ({
  subject: "Подключение Telegram бота",
  html:
    "Пользователь подключил Telegram бота:<br/>" +
    line("Email", email) +
    line("Username", username) +
    line("ChatId", chatId) +
    line("Дата", now()),
});

const adminCrash = ({ title, details }) => ({
  subject: title,
  html: `<pre>${escapeHtml(details)}</pre>`,
});

module.exports = {
  welcome,
  passwordReset,
  verificationReminder,
  adminNewSignup,
  adminLabelsHistory,
  adminSupportRequest,
  adminMonitoringSettings,
  adminMonitoringSettingsError,
  adminTelegramConnected,
  adminCrash,
};
