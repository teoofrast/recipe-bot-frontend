# recipe-bot-frontend

Веб-чат для чат-бота по рецептам: потоковые ответы агента через SSE, импорт рецептов по ссылке, список и поиск рецептов.

**Стек:** React, Vite, TypeScript, oxlint, prettier, vitest.

Бэкенд: [recipe-bot-backend](https://github.com/teoofrast/recipe-bot-backend)

## Запуск

Вместе с бэкендом — через `docker compose up` в репозитории [recipe-bot-backend](https://github.com/teoofrast/recipe-bot-backend), веб-чат будет на http://localhost:3000.

Dev-сервер с hot reload (бэкенд должен быть запущен на `localhost:8000`):

```bash
cp .env.example .env
npm install
npm run dev
```

Запросы на `/api/*` проксируются на бэкенд без префикса `/api` — и в dev-сервере Vite, и в nginx в Docker.

## Проверки

```bash
npm run lint          # oxlint
npm run format:check  # prettier
npm run typecheck     # tsc
npm test              # vitest
npm run build
```
