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
- `GET /catalog/admin/access`
- `GET /catalog/admin/orders` (`pending_only=true|false`, défaut `true`)
- `PUT /catalog/admin/orders/{order_id}`
- `POST /catalog/admin/collections`
- `PUT /catalog/admin/collections/{collection_id}`
- `POST /catalog/admin/products`
- `PUT /catalog/admin/products/{product_id}`
- `PUT /catalog/admin/featured`
- `POST /catalog/admin/upload-image`

### Checkout

- `POST /checkout/session`
- `POST /checkout/session/{session_id}/sync`
- `POST /checkout/webhook/stripe`

## Required env vars

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
