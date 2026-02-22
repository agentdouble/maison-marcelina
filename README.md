# Maison Marcelina

Base web app for Maison Marcelina with a Python backend and a React frontend.

## Stack

- Backend: FastAPI (Python 3.11+) managed with `uv`
- Frontend: React + Vite + React Router + Tailwind CSS utilities
- UI primitives: shadcn-style structure in `src/components/ui`
- TypeScript support enabled for UI components (`.tsx`, alias `@/*`)
- Orchestration: `start.sh` (single entrypoint)

## Current frontend scope (mock)

The frontend is a multi-page brand mock focused on couture and boutique flows.

- Compact sticky top band with large logo, profile icon, and mobile hamburger nav
- Centered navigation tabs (`Accueil`, `Notre Histoire`, `Les collections`, `Sur mesure`)
- Header actions keep cart visible; `Login` moves into the hamburger on mobile and stays as profile icon on desktop
- Mobile header controls (logo, hamburger, cart) are intentionally scaled up for readability
- Mobile hamburger closes on outside click and `Escape` for cleaner interaction
- Liquid visual design (glass surfaces, fluid highlights, soft moving blobs)
- Dedicated `Notre Histoire` page aligned with brand narrative from `ressources/maison-marcelina.md`, with image-left/text-right split layout on larger screens
- Full-viewport home shader slider (`lumina-interactive-list`) fed by the 3 collections
- In-hero collection buttons remain frameless and visible (`Marceline Heritage`, `Marceline Riviera`, `Marceline Audacieuse`)
- Home continuation after slider with:
  - `Piece signature` spotlight block (content aligned opposite image)
  - animated `Best-sellers` carousel (`Gallery4` + Embla)
  - trust band (`Livraison`, `Retours`, `Paiement`, `Support`)
- Post-hero home blocks are intentionally frameless (no card container wrappers)
- `Piece signature` image uses a liquid morph style (organic shape + soft highlights)
- `Piece signature` CTA `Decouvrir` is frameless (no round/pill background)
- Scroll reveal animations and full-page web-app layout
- Marketplace collections page
- Boutique page with product cards
- Sur-mesure request form page (project type, name/email, free message)
- Command support contact page
- Login page based on `Login1` (shadcn-style) connected to backend auth
- Themed `Footer7` with three footer columns: `Navigation`, `Assistance`, `Informations legales`

## Project layout

```text
.
├── backend/
│   ├── pyproject.toml
│   ├── src/app/
│   │   ├── api/auth.py
│   │   ├── api/health.py
│   │   ├── core/config.py
│   │   ├── core/logging.py
│   │   ├── services/supabase_auth.py
│   │   └── main.py
│   ├── tests/test_auth.py
│   ├── tests/test_health.py
│   └── uv.lock
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── components.json
│   ├── index.html
│   ├── public/
│   │   └── logo-marcelina.svg
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   └── ui/
│       │       ├── button.tsx
│       │       ├── carousel.tsx
│       │       ├── card.tsx
│       │       ├── footer-7.tsx
│       │       ├── gallery4.tsx
│       │       ├── input.tsx
│       │       ├── login-1.tsx
│       │       └── lumina-interactive-list.tsx
│       ├── lib/
│       │   ├── auth.ts
│       │   └── utils.ts
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

## Frontend routes

- `/` home
- `/notre-histoire` brand story page
- `/collection` collections marketplace
- `/histoire` legacy alias redirecting to `/notre-histoire`
- `/sur-mesure` custom request form
- `/contact` order issue form
- `/boutique` boutique listing
- `/panier` cart page
- `/login` login form
- `/mentions-legales` legal notice page
- `/cgv` conditions page
- `/politique-remboursement` refund policy page
- `/politique-cookies` cookies policy page
- `/accessibilite` accessibility page

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
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_GOOGLE_REDIRECT_URL`
- `AUTH_COOKIE_SECURE`

If `CORS_ORIGINS` is empty, it is built dynamically from `FRONTEND_HOST` and `FRONTEND_PORT`.

If `VITE_API_BASE_URL` is empty, `start.sh` sets it to `http://127.0.0.1:$BACKEND_PORT`.

If `SUPABASE_GOOGLE_REDIRECT_URL` is empty, backend defaults to:
`http://localhost:$BACKEND_PORT/auth/google/callback`.

## Backend Auth API

- `POST /auth/login`
  - body: `{"email":"...", "password":"..."}`
  - response: Supabase session payload (`access_token`, `refresh_token`, `user`, ...)
- `POST /auth/signup`
  - body: `{"email":"...", "password":"..."}`
  - response: Supabase auth payload (`user`, optional session tokens depending on email confirmation policy)
- `GET /auth/google/start`
  - starts Google OAuth (PKCE)
  - default behavior: HTTP redirect to Google
  - optional: `?redirect=false` to receive JSON `{"authorization_url":"..."}`
- `GET /auth/google/callback`
  - exchanges Google auth code for a Supabase session
  - expects `code` and `state` query params

Google login requires enabling the Google provider in Supabase Auth and adding the callback URL in your Supabase redirect URLs allow list.

## Login flow in frontend

- `/login` uses `src/components/ui/login-1.tsx`
- Email/password submit calls `POST {VITE_API_BASE_URL}/auth/login`
- Account creation submit calls `POST {VITE_API_BASE_URL}/auth/signup`
- Google button redirects browser to `{VITE_API_BASE_URL}/auth/google/start`
- On password login success, response payload is stored in `localStorage` as `mm_auth_session`, then user is redirected to `/`

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
