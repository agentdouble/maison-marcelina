# lessons

## successes

- A single `start.sh` entrypoint keeps backend and frontend startup aligned.
- Dynamic CORS from `.env` prevents hardcoded port regressions.
- Keeping the frontend in Vite with a minimal file set preserves speed and readability.
- Keeping a clean git flow (`main` as stable base, then `dev`, then feature branches) reduces integration risk.
- Rewriting the existing `App.jsx` and `styles.css` for the brand mock kept the codebase lean (no extra component sprawl).
- Defining a reusable visual system (CSS variables + section patterns) speeds up future UI iterations.

## errors to avoid

- Do not commit machine artifacts (`.DS_Store`, virtual env folders, `node_modules`, local `.env`).
- Do not bypass `uv` for backend dependency management or execution.
- Do not hardcode backend/frontend ports in app code.
- Do not ship placeholder UI copy unrelated to brand content.
