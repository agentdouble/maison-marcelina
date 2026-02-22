# lessons

## successes

- A single `start.sh` entrypoint keeps backend and frontend startup aligned.
- Dynamic CORS from `.env` prevents hardcoded port regressions.
- React frontend wired to backend health with request cancellation avoids stale state updates.
- Keeping the frontend in Vite with a minimal file set preserves speed and readability.

## errors to avoid

- Do not commit machine artifacts (`.DS_Store`, virtual env folders, `node_modules`, local `.env`).
- Do not bypass `uv` for backend dependency management or execution.
- Do not hardcode backend/frontend ports in app code.
- Do not trigger frontend API requests without cancellation on unmount.
