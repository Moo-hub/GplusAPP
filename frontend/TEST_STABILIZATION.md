Test stabilization follow-ups

Goal: Prioritize CI stability while reducing hoisted mocks over time. Keep the hoisted `api/pickup` mock for now (documented in the pickup integration test). These follow-up tasks will track the work needed to make MSW the single source of truth for network interactions.

1) Stabilize failing frontend tests (network / i18n)
- Symptoms observed when running `npx vitest run frontend`:
  - ECONNREFUSED ::1:80 in some integration tests (looks like certain axios requests attempted to reach ::1 host or default host when baseURL missing).
  - i18n text mismatches: many tests expect translation keys or English text; ensure `react-i18next` async factory mock is used consistently.
  - Duplicate validation messages in form tests: possibly the test environment renders errors twice due to component duplication or double-mount; investigate the component under test.

- Action items:
  - Audit tests failing in `npx vitest run frontend` and create small PRs with fixes:
    - Ensure MSW has handlers for absolute URL shapes (already added for many endpoints).
    - Set `axios.defaults.baseURL = 'http://localhost'` in `vitest.setup.js` (already attempted; verify in CI).
    - Use async factory `react-i18next` mock in all tests (or a shared `test-utils` provider) to avoid raw key rendering.
    - Remove or consolidate duplicate error renderings in the component or update tests to use `getAllBy*` when duplicate errors are expected.

- Acceptance criteria: previously failing tests in the full frontend run pass locally.

2) CI-simulation and MSW-only trial
- Prepare a CI-like local run:
  - Use the same Node version as CI (e.g., via nvm or volta) and run PowerShell commands in the project root.
  - Ensure no local dev servers are running. Clear environment variables that CI sets differently if needed.

- Commands to run locally (PowerShell):
```
# from repository root
# optional: use the same node version as CI
npx vitest run "frontend/src/screens/__tests__/PickupRequestWorkflow.integration.test.jsx" --reporter verbose
# remove/disable the hoisted mock in the test file, then run full frontend suite
# make a backup before editing
cp frontend/src/screens/__tests__/PickupRequestWorkflow.integration.test.jsx frontend/src/screens/__tests__/PickupRequestWorkflow.integration.test.jsx.bak
# edit the test to remove the hoisted mock (manual step or via script)
# then run full frontend tests
npx vitest run frontend --reporter verbose
```

- If tests fail in CI-sim:
  - Capture failing tests and logs (especially any network error stacks mentioning ::1 or IPv6 addresses).
  - Re-introduce targeted MSW handlers (predicate-based absolute URL handlers) for endpoints that still leak.
  - Only remove the hoisted mock when the CI-sim run is green.

3) Re-try in CI
- After local CI-sim is green, push a branch that removes the hoisted mock and open a PR. Configure CI to run the frontend tests and observe results.
- If CI passes, delete the hoisted mock and update the test comment.
- If CI fails with environmental differences, revert and keep hoisted mock, attaching the investigation notes in this repo (link back to this MD file).

Notes / useful files
- `frontend/src/mocks/handlers.js` — where MSW handlers live. It already includes many absolute-URL predicate handlers.
- `vitest.setup.js` — global test setup. It sets `axios.defaults.baseURL = 'http://localhost'` as a precaution.
- `frontend/src/screens/__tests__/PickupRequestWorkflow.integration.test.jsx` — currently contains a hoisted mock for `../../api/pickup` with a comment explaining the fallback.

If you'd like, I can:
- Open separate PRs for the failing tests (fixes will be small: i18n factory, axios baseURL, MSW handlers adjustments).
- Attempt the MSW-only removal and full run in a CI-sim locally and capture logs for CI tickets.

