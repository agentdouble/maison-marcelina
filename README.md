# Maison Marcelina

Application web Maison Marcelina avec backend FastAPI (`uv`) et frontend React/Vite.

## Stack

- Backend: FastAPI (Python 3.11+), `uv`, `httpx`
- Frontend: React + Vite + React Router
- Auth: Supabase Auth (email/password + Google OAuth)
- Data catalogue: Supabase Postgres + Supabase Storage
- Démarrage local: `./start.sh` (backend + frontend)

## Fonctionnel actuel

- Home, histoire, collection, fiche produit, panier, contact, sur-mesure
- Authentification + compte client (`/compte`)
- Header avec navigation principale, icônes profil/panier, menu mobile (fermeture outside click + `Escape`)
- Catalogue prioritairement Supabase avec fallback mock automatique:
  - collections homepage depuis DB, fallback mock si aucune image active
  - hero home compatible avec 1 seule collection active (pas besoin de 2 images pour afficher le visuel)
  - pièce signature / best-sellers depuis DB, fallback automatique si non définis
  - produits boutique depuis DB, fallback mock si aucun produit actif
- Boutique `/collection` orientée marketplace avec filtres par collection, grille responsive et ouverture fiche produit par carte
- Fiche produit `/collection/:productId` avec retour boutique en haut, taille obligatoire, et ajout panier par variante de taille
- Sur-mesure avec login gate: formulaire disponible pour compte connecté, redirection vers `/login` sinon
- Admin (`/admin`, alias `/dashboard`):
  - onglet `Ajouter une collection`:
    - ajout collection home (titre, description, image, ordre, visibilité)
    - upload image direct vers bucket Supabase
  - onglet `Modifier une collection`:
    - édition collections home (titre, description, image, ordre, visibilité)
    - définition pièce signature + best-sellers (sélection parmi produits actifs)
    - upload image direct vers bucket Supabase
  - onglet `Ajouter un produit`:
    - ajout produit
    - stock par taille via éditeur (lignes `Taille` + `Quantite`, total auto)
    - stock total manuel conservé quand le stock par taille est vide
    - bouton `Ajouter un fichier` modernisé pour l'upload image
  - onglet `Modifier un produit`:
    - modification produit (prix, description, tailles, stock, composition/entretien, images, visibilité)
    - stock par taille via éditeur (lignes `Taille` + `Quantite`, total auto)
    - stock total manuel conservé quand le stock par taille est vide
    - bouton `Ajouter un fichier` modernisé pour l'upload image
  - les slugs produits/collections sont gérés automatiquement côté backend
- Footer thématique `Footer7` avec colonnes `Navigation`, `Assistance`, `Informations légales`

## Project layout

```text
.
├── backend/
│   ├── pyproject.toml
│   ├── src/app/
│   │   ├── api/account.py
│   │   ├── api/auth.py
│   │   ├── api/catalog.py
│   │   ├── api/health.py
│   │   ├── core/config.py
│   │   ├── core/logging.py
│   │   ├── services/supabase_account.py
│   │   ├── services/supabase_auth.py
│   │   ├── services/supabase_catalog.py
│   │   └── main.py
│   ├── tests/test_account.py
│   ├── tests/test_auth.py
│   ├── tests/test_catalog.py
│   ├── tests/test_health.py
│   └── uv.lock
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── lib/auth.ts
│   │   ├── lib/catalog.ts
│   │   └── styles.css
├── .env.example
├── lesson.md
└── start.sh
```

## Setup

1. Copier l'env:

```bash
cp .env.example .env
```

2. Installer backend:

```bash
cd backend
uv lock
cd ..
```

3. Installer frontend:

```bash
cd frontend
npm install
cd ..
```

## Run

Toujours lancer depuis la racine:

```bash
./start.sh
```

- Backend: `http://localhost:$BACKEND_PORT`
- Health: `http://localhost:$BACKEND_PORT/health`
- Frontend: `http://localhost:$FRONTEND_PORT`

## Frontend routes

