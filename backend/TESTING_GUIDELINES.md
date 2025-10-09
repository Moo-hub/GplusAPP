# Testing guidelines

This document explains the conventions we use for running and writing tests for the backend. It focuses on preventing brittle tests caused by dependency override leaks, keeping tests hermetic and fast, and giving clear debugging guidance.

## 1. Environment

- Always run tests with `ENVIRONMENT=test`. The repository `tests/conftest.py` sets this early so application settings pick up the test environment.
- Tests use a local SQLite file database: `DATABASE_URL=sqlite:///./test.db`. The `db` fixture in `tests/conftest.py` creates/tears the database and yields a session-scoped SQLAlchemy session.

## 2. Dependency overrides

- Do not replace `app.dependency_overrides` wholesale (for example `app.dependency_overrides = {}`) at import time — that can silently leak mocks between test modules.
- Avoid creating a `TestClient` at module import time. Install any dependency overrides required by the test module before constructing the `TestClient`.
- Prefer fixtures that apply overrides and restore the original override on teardown. Example pattern (see `tests/api/test_environmental_impact_api.py`):

```python
_orig = app.dependency_overrides.get(get_current_user)
app.dependency_overrides[get_current_user] = mock_get_current_user
with TestClient(app) as c:
    yield c
# restore
if _orig is not None:
    app.dependency_overrides[get_current_user] = _orig
else:
    app.dependency_overrides.pop(get_current_user, None)
```

- If you need to override `get_db`, use the `db` fixture; the autouse fixture `ensure_get_db_override` re-applies the DB override before each test to prevent accidental loss.

## 3. Avoid brittle automatic wrappers

- We removed a brittle wrapper that attempted to coerce dict-returning overrides into model-like objects. That wrapper caused FastAPI to interpret wrapper signatures as request parameters and produced `422` validation errors. Tests must supply compatible overrides themselves.
- For small mocks, `types.SimpleNamespace` is a convenient pattern (see `tests/api/test_environmental_impact_api.py`). Prefer returning objects with attribute access when endpoints expect model-like users.

## 4. Monitoring & background tasks

- Redis monitoring and the background scheduler are disabled when `ENVIRONMENT == "test"` to avoid starting background threads or tasks during tests.
- If you need to exercise Redis behavior, write focused unit tests for the Redis modules using the in-memory Redis shim. If you do enable monitoring in tests, ensure the shim returns awaitables (or mock awaitables) so the monitoring code can await them safely.

## 5. Debugging aids

- The test harness logs `app.dependency_overrides` before and after each test. If you see unexpected overrides, fix the test to install and restore them via a fixture or a context manager.
- A debug reproducer is available at `scripts/debug/repro_envimpact_wrapped_override.py` for local reproduction of override-related issues.

## 6. Checklist for adding tests

- Do not create a `TestClient` at module import time.
- If a test requires authentication, apply the auth override before creating the `TestClient` (see the example above).
- If you override the DB, use the `db` fixture or restore the original `get_db` override after the test.
- Start with focused tests:

```bash
pytest tests/api/path/to/test.py -q
```

Then run the full API suite:

```bash
pytest tests/api -q
```

## 7. CI notes

- Ensure CI sets `ENVIRONMENT=test` and uses a fresh workspace for every run.
- Recommended CI command (example):

```bash
# Run all API tests inside CI (example)
ENVIRONMENT=test DATABASE_URL=sqlite:///./test.db pytest tests/api -q
```

- Remove ephemeral files (like `test.db`) between CI runs to avoid cross-run contamination.

---

If you want, I can:

- Remove the debug reproducer script at `scripts/debug/repro_envimpact_wrapped_override.py`, or
- Add a `CI.md` with exact CI steps and caching advice, or
- Start updating remaining tests to return model-like objects instead of dicts.

Tell me which option to do next and I will implement it.
