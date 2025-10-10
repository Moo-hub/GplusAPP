# Testing guide (backend)

## Purpose

This document explains how to run the backend test suite, the meaning of `ENVIRONMENT == "test"` in this repository, and how Redis is handled during tests. It also documents how to opt into manual integration tests.

## ENVIRONMENT == "test"

- When the environment variable `ENVIRONMENT` is set to `test`, the backend config and helpers pick test-friendly defaults:
  - `settings.DATABASE_URL` will return `sqlite:///./test.db`.
  - `app.core.redis_client.get_redis_client()` will prefer an in-memory fallback (`InMemoryRedis`) rather than requiring a real Redis server.
  - Some production lifecycles and background tasks are disabled to keep tests deterministic.

## Redis behavior and test hermeticity

- The project exposes `get_redis_client()` in `app/core/redis_client.py`:
  - In non-test environments it attempts to connect to the Redis instance at `settings.REDIS_URL`.
  - If the connection fails, or when `ENVIRONMENT == 'test'`, it falls back to `InMemoryRedis()`.
- The `RateLimiter` and other middlewares call `get_redis_client()` lazily (no import-time network calls).
- RateLimiter fail-open behavior:
  - If `get_redis_client()` returns `None` or Redis operations fail, the middleware will allow requests through (fail-open) to avoid blocking tests.
  - When an in-memory or real Redis client is present, the rate-limiter enforces limits.

## Running backend tests (Windows / PowerShell)

1. Activate the virtualenv (example):

    ```powershell
    & "path\to\venv\Scripts\Activate.ps1"
    ```

2. From the repository `backend` folder, run pytest:

    ```powershell
    Set-Location -Path 'c:\Users\Moamen Ahmed\OneDrive\Desktop\GplusApp\backend'
    pytest -q
    ```

Notes:

- Tests set `ENVIRONMENT=test` via fixtures where required. You can also set it manually in your shell if needed:

    ```powershell
    $env:ENVIRONMENT = 'test'
    pytest -q
    ```

## Manual integration tests

- Some tests that exercise external services (SMTP, third-party APIs, or a running local server) are intentionally skipped by default.
- To opt into manual tests, set `RUN_MANUAL_TESTS=1` and ensure any required services are running. Example:

    ```powershell
    $env:RUN_MANUAL_TESTS = '1'
    pytest tests/manual -q
    ```

## Troubleshooting

- If a test unexpectedly tries to contact a real Redis instance:
  - Verify `ENVIRONMENT` is `test` in the test environment.
  - Check that `app/core/redis_client.get_redis_client()` fallback behavior hasn't been overridden by test fixtures.
- To force a real Redis connection in a development environment, set `REDIS_HOST`/`REDIS_PORT` appropriately and ensure the service is reachable.

## Contact / Notes

If you'd like, I can convert this guide into a README section and open a small PR with the test additions and changelog entries.