- `/` home
- `/notre-histoire` page histoire
- `/histoire` alias vers `/notre-histoire`
- `/collection` boutique marketplace
- `/collection/:productId` fiche produit
- `/collections` alias vers `/collection`
- `/marketplace` alias vers `/collection`
- `/sur-mesure` formulaire sur-mesure (auth requise)
- `/contact` page contact
- `/boutique` redirection vers `/collection`
- `/panier` page panier
- `/login` page login
- `/compte` espace compte (Vue d'ensemble, Commandes, Coordonnées, Sécurité)
- `/admin` (alias `/dashboard`)
- `/mentions-legales`
- `/cgv`
- `/politique-remboursement`
- `/politique-cookies`
- `/accessibilite`

## Environment variables

Définies dans `.env`:

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
- `SUPABASE_STORAGE_BUCKET`
- `SUPABASE_GOOGLE_REDIRECT_URL`
- `AUTH_COOKIE_SECURE`

Notes:

- si `CORS_ORIGINS` est vide, `start.sh` le construit depuis `FRONTEND_HOST/PORT`
- si `VITE_API_BASE_URL` est vide, `start.sh` force `http://127.0.0.1:$BACKEND_PORT`
- si `SUPABASE_GOOGLE_REDIRECT_URL` est vide: `http://localhost:$BACKEND_PORT/auth/google/callback`
- `SUPABASE_STORAGE_BUCKET` doit être un bucket **public** pour les images storefront

## Backend API

### Auth

- `POST /auth/login`
- `POST /auth/signup`
- `GET /auth/google/start`
- `GET /auth/google/callback`

### Account

Tous les endpoints `/account/*` requièrent `Authorization: Bearer <access_token>`.

- `GET /account/profile`
- `PUT /account/profile`
- `GET /account/orders`

### Catalog

Public:

- `GET /catalog/public`
  - retourne `collections`, `products`, `featured`

Admin (requiert `Authorization: Bearer <access_token>` + user admin):

- `GET /catalog/admin`
- `POST /catalog/admin/collections`
- `PUT /catalog/admin/collections/{collection_id}`
- `POST /catalog/admin/products`
- `PUT /catalog/admin/products/{product_id}`
- `PUT /catalog/admin/featured`
- `POST /catalog/admin/upload-image` (multipart: `scope`, `file`)

### Frontend auth behavior

- `/login` utilise `src/components/ui/login-1.tsx`
- email/password appelle `POST {VITE_API_BASE_URL}/auth/login`
- création de compte appelle `POST {VITE_API_BASE_URL}/auth/signup`
- Google OAuth redirige vers `{VITE_API_BASE_URL}/auth/google/start`
- la session login est stockée dans `localStorage` (`mm_auth_session`)
- l’icône profil pointe vers `/compte` si authentifié, sinon `/login`
- en cas de `401/403` sur `/account/*`, la session locale est purgee et l’app redirige vers `/login`

## Supabase setup (catalog + admin)

### 1) Tables

Exécuter dans SQL editor Supabase:

```sql
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.home_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  image_url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  collection_id uuid not null references public.home_collections(id) on delete restrict,
  price numeric(10,2) not null check (price >= 0),
  description text not null default '',
  size_guide text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  composition_care text[] not null default '{}',
  images text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_featured (
  id integer primary key check (id = 1),
  signature_product_id uuid references public.catalog_products(id) on delete set null,
  best_seller_product_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.home_featured (id)
values (1)
on conflict (id) do nothing;
```

### 2) RLS policies

```sql
alter table public.admin_users enable row level security;
alter table public.home_collections enable row level security;
alter table public.catalog_products enable row level security;
alter table public.home_featured enable row level security;

drop policy if exists admin_users_select_self on public.admin_users;
create policy admin_users_select_self
on public.admin_users
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists home_collections_public_read on public.home_collections;
create policy home_collections_public_read
on public.home_collections
for select
using (is_active = true);

drop policy if exists catalog_products_public_read on public.catalog_products;
create policy catalog_products_public_read
on public.catalog_products
for select
using (is_active = true);

drop policy if exists home_featured_public_read on public.home_featured;
create policy home_featured_public_read
on public.home_featured
for select
using (true);

drop policy if exists home_collections_admin_all on public.home_collections;
create policy home_collections_admin_all
on public.home_collections
for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists catalog_products_admin_all on public.catalog_products;
create policy catalog_products_admin_all
on public.catalog_products
for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists home_featured_admin_all on public.home_featured;
create policy home_featured_admin_all
on public.home_featured
for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
```

### 3) Bucket Storage

Créer (ou mettre à jour) le bucket `SUPABASE_STORAGE_BUCKET` en **public**:

```sql
insert into storage.buckets (id, name, public)
values ('maison-marcelina', 'maison-marcelina', true)
on conflict (id) do update set public = true;
```

Policies `storage.objects`:

```sql
drop policy if exists catalog_bucket_public_read on storage.objects;
create policy catalog_bucket_public_read
on storage.objects
for select
using (bucket_id = 'maison-marcelina');

drop policy if exists catalog_bucket_admin_insert on storage.objects;
create policy catalog_bucket_admin_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'maison-marcelina'
  and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);

drop policy if exists catalog_bucket_admin_update on storage.objects;
create policy catalog_bucket_admin_update
on storage.objects
for update to authenticated
using (
  bucket_id = 'maison-marcelina'
  and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
)
with check (
  bucket_id = 'maison-marcelina'
  and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);
```

Remplacer `'maison-marcelina'` par la valeur réelle de `SUPABASE_STORAGE_BUCKET` si nécessaire.

Ajouter ensuite chaque admin dans `public.admin_users`.

## Commandes utiles

Backend tests:

```bash
cd backend
uv run pytest
```

Frontend build:

```bash
cd frontend
npm run build
```
