PR summary: Deterministic frontend test hardening
===============================================

Why
---
- Make frontend unit/integration tests deterministic on CI.
- Prevent network leaks during tests (ensure MSW intercepts absolute URLs).
- Avoid multiple React copies and other import-resolution flakes.

What changed (high level)
-------------------------
- `frontend/src/setupTests.js`: centralized test bootstrap (i18n fallback, axios adapter fallback, DOM/WebSocket/Storage shims, MSW ESM proxy init, targeted console filters, afterEach cleanup).
- `frontend/vitest.config.js`: robust frontend root detection and resolve.alias entries to dedupe `react`/`react-dom` and to redirect dev/deep imports to `src/test-shims/`.
- `frontend/src/test-shims/*`: small shims for dev-only or deep imports (react-query-devtools, react-icons, antd, @ant-design/icons, globals).
- `frontend/src/mocks/handlers.js`: extended MSW handlers that intercept absolute loopback URLs and include a final loopback catch‑all to prevent ECNREFUSED leaks.
- (temporary) `frontend/vitest-report.xml`: JUnit report produced locally for reviewer convenience.

Local validation
----------------
- Ran full Vitest suite locally (environment: Windows dev machine). Result: 344 tests, 0 failures. JUnit produced and attached to branch.
- Verified focused tests (notification/pickup/points) no longer hit ECONNREFUSED and that MSW intercepts absolute axios requests.

Environment note
----------------
- Attempted a Docker (Node 20) local simulation but encountered bind‑mount/native-binary issues on Windows (esbuild/rollup native artifacts) — this is an environment-specific problem. GitHub Actions (Linux) runners normally do not exhibit this. Please review CI logs on the PR run and report any Node20-specific failures; I will fix them with a focused shim/alias if needed.

Reviewer checklist
------------------
- Review `frontend/src/setupTests.js` for any global behaviors that might affect test intent. The file is intentionally conservative and only adds small, focused shims.
- Review `frontend/vitest.config.js` alias mappings; they are targeted to prevent import-analysis failures during Vitest worker startup (dev-only deep imports are redirected to lightweight shims).
- If CI is green, we should remove `frontend/vitest-report.xml` in a follow-up commit and rely on CI to upload JUnit as an artifact automatically.

Next steps
----------
1. Trigger CI by pushing these changes (already pushed). Monitor GitHub Actions for Node20 differences; if present, I'll triage and push small focused fixes.  
2. Once CI is green, remove the checked-in JUnit and rely on CI artifacts for future runs.

Contact
-------
If you want me to update the PR description directly on GitHub or attach the JUnit report as an artifact, I can do that next (I currently committed this PR_BODY.md to the branch to keep the branch self-documenting).
