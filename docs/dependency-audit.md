# Аудит зависимостей

Состояние на момент публикации. Как проверить самому:
`yarn audit --groups dependencies` в корне (фронт) и в `server/` (API).

## API (`server/`)

| Группа | Critical | High | Moderate |
|---|---|---|---|
| dependencies (попадает в образ) | 0 | 0 | 5 |
| devDependencies | 0 | 0 | 0 |

Оставшиеся moderate относятся к транзитивным зависимостям:
- `uuid@8`, `qs@6.14` через `node-telegram-bot-api@0.67` → `@cypress/request`. Эти пакеты используются только для
  исходящих запросов к Telegram Bot API, пользовательский ввод в `qs.stringify` не попадает.
  Ветки 1.x/2.x библиотеки — это новые мажорные версии с другим API, переход вынесен за рамки рефакторинга.

Что сделано: обновлены jsonwebtoken 9, bcryptjs 3, nodemailer 10, pdfkit 0.17, mongoose 8, express 4.22, vitest 4;
`xmldom` заменён на `@xmldom/xmldom`; `canvas2pdf` (со встроенной старой копией pdfkit) удалён; через `resolutions` подняты `proxy-addr` и `crypto-js`.

## Web (корень репозитория)

| Группа | Critical | High | Moderate |
|---|---|---|---|
| dependencies | 3 | 9 | 13 |
| devDependencies | 0 | 0 | 7 |

Все оставшиеся critical/high относятся к самому пакету `next@14.2.35`. Это последний патч 14-й ветки,
а исправления выпущены только в 15.5.x. По договорённости проект остаётся на текущей мажорной версии.
Применимость к этому проекту (Pages Router, standalone-сервер в Linux-контейнере):

| Advisory | Применимо? | Почему |
|---|---|---|
| RCE в Image Optimization API (SVG/AVIF), DoS image optimizer | Нет (смягчено) | `images.unoptimized: true`: оптимизатор `/_next/image` не используется, все изображения статические |
| RCE на серверах с файловой системой Windows | Нет | Сервер запускается в Linux-контейнере |
| DoS / cache poisoning React Server Components, Server Actions | Нет | Нет App Router и Server Actions |
| Middleware/Proxy bypass в Pages Router с i18n | Нет | Нет `middleware.ts` и i18n |
| SSRF в `rewrites()` / `redirects()` | Нет | Rewrites и redirects не настроены |
| **SSRF через WebSocket upgrade во встроенном сервере (CVE-2026-44578)** | **Да** | Standalone-сервер Next использует встроенный Node-сервер. Смягчение до апгрейда: держать фронт за reverse proxy, который не пропускает `Upgrade` на Next (WebSocket приложению не нужен) |

Рекомендация: следующим шагом обновить Next.js до 15.5.x. Pages Router и React 18 там поддерживаются,
основная работа — проверка изменений в `next/link`, `next/router` и конфигурации.

Что сделано: Next 14.2.13 → 14.2.35, TypeScript 5, typescript-eslint 8, sass 1.108, `@svgr/webpack` 8;
`xlsx` удалён вместе с выключенным в интерфейсе Excel-импортом;
через `resolutions` подняты `postcss`, `nanoid`, `source-map-js`, `glob`; освежены транзитивные записи `yarn.lock`.
