# Test Hooks Guide

This document explains the small test-only hooks added to improve determinism and control in unit tests. These hooks are safe, isolated to tests, and make it easier to mock environment and network dependencies.

## Analytics Service (`frontend/src/services/analyticsService.js`)

- `__setAnalyticsEnvForTest(env, apiUrl, appVersion)`
  - Purpose: Force environment values in tests without mutating `import.meta.env`.
  - Use when you need to exercise the production code path (sendBeacon) or control payload fields.

- `__resetAnalyticsForTest()`
  - Purpose: Reset session and test env override between tests to avoid cross-test leakage.

Example:
```js
import { Analytics, __setAnalyticsEnvForTest, __resetAnalyticsForTest } from '../analyticsService';

beforeEach(() => {
  __setAnalyticsEnvForTest('production', 'https://api.example.com', '1.2.3');
  navigator.sendBeacon = vi.fn();
});

afterEach(() => {
  __resetAnalyticsForTest();
});
```

## WebSocket Service (`src/services/websocket.js`)

- `setWebSocketClass(WS)`
  - Purpose: Inject a mock WebSocket class so tests can fully control connection lifecycle and captured calls.

- `__setWsUrlForTest(url)`
  - Purpose: Override computed WebSocket URL for tests (e.g., point to a test server or a deterministic value).

- `__getSocketForTest()`
  - Purpose: Access the current socket instance to simulate events (open/message/close) in tests.

Example:
```js
import WebSocketService from '../../src/services/websocket';

const MockWebSocket = vi.fn(() => ({
  readyState: 0,
  send: vi.fn(),
  close: vi.fn(),
  onopen: null,
  onmessage: null,
  onclose: null,
}));

beforeEach(() => {
  WebSocketService.setWebSocketClass(MockWebSocket);
  WebSocketService.__setWsUrlForTest('ws://test-server');
  vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'user123') });
});
```

## API Service (`frontend/src/services/api.js`)

- `setApiInstance(instance)`
  - Purpose: Inject a mocked axios instance into the service for full control of requests and interceptors.

- `createApiInstance(config)`
  - Purpose: Create an axios instance when a mock wasn’t injected. In tests, prefer `setApiInstance`.

- `initApiInterceptors()`
  - Purpose: Register request/response interceptors on the current instance (mock or real).

- `requestInterceptor`, `responseInterceptor`, `responseErrorHandler`
  - Purpose: Exported interceptor functions to test behavior directly without relying on axios internals.

Example:
```js
import {
  setApiInstance,
  initApiInterceptors,
  requestInterceptor,
  responseInterceptor,
  responseErrorHandler,
} from '../api';

const mockAxios = {
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
  get: vi.fn(),
  post: vi.fn(),
};

beforeEach(() => {
  setApiInstance(mockAxios);
  initApiInterceptors();
});

it('applies auth header', () => {
  const cfg = requestInterceptor({ headers: {} });
  // ...assert cfg.headers.Authorization
});
```

## Notes
- Prefer using hooks and vi mocks over mutating globals directly (especially `import.meta.env`).
- Reset or restore any global you stub between tests to avoid leaks.
- Keep mocks minimal and deterministic.
