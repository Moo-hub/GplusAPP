# Test Isolation and Stability

To keep FE/BE tests stable and reproducible:

- Environment: ensure `ENVIRONMENT=test` is set before importing the app. Our `app/tests/conftest.py` enforces this.
- Redis keys: during tests, security blacklist keys are prefixed with `test:` to avoid clashing with dev data. The session fixture purges `test:*` keys from Redis DBs 0 and 1 before and after the session.
- In-process state: the same session fixture resets the in-process rate limiter state used by `/auth/login` and clears the WebSocket `manager` connections to avoid cross-test leakage.
- Auth dependency patching: endpoints (e.g. `pickup.py`, `points.py`) use a small proxy for `get_current_user` so tests can patch `app.api.dependencies.auth.get_current_user` and have it apply at request time.
- CSRF behavior: CSRF middleware defers to `app.core.security.validate_csrf_token`, which tests may patch when they focus on cache headers or response shapes.
- Load/perf scripts: any load-testing or external scripts (e.g. `app/tests/test_rate_limiting.py`) are ignored from unit runs via `pytest.ini`.

These conventions reduce flakiness across repeated runs and prevent state carry-over between test cases.

## Backend Testing Guide

This document explains how the backend tests run, how the live test server is orchestrated, and what to expect in different environments.

## Overview

- Test suite uses pytest and automatically starts a live Uvicorn server for integration tests.
- Tests isolate their database to avoid schema drift and cross-run side effects.
- Redis-backed features (rate limiting, token blacklisting) are optional and gracefully degrade when Redis is unavailable.

## Quick start (Windows PowerShell)

```powershell
# From repository root
cd C:\GplusApp_backup\backend
$env:PYTHONPATH='app'
$env:ENVIRONMENT='development'
C:/GplusApp_backup/backend/.venv/Scripts/python.exe -m pytest -q tests
```

Expected output:

```text
======================== all tests passed in ~31s ========================
```

Notes:

- Some tests may be skipped when Redis isn’t available (rate limiting, token blacklisting).
- There should be zero warnings; test assertions are used throughout.

## How the live server works

- A session-scoped fixture launches Uvicorn before tests and waits for `/health` to be ready.
- The server process is started with environment variables that make tests deterministic:
  - `ENVIRONMENT=development`
  - Email verification disabled
  - Database path overridden to a dedicated test SQLite file

Logs are written to `logs/uvicorn_test.log` for debugging.

## Database isolation

- Tests run against a dedicated SQLite file (e.g., `test_app.db`) to prevent schema drift.
- The test DB file is removed before each run to ensure a clean state.
- Production/dev databases are not touched during test execution.

## Redis-dependent behavior

- Middleware and security monitoring are resilient if Redis is down/unavailable.
- When Redis is not running:
  - Rate limiting tests are skipped.
  - Token blacklisting checks are skipped.
- When Redis is available:
  - Excessive login attempts should return HTTP 429.
  - Refresh token use after logout should return HTTP 401.

## CSRF protection

- CSRF is enforced on unsafe methods (POST/PUT/DELETE) for protected endpoints.
- Missing or invalid CSRF tokens yield HTTP 403 (Forbidden) with a clear JSON error payload.
- Authentication endpoints `/api/v1/auth/login` and `/api/v1/auth/register` are exempt from CSRF checks.

## Running the dev server (optional)

```powershell
# From repository root
$env:ENVIRONMENT='development'
C:/GplusApp_backup/backend/.venv/Scripts/python.exe -m uvicorn --app-dir C:/GplusApp_backup/backend app.main:app --host 127.0.0.1 --port 8000 --log-level warning
```

If you see import errors, set PYTHONPATH:

```powershell
$env:PYTHONPATH='C:\\GplusApp_backup\\backend;C:\\GplusApp_backup\\backend\\app'
```

## Troubleshooting

- Uvicorn fails to start:
  - Ensure `--app-dir` points to `C:/GplusApp_backup/backend`.
  - Verify `app.main:app` is the correct import path.
  - Set `PYTHONPATH` as shown above.
- Unexpected 500 responses on CSRF-protected POSTs:
  - Middleware should return 403 for missing/invalid CSRF. Check `app/middlewares/security.py` and server logs.
- Schema errors (e.g., missing columns):
  - Confirm tests are using the isolated test DB file and not `app.db`.

## CI hints

- Keep Redis optional in CI; tests will skip Redis-dependent checks automatically.
- Capture `logs/uvicorn_test.log` as an artifact to aid debugging intermittent failures.
## Test Isolation and Stability

