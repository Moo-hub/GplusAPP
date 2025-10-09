# Running the gated E2E smoke tests (RUN_E2E_SMOKE)

This project keeps a fast CI suite by default and gates a single, small E2E "smoke" test behind an environment flag. The smoke test checks a critical end-to-end login flow and is intended to run less frequently (nightly or in large PRs).

How it works

- The smoke test is gated by the `RUN_E2E_SMOKE` environment variable. When set to `true`, the test(s) annotated to run as "E2E smoke" will execute. Otherwise they're skipped.

Run locally (PowerShell)

```powershell
# from the frontend folder
Set-Location .\frontend
# Run vitest with the smoke flag set for the current process
$env:RUN_E2E_SMOKE = 'true'

# Recommended: use the provided npm script from the repo root which writes the
# report to the repo root as `frontend-full-results.json`:

npm --prefix frontend run smoke:run
```

Run locally (POSIX / bash)

```bash
cd frontend

# Or, set the env and run directly (writes to repo root):

RUN_E2E_SMOKE=true npx --prefix frontend vitest run --config ./frontend/vitest.config.js --reporter json > ./frontend-full-results.json
```

What to expect
- A JSON test report will be produced at `frontend-full-results.json` in the repo root. You can open and inspect it or feed it into triage tools.

CI Integration
- Example CI job is provided in `.github/workflows/smoke-e2e.yml`. It runs on a nightly schedule and uploads the JSON report as an artifact so triage jobs or dashboards can consume it.

Notes
- Keep the smoke test minimal. It should cover the most critical path and be reliable. Use the `globalThis.__TEST_AUTH__` test seam and MSW handlers where possible to avoid network brittleness.

If you want the smoke test to run for a specific PR or manually on CI, trigger the workflow via the Actions tab and pass `RUN_E2E_SMOKE=true` as an input or modify the workflow dispatch payload.
