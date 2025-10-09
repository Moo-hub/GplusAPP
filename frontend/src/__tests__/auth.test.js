import { server } from '../mocks/server';

// Prefer to use helpers exposed by the proxied server to ensure the same
// msw instance is used. Fall back to importing msw/http if not present.
let http = null;
let HttpResponse = null;
try {
  http = server && server.http ? server.http : null;
  HttpResponse = server && server.HttpResponse ? server.HttpResponse : null;
} catch (e) {}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

// Diagnostic: after the proxy/server is ready, list registered handlers so we can
// confirm whether test-registered handlers were applied and in which order.
beforeAll(async () => {
  try {
    if (server && server.ready && typeof server.ready.then === 'function') await server.ready;
    if (server && typeof server.listHandlers === 'function') {
      const hs = await server.listHandlers();
  // diagnostic suppressed: registered handlers count
      try {
  // diagnostic suppressed: handlers list
      } catch (e) {}
    }
  } catch (e) { try { console.warn('DIAG: listHandlers failed', e && e.message ? e.message : e); } catch (e2) {} }
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Create node handlers once the proxied server is ready. We rely on
// `server.http` and `server.HttpResponse` being attached by the proxy
// when it initialized the real msw core. If those helpers are missing
// we log a warning and do not register handlers (tests will fail
// explicitly so the missing helpers can be fixed).
const createAndRegisterHandlers = () => {
  try {
    const h = [];
    const httpImpl = server && server.http ? server.http : http;
    const HttpResponseImpl = server && server.HttpResponse ? server.HttpResponse : HttpResponse;
    if (!httpImpl || !HttpResponseImpl) {
      // eslint-disable-next-line no-console
      console.warn('MSW helpers not available on proxy server; skipping handler registration');
      return;
    }

    // Helper: robust body reader that tolerates 'body already read' errors
    const safeRead = async (request) => {
      try {
        // try clone-based json first
        const maybeClone = request && typeof request.clone === 'function' ? request.clone() : (request && request.request && typeof request.request.clone === 'function' ? request.request.clone() : null);
        const reader = maybeClone || request || (request && request.request) || null;
        if (reader && typeof reader.json === 'function') return await reader.json();
        if (reader && typeof reader.text === 'function') {
          const t = await reader.text();
          try { return JSON.parse(t); } catch (e) { return { _raw: t }; }
        }
      } catch (err) {
        // Fall through and try safer fallbacks below
      }
      try {
        if (request && request.body) return request.body;
        if (request && request.request && request.request.body) return request.request.body;
      } catch (e) {}
      return {};
    };

    h.push(httpImpl.post('/api/auth/login', async ({ request }) => {
      try {
        // Diagnostic: log that the test handler was invoked and show headers
  // diagnostic suppressed: /api/auth/login handler invoked
  const body = await safeRead(request);
  const { email, password } = body || {};
        const success = email === 'test@example.com' && password === 'password123';
        const payload = success ? { user: { id: 2, name: 'Test User', email }, token: 'mock-token' } : { message: 'Invalid credentials' };
        const status = success ? 200 : 401;
        if (HttpResponseImpl && typeof HttpResponseImpl.json === 'function') {
          return HttpResponseImpl.json(payload, { status });
        }
        // Fallback: use global Response if available
        if (typeof Response !== 'undefined') return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
        return { body: JSON.stringify(payload), status };
      } catch (err) {
        try { console.error('TEST MSW: /api/auth/login handler error', err && err.message ? err.message : err); } catch (e) {}
        // Ensure a 500 response on unexpected failures so test shows server-side issue
        if (HttpResponseImpl && typeof HttpResponseImpl.json === 'function') {
          return HttpResponseImpl.json({ message: 'handler error' }, { status: 500 });
        }
        if (typeof Response !== 'undefined') return new Response(JSON.stringify({ message: 'handler error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        return { body: '{}', status: 500 };
      }
    }));

  h.push(httpImpl.post('/api/v1/auth/login', async ({ request }) => {
      try {
  // diagnostic suppressed: /api/v1/auth/login handler invoked
        // attempt to read text robustly
        let text = '';
        try {
          let maybe = await safeRead(request);
          // If safeRead returned a ReadableStream (undici or node fetch body), convert it to text
          try {
            if (maybe && typeof maybe.getReader === 'function') {
              const t = await new Response(maybe).text();
              maybe = { _raw: t };
            }
          } catch (e) {}
          if (maybe && maybe._raw) text = maybe._raw;
          else if (typeof maybe === 'string') text = maybe;
          else if (maybe && typeof maybe === 'object') text = new URLSearchParams(maybe).toString();
        } catch (e) { text = '' }
        const params = new URLSearchParams(text);
        const username = params.get('username');
        const password = params.get('password');
        const success = username === 'test@example.com' && password === 'password123';
        const payload = success ? { access_token: 'mock-jwt-token', token_type: 'bearer', user: { id: 2, name: 'Test User', email: username } } : { detail: 'Incorrect username or password' };
        const status = success ? 200 : 401;
        if (HttpResponseImpl && typeof HttpResponseImpl.json === 'function') {
          return HttpResponseImpl.json(payload, { status });
        }
        if (typeof Response !== 'undefined') return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
        return { body: JSON.stringify(payload), status };
      } catch (err) {
        try { console.error('TEST MSW: /api/v1/auth/login handler error', err && err.message ? err.message : err); } catch (e) {}
        if (HttpResponseImpl && typeof HttpResponseImpl.json === 'function') {
          return HttpResponseImpl.json({ message: 'handler error' }, { status: 500 });
        }
        if (typeof Response !== 'undefined') return new Response(JSON.stringify({ message: 'handler error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        return { body: '{}', status: 500 };
      }
    }));

    try {
      // Replace existing handlers so tests get deterministic behavior.
      if (server && typeof server.resetHandlers === 'function') {
        server.resetHandlers(...h);
  // diagnostic suppressed: test handlers registered via resetHandlers
      } else {
        server.use(...h);
  // diagnostic suppressed: test handlers registered via use() fallback
      }
    } catch (e) { /* ignore registration errors */ }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to create/register handlers', e && e.message ? e.message : e);
  }
};

// Schedule handler registration once the server signals readiness.
try {
  if (server && server.ready && typeof server.ready.then === 'function') {
    server.ready.then(() => createAndRegisterHandlers()).catch(() => createAndRegisterHandlers());
  } else {
    // If no readiness promise, try immediately
    createAndRegisterHandlers();
  }
} catch (e) { createAndRegisterHandlers(); }

test('MSW login handler accepts valid credentials (JSON endpoint)', async () => {
  const resp = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-msw-skip-global': '1' },
    body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
  });

  const data = await resp.json();
  expect(resp.status).toBe(200);
  expect(data).toHaveProperty('user');
  expect(data.user.email).toBe('test@example.com');
}, 10000);

test('MSW backend-style login endpoint (form data) succeeds', async () => {
  const params = new URLSearchParams();
  params.append('username', 'test@example.com');
  params.append('password', 'password123');

  const resp = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'x-msw-skip-global': '1' },
    body: params.toString()
  });

  const data = await resp.json();
  expect(resp.status).toBe(200);
  expect(data).toHaveProperty('access_token');
  expect(data).toHaveProperty('user');
  expect(data.user.email).toBe('test@example.com');
}, 10000);
