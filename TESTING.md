# Testing Guide

This document captures patterns, best practices, and conventions for writing and running tests in GplusAPP.

## Stack

- Vitest (v3) as the test runner
- React Testing Library for DOM assertions
- jsdom environment
- MSW (Mock Service Worker) v2 for API mocking
- i18next + react-i18next for translations

## Core practices

1. Mock order matters

- Always declare `vi.mock()` calls at the top of the test file, before importing modules under test.
- Example:

```js
vi.mock('../../services/api', () => ({ getPoints: vi.fn() }));
import PointsScreen from '../screens/PointsScreen';
```

2. Prefer `data-testid`

- Components expose stable testids for state and item fields:
  - `loading`, `error`, `empty`, `generic-screen`, `item`, `item-name`, `item-balance`, `item-rewards`, `item-price`.
- Avoid brittle text matches that depend on translations or styling.

3. i18n policy

- Default: `react-i18next` is mocked in `setupTests.js` with `useSuspense: false`. This keeps most tests simple and deterministic.
- Tests that validate translation behavior should opt-in to real i18n with `vi.unmock('react-i18next')` and import the configured i18n instance (`frontend/src/i18n`).
- Assertions should generally accept either translated strings or literal keys to remain robust.

4. GenericScreen contract

- Children-first: if `children` is provided, it will render with loaded data (or empty state if null/empty array).
- List-mode fallback: when no `children`, `GenericScreen` renders a list using `renderItem` or default fields.
- `apiCall` may return an array or an object like `{ data: [...] }`; both are supported.

5. MSW usage

- Global server is initialized via `frontend/src/mocks/server.js` and handlers in `frontend/src/mocks/handlers.js`.
- Tests can temporarily override handlers via `server.use(...)` or force error statuses using the `x-msw-force-status` header.
- Use relative URLs (`/api/points`) to ensure jsdom/Node adapters route through MSW. Handlers also support absolute localhost URLs if needed.

6. Integration tests

- Ensure mocks target the same module path used by the component (`'../../services/api'`, not `'../../api'`).
- Await loading disappearance when verifying content or use `getByTestId('loading')` immediately if checking the initial paint.
- Prefer `within(container)` sparingly; target specific roles or testids to remain clear.

7. Common edge cases

- Loading loops: avoid default object props (e.g., `params = {}`) that change identity each render; pass stable references.
- Multiple i18n instances: tests should avoid initializing a new i18n instance; rely on defaults unless explicitly testing i18n.

## Running tests

Headless run:

```bash
npm run test
```

Watch mode UI:

```bash
npm run test:watch
```

Coverage:

```bash
npm run test:coverage
```

Component-focused:

```bash
npm run test:components
```

## Adding new tests

- Place new component tests alongside components in `__tests__` directories.
- If adding API-dependent components, prefer using MSW to mock endpoints rather than mocking `fetch` or `axios` directly.
- Use the same `data-testid` and i18n patterns outlined above.

## Troubleshooting

- “React is not defined”: add `import React from 'react'` in JSX files (when needed in jsdom).
- Mock not applied: ensure `vi.mock()` is before imports and the path matches the component’s import.
- i18n key shown instead of translation: likely using the default mock; adapt assertion to accept keys, or unmock to use real i18n for that test.
