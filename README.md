# Black Reel

Каталог фильмов на Nuxt 4 и Nuxt UI, подготовленный для **Cloudflare Workers + D1**.
SSR и API работают в Worker; фильмы, фильтры и полнотекстовый поиск FTS5 — в D1.
Постеры и плееры загружаются по внешним URL из каталога.

## Требования

- Node.js 24 (см. `.nvmrc`), npm 11.
- Аккаунт Cloudflare для публикации. Локальная разработка работает без входа.

```bash
npm ci
```

## Локальная разработка

Один раз импортируйте каталог в пустую локальную D1:

```bash
npm run db:import:local
npm run dev
```

Приложение доступно на `http://localhost:3000`. Nitro подключает локальную D1 через
Wrangler; данные сохраняются в `.wrangler/state/v3`. Локальная база отдельна от production.
Нулевой `database_id` в конфигурации позволяет начать локальную разработку;
для production его нужно заменить настоящим ID.
После изменения `database_id` локальный эмулятор использует отдельную базу —
для неё повторите `npm run db:import:local`.

Чтобы проверить собранный Worker в среде Cloudflare:

```bash
npm run build
npm run preview
```

Wrangler покажет локальный адрес, обычно `http://localhost:8787`.
Dev-сервер, preview и импорт используют одно локальное хранилище Wrangler.

## Первый деплой в Cloudflare

Выполняйте команды из корня проекта.

1. Войдите в нужный аккаунт и создайте базу:

   ```bash
   npx wrangler login
   npm run db:create
   ```

2. Скопируйте `database_id` из результата в `wrangler.jsonc`, заменив
   `00000000-0000-0000-0000-000000000000`. Оставьте имя привязки **`DB`**.
   Если аккаунтов несколько, добавьте нужный `account_id` в тот же файл.

3. Импортируйте каталог в **новую пустую удалённую базу**:

   ```bash
   npm run db:import:remote
   ```

   Команда экспортирует `data/movies.sqlite` в `.data/d1-import.sql`, создаёт таблицы
   и индексы, переносит данные и заполняет FTS5. Она ничего не удаляет из удалённой базы.
   Повторный импорт в заполненную базу завершится ошибкой создания существующих таблиц;
   для нового полного снимка создайте другую пустую D1 и обновите `database_id`.
   При замене базы повторно выполните `npm run deploy` для обновления привязки Worker.

4. Соберите и опубликуйте Worker:

   ```bash
   npm run deploy
   ```

   Wrangler выведет URL `https://black-reel.<ваш-поддомен>.workers.dev`.
   Имя Worker можно изменить в поле `name` файла `wrangler.jsonc`.
   Свой домен подключается в Cloudflare: Workers & Pages → Worker → Settings → Domains & Routes.

Проверка импорта:

```bash
npx wrangler d1 execute black-reel-db --remote --command "SELECT count(*) AS movies FROM movies; SELECT count(*) AS matches FROM movies_fts WHERE movies_fts MATCH 'матрица*';"
```

У исходного каталога 90 772 записи. На сайте проверьте главную страницу, поиск,
фильтры и открытие карточки фильма.

## Последующие деплои и Workers Builds

При изменении кода достаточно `npm run deploy`; импортировать базу заново не нужно.
Конфигурация Worker, статических файлов и привязки D1 хранится в `wrangler.jsonc`.
Изменения привязки делайте в этом файле, чтобы следующий деплой их сохранил.

Для Cloudflare Workers Builds после создания и импорта D1:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Node.js: 24 (переменная сборки `NODE_VERSION=24`)

Для внешнего CI используйте `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID`.
Токену нужны права на деплой Workers, а при импорте — на запись D1.
Не добавляйте секреты в Git.

## Исходная база и экспорт

`data/movies.sqlite` остаётся исходным снимком каталога и не включается в Worker.
Runtime не использует файловую систему или нативный `better-sqlite3`.
Экспорт использует встроенный `node:sqlite` из Node.js 24 и открывает источник только для чтения.

```bash
npm run db:export
# Другой источник и/или файл экспорта:
npm run db:export -- /path/to/movies.sqlite /path/to/import.sql
```

Схема находится в `db/schema.sql`. SQL-экспорт не содержит транзакций, SQLite shadow tables
или служебной статистики. INSERT-запросы ограничены 80 КБ, включая заполнение FTS5,
чтобы укладываться в ограничение размера SQL-запроса D1.
Каталог работает только на чтение; при будущем добавлении записи в API потребуется
синхронизировать `movies_fts` с `movies` через триггеры или код обновления.

## Проверки

```bash
npm run lint
npm run typecheck
npm run build
```

Документация: [Nuxt на Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/nuxt/),
[импорт D1](https://developers.cloudflare.com/d1/best-practices/import-export-data/).
