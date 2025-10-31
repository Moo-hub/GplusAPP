# GplusAPP

G+ App for recycling management and environmental impact tracking.

This repo includes a React frontend (tested with Vitest + React Testing Library), MSW-powered API mocks, and integration tests. The current test suite has been stabilized to run deterministically in Node/jsdom.

## 🎉 Recent Updates (December 2024)

The project has been recently updated with:
- ✅ **Security fixes**: Updated axios and other critical dependencies
- ✅ **Performance improvements**: Upgraded to Vite 5.x
- ✅ **Repository cleanup**: Removed 24 temporary/duplicate files
- ✅ **Enhanced documentation**: Added environment configuration guides
- ✅ **Improved CI/CD**: Streamlined backend testing pipeline
- ✅ **Monitoring setup**: Complete guide for Prometheus/Grafana

See [FIXES_COMPLETED.md](./FIXES_COMPLETED.md) for detailed information.

## Quick start

### Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for containerized setup)

### Environment Setup

1. **Copy environment files:**

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

2. **Install dependencies:**

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
pip install -r requirements.txt
# For development
pip install -r requirements-dev.txt
```

3. **Run tests (headless):**

```bash
npm run test
```

4. **Watch mode UI (interactive):**

```bash
npm run test:watch
```

5. **Coverage report:**

```bash
npm run test:coverage
```

Artifacts are generated in `coverage/`.

## Testing stack

- Vitest (v3) + @testing-library/react
- jsdom test environment
- MSW (Mock Service Worker) v2 for API mocking
- i18next + react-i18next (mocked by default in tests)

## Test conventions

- Place component tests under `frontend/src/components/__tests__/`.
- Integration tests that compose multiple screens live under `src/components/screens/`.
- Prefer `data-testid` selectors over brittle text matches.
- Always place `vi.mock(...)` calls before importing a module under test.

## i18n in tests

By default tests mock `react-i18next` in `setupTests.js` to avoid complex runtime initialization. Assertions should accept literal keys and translated strings. Example:

```js
expect(screen.getByText(/no_points_found|No points/i)).toBeInTheDocument();
```

If a test truly needs the real i18n behavior, unmock in that test file:

```js
vi.unmock('react-i18next');
```

## MSW server

The frontend uses a dynamic MSW server initializer in `frontend/src/mocks/server.js` and route handlers in `frontend/src/mocks/handlers.js`.

- Handlers cover the core endpoints: `/api/points`, `/api/vehicles`, `/api/companies`, `/api/payment-methods`, legacy `/api/payments/methods`, and pickup flows (`/pickups`, `/api/v1/pickups`, schedules, timeslots).
- Tests can override responses via headers (e.g., `x-msw-force-status: 500`).

See `frontend/src/tests/test-msw.spec.jsx` for examples.

## GenericScreen contract

`GenericScreen` supports two patterns:

- Children render-prop: component receives the loaded data and a reload helper.
- List-mode fallback: provide `renderItem` or rely on default item fields; loading/error/empty states are rendered with `data-testid` markers.

Key props:

- `apiCall(params?)` resolves to either array or object-with-data.
- `titleKey`, `emptyKey`, `errorKey` i18n keys (tests accept literal keys or strings).
- `data-testid`s: `loading`, `error`, `empty`, `generic-screen`, `item-*`.

## Troubleshooting

- "React is not defined" in JSX files: ensure `import React from 'react'` is present where needed.
- Loading state never resolves: verify `apiCall` is stable and `params` is not a new object each render.
- Mock not applying: confirm the mocked path matches the import path in the component under test and that `vi.mock()` is declared before imports.

## CI

GitHub Actions workflow runs Vitest with coverage on pushes and pull requests. See `.github/workflows/ci.yml`.

## License

ISC
