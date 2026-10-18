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

## Что умеет

- **Чат по рецептам**: ответ ассистента печатается по мере генерации (SSE через `fetch`), видно, что он делает
  («ищу рецепты…»), под ответом — рецепты-источники. «Стоп» прерывает ответ (и генерацию на бэкенде),
  при ошибке есть «Повторить». Диалог и `chat_id` хранятся в `localStorage`: после перезагрузки
  ассистент помнит разговор; «Новый чат» начинает заново.
- **Импорт по ссылке** (YouTube, TikTok, Instagram): статус обновляется раз в 1,5 с — очередь, чтение,
  распознавание речи, извлечение; по готовности рецепт можно открыть.
- **Мои рецепты**: список, поиск по смыслу, просмотр и удаление.

При первом открытии страница просит ключ — значение `API_KEY` из `.env` бэкенда. Ключ хранится только
в этом браузере: для локального запуска это нормально, перед деплоем нужна настоящая авторизация.

## Типы API

Типы запросов, ответов и событий чата генерируются из OpenAPI бэкенда в `src/api/schema.ts`
(файл в git, руками не правится). После изменений API на запущенном бэкенде:

```bash
npm run gen:api                                   # из http://localhost:8000/openapi.json
OPENAPI_URL=./openapi.json npm run gen:api        # или из файла (artifact `openapi` в CI бэкенда)
```

## Проверки

```bash
npm run lint          # oxlint
npm run format:check  # prettier
npm run typecheck     # tsc
npm test              # vitest
npm run build
```
