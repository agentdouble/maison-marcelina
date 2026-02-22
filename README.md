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
- Dedicated `Notre Histoire` page aligned with brand narrative from `ressources/maison-marcelina.md`, full-bleed and without redundant page title text, with a straight full-height left visual panel that stops at the text column boundary, plus compact typographic rhythm
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
- Boutique page (`/collection`) rebuilt as a mobile-first luxe marketplace:
  - en-tête frameless
  - bandeau latéral de filtres (`Collections` uniquement)
  - filtres collection (`Toutes`, `Marceline Heritage`, `Marceline Riviera`, `Marceline Audacieuse`)
  - filtrage front-only local sur collection
  - grille produits responsive qui occupe toute la largeur disponible
  - taille de cartes stable entre vue `Toutes` et vue filtrée
  - en mode téléphone, grille inspirée catalogue (2 colonnes, visuels plats, meta compacte)
  - en mode téléphone, coeur superposé sur le visuel produit (sans pastille couleur)
  - en mode webapp, mur catalogue pleine largeur (5 colonnes) avec bande filtre discrète en tête
  - en mode webapp, cartes produits plates (sans effet carte) et overlays visuels discrets
  - noms des vêtements gardent la typographie éditoriale du site
  - en boutique, le bouton `Ajouter` n’est pas affiché sur les cartes
  - nom et prix sont alignés sur une seule ligne dans chaque carte
  - cartes boutique affichées immédiatement (sans reveal différé par ligne)
  - la boutique conserve le background global du site (pas de fond blanc local)
  - clic sur une carte ouvre la fiche produit dédiée
  - carrousel swipe latéral sur chaque visuel produit (si plusieurs photos)
  - fiche produit (`/collection/:productId`) avec selection de taille obligatoire
  - blocs repliables sur fiche produit: `Description`, `Guide des tailles`, `Composition et entretien`, `Livraison, echanges et retours`
  - ajout panier par variante de taille (deux tailles d'un meme produit restent separees)
  - carrousel `Best-sellers` sans bord arrondi sur les visuels
- Panneau panier global:
  - ouverture/fermeture depuis l’icône panier du header
  - gestion des quantités, suppression et total
- Sur-mesure concept + request flow (authenticated users can submit a request, otherwise login gate)
- Command support contact page
- Login page based on `Login1` (shadcn-style) connected to backend auth
- Professional buyer account area on `/compte` with tabs: `Vue d'ensemble`, `Commandes`, `Coordonnees`, `Securite`
- Account order history is read-only from backend data (no manual order creation from profile)
- Themed `Footer7` with three footer columns: `Navigation`, `Assistance`, `Informations legales`

## Project layout

```text
.
├── backend/
│   ├── pyproject.toml
│   ├── src/app/
│   │   ├── api/account.py
│   │   ├── api/auth.py
│   │   ├── api/health.py
│   │   ├── core/config.py
│   │   ├── core/logging.py
│   │   ├── services/supabase_account.py
│   │   ├── services/supabase_auth.py
│   │   └── main.py
│   ├── tests/test_account.py
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
- `/histoire` legacy alias redirecting to `/notre-histoire`
- `/collection` boutique marketplace
- `/collection/:productId` fiche produit
- `/sur-mesure` custom concept page with request form for authenticated users (asks login when session is missing)
- `/contact` order issue form
- `/boutique` redirection vers `/collection`
- `/panier` cart page
- `/login` login form
- `/compte` buyer account area (overview, orders, profile data, security; requires authenticated session)
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
- Auth errors from Supabase are returned with their upstream HTTP status and message (for example `400`, `401`, `422`); transient/retryable errors are normalized to `503`.
- `GET /auth/google/start`
  - starts Google OAuth (PKCE)
  - default behavior: HTTP redirect to Google
  - optional: `?redirect=false` to receive JSON `{"authorization_url":"..."}`
- `GET /auth/google/callback`
  - exchanges Google auth code for a Supabase session
  - expects `code` and `state` query params

Google login requires enabling the Google provider in Supabase Auth and adding the callback URL in your Supabase redirect URLs allow list.

## Backend Account API

All `/account/*` endpoints require `Authorization: Bearer <access_token>`.
- invalid/expired bearer sessions are normalized to `401`

- `GET /account/profile`
  - returns profile fields (`full_name`, `phone`, `address`) plus account email
- `PUT /account/profile`
  - body: `{"full_name":"...", "phone":"...", "address":"..."}`
  - upserts user profile
- `GET /account/orders`
  - returns user orders list

Supabase tables used:

- `public.customer_profiles` (1 row per user)
- `public.customer_orders` (N rows per user)

## Login flow in frontend

- `/login` uses `src/components/ui/login-1.tsx`
- Email/password submit calls `POST {VITE_API_BASE_URL}/auth/login`
- Account creation submit calls `POST {VITE_API_BASE_URL}/auth/signup`
- Google button redirects browser to `{VITE_API_BASE_URL}/auth/google/start`
- On password login success, response payload is stored in `localStorage` as `mm_auth_session`, then user is redirected to `/`
- Profile icon routes to `/compte` when authenticated, otherwise `/login`
- `/compte` is split in tabs: `Vue d'ensemble`, `Commandes`, `Coordonnees`, `Securite`
- `Coordonnees` can create/update profile data via backend `/account/profile`
- `Commandes` lists account orders from backend `/account/orders` (read-only for buyers)
- if account requests return `401/403`, frontend clears stale `mm_auth_session` and redirects to `/login`

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
