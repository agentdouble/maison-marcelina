# backend

FastAPI backend for Maison Marcelina.

## Endpoints

### Auth

- `POST /auth/login`
- `POST /auth/signup`
- `GET /auth/google/start`
- `GET /auth/google/callback`

### Account

All account endpoints require `Authorization: Bearer <access_token>`.

- `GET /account/profile`
- `PUT /account/profile`
- `GET /account/orders`

### Catalog

Public:

- `GET /catalog/public`

Admin (`Authorization: Bearer <access_token>` + admin user):

- `GET /catalog/admin`
- `POST /catalog/admin/collections`
- `PUT /catalog/admin/collections/{collection_id}`
- `POST /catalog/admin/products`
- `PUT /catalog/admin/products/{product_id}`
- `PUT /catalog/admin/featured`
- `POST /catalog/admin/upload-image`

## Required env vars

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_STORAGE_BUCKET`