To keep FE/BE tests stable and reproducible:

- Environment: ensure `ENVIRONMENT=test` is set before importing the app. Our `app/tests/conftest.py` enforces this.
- Redis keys: during tests, security blacklist keys are prefixed with `test:` to avoid clashing with dev data. The session fixture purges `test:*` keys from Redis DBs 0 and 1 before and after the session.
- In-process state: the same session fixture resets the in-process rate limiter state used by `/auth/login` and clears the WebSocket `manager` connections to avoid cross-test leakage.
- Auth dependency patching: endpoints (e.g. `pickup.py`, `points.py`) use a small proxy for `get_current_user` so tests can patch `app.api.dependencies.auth.get_current_user` and have it apply at request time.
- CSRF behavior: CSRF middleware defers to `app.core.security.validate_csrf_token`, which tests may patch when they focus on cache headers or response shapes.
- Load/perf scripts: any load-testing or external scripts (e.g. `app/tests/test_rate_limiting.py`) are ignored from unit runs via `pytest.ini`.

These conventions reduce flakiness across repeated runs and prevent state carry-over between test cases.
# Backend Testing Guide

This document explains how the backend tests run, how the live test server is orchestrated, and what to expect in different environments.

## Overview

- Test suite uses pytest and automatically starts a live Uvicorn server for integration tests.
- Tests isolate their database to avoid schema drift and cross-run side effects.
- Redis-backed features (rate limiting, token blacklisting) are optional and gracefully degrade when Redis is unavailable.

## Quick start (Windows PowerShell)

```powershell
# From repository root
cd C:\GplusApp_backup\backend
$env:PYTHONPATH='app'
$env:ENVIRONMENT='development'
C:/GplusApp_backup/backend/.venv/Scripts/python.exe -m pytest -q tests
```

Expected output:

```
======================== all tests passed in ~31s ========================
```

Notes:
- Some tests may be skipped when Redis isn’t available (rate limiting, token blacklisting).
- There should be zero warnings; test assertions are used throughout.

## How the live server works

- A session-scoped fixture launches Uvicorn before tests and waits for `/health` to be ready.
- The server process is started with environment variables that make tests deterministic:
  - `ENVIRONMENT=development`
  - Email verification disabled
  - Database path overridden to a dedicated test SQLite file

Logs are written to `logs/uvicorn_test.log` for debugging.

## Database isolation

- Tests run against a dedicated SQLite file (e.g., `test_app.db`) to prevent schema drift.
- The test DB file is removed before each run to ensure a clean state.
- Production/dev databases are not touched during test execution.

## Redis-dependent behavior

- Middleware and security monitoring are resilient if Redis is down/unavailable.
- When Redis is not running:
  - Rate limiting tests are skipped.
  - Token blacklisting checks are skipped.
- When Redis is available:
  - Excessive login attempts should return HTTP 429.
  - Refresh token use after logout should return HTTP 401.

## CSRF protection

- CSRF is enforced on unsafe methods (POST/PUT/DELETE) for protected endpoints.
- Missing or invalid CSRF tokens yield HTTP 403 (Forbidden) with a clear JSON error payload.
- Authentication endpoints `/api/v1/auth/login` and `/api/v1/auth/register` are exempt from CSRF checks.

## Running the dev server (optional)

```powershell
# From repository root
$env:ENVIRONMENT='development'
C:/GplusApp_backup/backend/.venv/Scripts/python.exe -m uvicorn --app-dir C:/GplusApp_backup/backend app.main:app --host 127.0.0.1 --port 8000 --log-level warning
```

If you see import errors, set PYTHONPATH:

```powershell
$env:PYTHONPATH='C:\\GplusApp_backup\\backend;C:\\GplusApp_backup\\backend\\app'
```

## Troubleshooting

- Uvicorn fails to start:
  - Ensure `--app-dir` points to `C:/GplusApp_backup/backend`.
  - Verify `app.main:app` is the correct import path.
  - Set `PYTHONPATH` as shown above.
- Unexpected 500 responses on CSRF-protected POSTs:
  - Middleware should return 403 for missing/invalid CSRF. Check `app/middlewares/security.py` and server logs.
- Schema errors (e.g., missing columns):
  - Confirm tests are using the isolated test DB file and not `app.db`.

## CI hints

- Keep Redis optional in CI; tests will skip Redis-dependent checks automatically.
- Capture `logs/uvicorn_test.log` as an artifact to aid debugging intermittent failures.
