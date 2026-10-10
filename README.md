# Black Reel

Каталог фильмов на Nuxt 4 и Nuxt UI. Данные берутся из локальной SQLite-базы `data/movies.sqlite` (только чтение).

## Требования

- Node.js 24 (см. `.nvmrc`)
- npm 11

## Установка

```bash
npm ci
```

## Разработка

Dev-сервер на `http://localhost:3000`:

```bash
npm run dev
```

## Проверки

```bash
npm run lint
npm run typecheck
```

## Сборка

```bash
npm run build
npm run preview
```

Сервер открывает базу по пути `data/movies.sqlite` относительно текущей рабочей директории процесса, поэтому запускать его нужно из корня проекта.
