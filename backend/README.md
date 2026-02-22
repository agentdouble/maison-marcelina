# backend

FastAPI backend for app-template.

## Auth endpoints

- `POST /auth/login`
- `POST /auth/signup`
- `GET /auth/google/start`
- `GET /auth/google/callback`

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env` before using auth.

## Account endpoints

All account endpoints require a valid `Authorization: Bearer <access_token>` header.
Invalid or expired account sessions are returned as `401`.

- `GET /account/profile`
- `PUT /account/profile`
- `GET /account/orders`
