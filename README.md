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
- Centered navigation tabs (`Accueil`, `Les collections`, `L'atelier du sur mesure`)
- Header action icons for cart and `Login` (login kept at top-right)
- Liquid visual design (glass surfaces, fluid highlights, soft moving blobs)
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
- Collections page rebuilt as a mobile-first luxe marketplace:
  - hero allégé avec icône filtre (sans bouton texte)
  - filtres repliables en mode frameless (`Recherche`, `Prix`, `Tri`)
  - horizontal scroll collection chips (`Toutes`, `Marceline Heritage`, `Marceline Riviera`, `Marceline Audacieuse`)
  - local front-only filtering/sorting over mock catalog data
  - product grid cards reduced to image + name + price
- Boutique page with product cards
- Sur-mesure contact form page
- Command support contact page
- Login page
- Themed `Footer7` with three footer columns: `Navigation`, `Assistance`, `Informations legales`

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
│       │       └── lumina-interactive-list.tsx
│       ├── lib/
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
- `/collection` collections marketplace
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
