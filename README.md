# GPlusApp

A full-stack web application (FastAPI backend + React frontend). This repository contains backend services, frontend code, tests, and dev tooling.

## Testing (backend)

Summary:

- The backend supports a test-friendly mode controlled by the `ENVIRONMENT` environment variable.
- When `ENVIRONMENT == "test"`, the backend uses an SQLite test database (`sqlite:///./test.db`) and uses an in-memory Redis fallback to keep tests hermetic.

Redis & test hermeticity:

- `app/core/redis_client.get_redis_client()` returns a real Redis client when available, and falls back to `InMemoryRedis()` when Redis is unreachable or when `ENVIRONMENT == 'test'`.
- Middlewares (e.g., `RateLimiter`) lazily call `get_redis_client()` so tests won't make import-time network connections.
- If Redis is unavailable, RateLimiter will fail-open (allow requests) to avoid blocking tests. Integration tests can opt into real Redis by setting REDIS env vars.

Run backend tests (Windows / PowerShell):

```powershell
& "path\to\venv\Scripts\Activate.ps1"
Set-Location -Path 'c:\Users\Moamen Ahmed\OneDrive\Desktop\GplusApp\backend'
$env:ENVIRONMENT = 'test'
pytest -q
```

Manual tests:

- Some manual/integration tests are skipped by default. To run them, set `RUN_MANUAL_TESTS=1` in your environment.

If you'd like, I can expand this README with setup steps, contribution guidelines, and CI notes.

## Running frontend tests (Vitest)

The frontend lives in the `frontend/` folder and provides a dedicated Vitest config at `frontend/vitest.config.js`.

- Recommended (from repo root):

```pwsh
npx vitest --config frontend/vitest.config.js
# or use the package.json script:
npm run test:frontend:root
```

- Recommended (from inside the frontend folder):

```pwsh
cd frontend
npx vitest --config vitest.config.js
# or use the existing script:
npm run test:frontend
```

Why: running Vitest from the repository root without `--config` can cause Vitest to not pick the intended frontend config and may trigger warnings about deprecated "workspace" settings or multiple projects. Passing `--config` makes the target config explicit and avoids that warning.
