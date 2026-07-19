# TodoApp

A gamified to-do app. Tasks are organized by estimated length (Quick/Small/Medium/Long-Term) rather than by date, each with its own visual theme. Completing tasks builds a daily streak per task, and task detail popovers surface a random fact plus a "make it easier" tip to reduce friction on hard tasks.

## Stack

- `frontend/` — Angular 17 (standalone components, signals, `@if`/`@for` control-flow syntax)
- `backend/` — Node/Express + Mongoose (MongoDB), plain JS
- `docker-compose.yml` — runs Mongo, backend, and frontend together

## Getting started

### Full stack (Docker)

```
docker compose up -d --build
```

Stop with `docker compose down`. Ports come from `BACKEND_PORT` (default `4000`) and `FRONTEND_PORT` (default `4200`) — see `.env.example`.

### Backend only

```
cd backend
npm install
npm start        # or `npm run dev` for auto-restart
npm test
```

Requires a `MONGO_URI` env var (defaults to `mongodb://localhost:27017/tasksdb`).

### Frontend only

```
cd frontend
npm install
npm start         # dev server at http://localhost:4200
npm test
npm run build
```
