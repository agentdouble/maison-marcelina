# Maison Marcelina

Base web app for Maison Marcelina with a Python backend and a React frontend.

## Stack

- Backend: FastAPI (Python 3.11+) managed with `uv`
- Frontend: React + Vite
- Orchestration: `start.sh` (single entrypoint)

## Current frontend scope (mock)

The current frontend is a visual mock for product direction, inspired by the
brand brief and Atelier R style cues.

- Hero section with couture visual identity
- "Les collections" section (Heritage, Riviera, Audacieuse)
- "Shop the look" product grid (mock cards)
- "Notre histoire" brand section
- Instagram block and footer links

This stage is static UI only (no cart/auth/checkout wiring yet).

## Project layout

```text
.
├── backend/
│   ├── pyproject.toml
│   ├── src/app/
│   │   ├── api/health.py
│   │   ├── core/config.py
│   │   ├── core/logging.py
│   │   └── main.py
│   ├── tests/test_health.py
│   └── uv.lock
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
├── .env.example
├── .gitignore
├── lesson.md
└── start.sh
```

## Setup

1. Copy env values:

```bash
cp .env.example .env
```

2. Resolve backend dependencies:

```bash
cd backend
uv lock
cd ..
```

3. Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

## Run

Always run the app from the repository root:

```bash
./start.sh
```

- Backend URL: `http://localhost:$BACKEND_PORT`
- Health endpoint: `http://localhost:$BACKEND_PORT/health`
- Frontend URL: `http://localhost:$FRONTEND_PORT`

## Environment variables

Defined in `.env`:

- `APP_ENV`
- `APP_NAME`
- `BACKEND_HOST`
- `BACKEND_PORT`
- `FRONTEND_HOST`
- `FRONTEND_PORT`
- `CORS_ORIGINS`
- `VITE_API_BASE_URL`

If `CORS_ORIGINS` is empty, it is built dynamically from `FRONTEND_HOST` and `FRONTEND_PORT`.

If `VITE_API_BASE_URL` is empty, `start.sh` sets it to `http://127.0.0.1:$BACKEND_PORT`.

## Commands

Backend tests:

```bash
cd backend
uv run pytest
```

Frontend production build:

```bash
cd frontend
npm run build
```
