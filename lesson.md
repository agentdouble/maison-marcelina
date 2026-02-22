# lessons

## successes

- A single `start.sh` entrypoint keeps backend and frontend startup aligned.
- Dynamic CORS from `.env` prevents hardcoded port regressions.
- React frontend wired to backend health with request cancellation avoids stale state updates.
- Keeping the frontend in Vite with a minimal file set preserves speed and readability.
- Keeping a clean git flow (`main` as stable base, then `dev`, then feature branches) reduces integration risk.
- Supabase Auth backend implementation is cleaner when wrapped in a dedicated service module instead of mixing SDK calls directly in routes.
- Google OAuth PKCE is stable when `state` and `code_verifier` are validated in backend callback flow.

## errors to avoid

- Do not commit machine artifacts (`.DS_Store`, virtual env folders, `node_modules`, local `.env`).
- Do not bypass `uv` for backend dependency management or execution.
- Do not hardcode backend/frontend ports in app code.
- Do not trigger frontend API requests without cancellation on unmount.
- Do not rely on a shared in-memory OAuth verifier across requests; it creates race conditions during concurrent login attempts.
