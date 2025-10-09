// msw v2 exports HTTP handlers under `http` in the core package.
// Alias it to `rest` to preserve the familiar handler API used across the tests.
import { http as rest } from 'msw';

// محاكاة قاعدة البيانات المحلية
const mockUsers = [
  {
    id: 1,
    name: 'User Demo',
    email: 'user@example.com',
    password: 'password'  // Simple password for testing
  },
  {
    id: 2,
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  },
  {
    id: 3,
    name: 'Admin User',
    email: 'admin@gplus.com',
    password: 'adminpassword123'
  }
];

// بيانات وهمية
const mockPoints = {
  balance: 200,
  impact: "~1.3kg CO₂",
  reward: "5% off next pickup"
};

const mockCompanies = [
  { id: 1, name: "EcoCorp", icon: "🏢" },
  { id: 2, name: "GreenTech", icon: "🌱" }
];

// Include both naming variants used across tests: "Truck 1/2" and "Truck A/B".
const mockVehicles = [
  { id: 1, name: "Truck 1", status: "Active", icon: "🚛", price: "$10", location: "Downtown" },
  { id: 2, name: "Truck 2", status: "Idle", icon: "🚚", price: "$12", location: "Uptown" },
  { id: 3, name: "Truck A", status: "Active", icon: "🚛", price: "$10", location: "Downtown" },
  { id: 4, name: "Truck B", status: "Idle", icon: "🚚", price: "$12", location: "Uptown" }
];

const mockPaymentMethods = [
  { id: 1, name: "Visa", icon: "💳" },
  { id: 2, name: "MasterCard", icon: "�" },
  { id: 3, name: "PayPal", icon: "💸" }
];

// Helper to reliably detect test environment across different runtimes
const isTestEnv = () => {
  try {
    // Recognize a few different globals that tests or setupFiles may set.
    // Some test setups set global.__TEST__ or globalThis.__TEST__, while
    // our Vitest setup uses globalThis.__TEST_AUTH__ to control test auth.
    if (typeof global !== 'undefined' && global.__TEST__) return true;
    if (typeof globalThis !== 'undefined' && (globalThis.__TEST__ || globalThis.__TEST_AUTH__)) return true;
    if (process && (process.env && (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'))) return true;
  } catch (e) {}
  return false;
};

// Compatibility helper to safely read headers across msw versions / request shapes
const headerGet = (req, name) => {
  try {
    if (!req) return undefined;
    // prefer top-level headers
    const maybeHeaders = req.headers ?? (req.request && req.request.headers) ?? undefined;
    if (!maybeHeaders) return undefined;
    // prefer Headers-like get()
    if (typeof maybeHeaders.get === 'function') return maybeHeaders.get(name);
    // fallback to plain object lookup (case-insensitive)
    const key = Object.keys(maybeHeaders).find(k => k.toLowerCase() === name.toLowerCase());
    if (key) return maybeHeaders[key];
    return undefined;
  } catch (e) { return undefined; }
};

// Small helper to create a JSON Response without depending on msw `res(ctx...)`
const jsonResponse = (body, status = 200) => {
  try {
    const payload = typeof body === 'string' ? body : JSON.stringify(body ?? {});
    // Use global Response (Node's undici or fetch polyfill) when available so
    // msw core can treat it as a mocked response. Fall back to a minimal object
    // if Response is not available (very unlikely in Vitest/node 18+).
    if (typeof Response !== 'undefined') {
      return new Response(payload, { status, headers: { 'Content-Type': 'application/json' } });
    }
    return { body: payload, status };
  } catch (e) {
    return { body: '{}', status };
  }
};

// Robust request body reader that supports multiple msw/runtime shapes.
// It tries common helpers in order: req.json(), req.request.json(),
// req.formData()/req.request.formData(), req.text()/req.request.text(),
// and falls back to req.body when present.
const readBody = async (req) => {
  try {
    if (!req) return {};
    // If content-type header indicates urlencoded form, attempt to read as text
    try {
      const contentType = headerGet(req, 'content-type') || headerGet(req, 'Content-Type');
      if (typeof contentType === 'string' && contentType.toLowerCase().includes('application/x-www-form-urlencoded')) {
        // prefer req.request.text() if available
        try {
          const maybeReq = req.request || req;
          if (maybeReq && typeof maybeReq.text === 'function') {
            const t = await maybeReq.text();
            return { _raw: t };
          }
        } catch (e) {}
        // fallback to raw body
        try {
          if (req && req.body && typeof req.body === 'string') return { _raw: req.body };
          if (req && req.request && req.request.body && typeof req.request.body === 'string') return { _raw: req.request.body };
        } catch (e) {}
      }
    } catch (e) {}
    // Prefer reading from a cloned Request so multiple handlers can read
    // the same incoming request without consuming the original body.
    const maybeOrig = req.request || req;
    const clonedReq = (maybeOrig && typeof maybeOrig.clone === 'function') ? maybeOrig.clone() : null;
    const reader = clonedReq || maybeOrig;
    if (reader && typeof reader.json === 'function') {
      return await reader.json();
    }
    if (req.request && typeof req.request.json === 'function') {
      // fallback to reading from original if clone not available
      return await req.request.json();
    }
    if (reader && typeof reader.formData === 'function') {
      const fd = await reader.formData();
      const obj = {};
      for (const [k, v] of fd.entries()) obj[k] = v;
      return obj;
    }
    if (req.request && typeof req.request.formData === 'function') {
      // fallback to original
      const fd = await req.request.formData();
      const obj = {};
      for (const [k, v] of fd.entries()) obj[k] = v;
      return obj;
    }
    if (reader && typeof reader.text === 'function') {
      const t = await reader.text();
      try { return JSON.parse(t); } catch (e) { return { _raw: t }; }
    }
    if (req.request && typeof req.request.text === 'function') {
      const t = await req.request.text();
      try { return JSON.parse(t); } catch (e) { return { _raw: t }; }
    }
    if (req && req.body) return req.body;
  } catch (e) {
    // ignore and fall through
  }
  return {};
};

// In test environments we want handlers to be fast. Make delay a no-op
// when running tests so that Vitest suite executes quickly. In non-test
// environments preserve the real delay to model network latency.
const delay = (ms) => {
  if (isTestEnv()) return Promise.resolve();
  return new Promise((r) => setTimeout(r, ms));
};

// Safe responder: prefer msw-style res(ctx.status(...), ctx.json(...)) when
// `ctx` is available. Fall back to a platform Response via jsonResponse when
// ctx is not provided (some runtime shapes may call handlers without ctx).
const send = (res, ctx, status, body) => {
  try {
    if (typeof ctx !== 'undefined' && typeof res === 'function') {
      return res(ctx.status(status), ctx.json(body));
    }
  } catch (e) {
    // fall through to jsonResponse fallback
  }
  return jsonResponse(body, status);
};

// محاكاة المصادقة
const handlers = [
  // Backend-style login endpoint (for form data)
  rest.post('/api/v1/auth/login', async (req, res, ctx) => {
    await delay(500);
    // Allow tests to skip global handler to avoid consuming the body before
    // test-specific handlers are applied. Tests can set x-msw-skip-global=1.
    try { if (headerGet(req, 'x-msw-skip-global')) return; } catch (e) {}
    // Use readBody helper to support multiple request shapes and avoid
    // 'body already read' errors. readBody will return an object or
    // {_raw: text} for text bodies.
    let body = {};
    try { body = await readBody(req); } catch (e) { body = {}; }
    let username = null;
    let password = null;
    try {
      if (body && typeof body === 'object' && !body._raw) {
        username = body.username || body.email || null;
        password = body.password || null;
      } else if (body && typeof body === 'string') {
        const params = new URLSearchParams(body);
        username = params.get('username');
        password = params.get('password');
      } else if (body && body._raw) {
        const params = new URLSearchParams(body._raw);
        username = params.get('username');
        password = params.get('password');
      }
    } catch (e) { username = null; password = null; }
      const user = mockUsers.find(u => u.email === username);
        // Fallback: if parsing produced no username/password, try to read raw text
      if ((!username || !password) && req && (req.request || req)) {
        try {
          const maybeReq = req.request || req;
          if (maybeReq && typeof maybeReq.text === 'function') {
            const raw = await maybeReq.text();
            const p2 = new URLSearchParams(raw);
            username = username || p2.get('username');
            password = password || p2.get('password');
          }
        } catch (e) {}
      }
        // Diagnostic log for failing tests: include parsed values and raw body
        try {
          const rawBody = (body && body._raw) ? body._raw : (typeof body === 'string' ? body : undefined);
          console.log('DIAG auth v1 parsed', { username, password, rawBody });
        } catch (e) {}
    if (!user || user.password !== password) {
      return send(res, ctx, 401, { detail: 'Incorrect username or password' });
    }
    const token = 'mock-jwt-token-' + Math.random().toString(36).substring(2, 10);
    return res(ctx.status(200), ctx.json({ access_token: token, token_type: 'bearer', user: { id: user.id, name: user.name, email: user.email, role: user.id === 3 ? 'admin' : 'user' } }));
  }),
  
  // Original login endpoint (keep for compatibility)
  rest.post('/api/auth/login', async (req, res, ctx) => {
    await delay(500);
    // Allow tests to skip global handler to avoid consuming the body before
    // test-specific handlers are applied. Tests can set x-msw-skip-global=1.
    try { if (headerGet(req, 'x-msw-skip-global')) return; } catch (e) {}
    try {
      const body = await readBody(req);
      // accept either email or username fields from different clients/tests
      const loginId = (body && (body.email || body.username)) || null;
      const password = (body && (body.password)) || null;
      const user = mockUsers.find(u => (loginId && (u.email === loginId || u.name === loginId)));
      if (!user || password !== user.password) {
          return send(res, ctx, 401, { message: 'خطأ في البريد الإلكتروني أو كلمة المرور' });
        }
        const token = 'mock-jwt-token-' + Math.random().toString(36).substring(2, 10);
    return send(res, ctx, 200, { user: { id: user.id, name: user.name, email: user.email }, token });
    } catch (err) {
      try { console.error('GLOBAL MSW: /api/auth/login handler error', err && err.message ? err.message : err); } catch (e) {}
      return send(res, ctx, 500, { message: 'handler error' });
    }
  }),
  
  // التسجيل
  rest.post('/api/auth/register', async (req, res, ctx) => {
    await delay(700);
    const userData = await readBody(req);
    if (mockUsers.some(u => u.email === userData.email)) {
      return res(ctx.status(422), ctx.json({ message: 'البريد الإلكتروني مستخدم بالفعل' }));
    }
    const newUser = { id: mockUsers.length + 1, name: userData.name, email: userData.email, password: 'hashed_password' };
    mockUsers.push(newUser);
    const token = 'mock-jwt-token-' + Math.random().toString(36).substr(2, 10);
    return res(ctx.status(201), ctx.json({ user: { id: newUser.id, name: newUser.name, email: newUser.email }, token }));
  }),

  // v1 register endpoint (backend style)
  rest.post('/api/v1/auth/register', async (req, res, ctx) => {
    await delay(700);
    const userData = await readBody(req);
    if (mockUsers.some(u => u.email === userData.email)) {
      return res(ctx.status(422), ctx.json({ detail: 'Email already registered' }));
    }
    const newUser = { id: mockUsers.length + 1, name: userData.name, email: userData.email, password: userData.password };
    mockUsers.push(newUser);
    const token = 'mock-jwt-token-' + Math.random().toString(36).substring(2, 10);
    return res(ctx.status(201), ctx.json({ access_token: token, token_type: 'bearer', user: { id: newUser.id, name: newUser.name, email: newUser.email, role: 'user' } }));
  }),
  
  // Backend style "me" endpoint
  rest.get('/api/v1/auth/me', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) {
      return res(ctx.status(401), ctx.json({}));
    }
    const user = mockUsers[1];
    return res(ctx.status(200), ctx.json({ id: user.id, name: user.name, email: user.email, role: user.id === 3 ? 'admin' : 'user' }));
  }),
  
  // Original "me" endpoint (for compatibility)
  rest.get('/api/auth/me', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if ((!authHeader || !authHeader.startsWith('Bearer ')) && !isTestEnv()) {
      return res(ctx.status(401), ctx.json({}));
    }
    const user = mockUsers[0];
    return res(ctx.status(200), ctx.json({ id: user.id, name: user.name, email: user.email }));
  }),
  
  // تسجيل الخروج
  rest.post('/api/auth/logout', (req, res, ctx) => res(ctx.status(200), ctx.json({ message: 'تم تسجيل الخروج بنجاح' }))),
  
  // إضافة ال Authorization Header requirement للـ API الأخرى
  rest.get('/api/points', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    // Allow tests to force a specific status via header or query parameter
    // when running in the test environment. Prefer header-based forcing
    // because req.url can have different shapes depending on the runner.
    try {
      const headerForced = headerGet(req, 'x-msw-force-status');
      if (headerForced && isTestEnv()) {
        const status = parseInt(headerForced, 10) || 500;
        return send(res, ctx, status, {});
      }
      // Fallback: parse _msw_force_status from URL-like shapes or plain string
      let forced = null;
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      if (reqUrlObj && typeof reqUrlObj === 'object' && reqUrlObj.searchParams) {
        forced = reqUrlObj.searchParams.get('_msw_force_status');
      } else if (typeof reqUrlObj === 'string') {
        try { forced = new URL(reqUrlObj, 'http://localhost').searchParams.get('_msw_force_status'); } catch (e) { forced = null; }
      }
      if (!forced && req) {
        try {
          const s = (typeof reqUrlObj === 'string') ? reqUrlObj : (reqUrlObj && typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj));
          const m = s.match(/[?&]_msw_force_status=(\d+)/);
          if (m) forced = m[1];
        } catch (e) { /* ignore */ }
      }
      if (forced && isTestEnv()) {
        const status = parseInt(forced, 10) || 500;
        return send(res, ctx, status, {});
      }
    } catch (e) { /* ignore parsing errors */ }

    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockPoints);
  }),
  // Compatibility: some tests or services call '/points' (without /api prefix)
  // Ensure those requests are also mocked so tests don't hit a real server.
  rest.get('/points', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockPoints);
  }),
  // Absolute URL compatibility: some HTTP clients (axios/node) construct
  // full URLs like http://[::1]/api/points or http://localhost/api/points.
  // Add explicit handlers for common loopback hosts so MSW intercepts
  // these requests regardless of adapter/runtime behavior.
  // Match full-URL requests that target common loopback hosts. Some
  // Axios/node adapters construct absolute URLs (including host). Use
  // a function predicate matcher to avoid path-to-regexp parsing of
  // bracketed IPv6 literals like [::1].
  rest.get((req) => {
    try {
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      // Match /api/points on common loopback hosts
      return /https?:\/\/(\[::1\]|localhost|127\.0\.0\.1)(:\d+)?\/api\/points(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockPoints);
  }),

  // Absolute URL compatibility for non-/api points (http://localhost/points)
  rest.get((req) => {
    try {
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /https?:\/\/(\[::1\]|localhost|127\.0\.0\.1)(:\d+)?\/points(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockPoints);
  }),

  // Catch bare http://localhost/points (some axios configs use this exact base)
  rest.get((req) => {
    try {
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /^https?:\/\/localhost(:\d+)?\/points(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockPoints);
  }),
  
  // شركات
  rest.get('/api/companies', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockCompanies);
  }),
  
  // مركبات
  rest.get('/api/vehicles', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    // Some tests expect only the "Truck A" / "Truck B" variant for this API.
    const abOnly = mockVehicles.filter(v => v.name === 'Truck A' || v.name === 'Truck B');
    return send(res, ctx, 200, abOnly);
  }),

  // Compatibility: some code calls '/vehicles' without /api prefix.
  rest.get('/vehicles', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockVehicles);
  }),

  // Absolute URL compatibility for vehicles (handle http://[::1]/api/vehicles etc.)
  rest.get((req) => {
    try {
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /https?:\/\/(\[::1\]|localhost|127\.0\.0\.1)(:\d+)?\/(api\/)?vehicles(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockVehicles);
  }),
  
  // طرق الدفع
  rest.get('/api/payment-methods', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
  if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
  return send(res, ctx, 200, mockPaymentMethods);
  }),
  // Compatibility: some code calls '/payment-methods' without /api prefix.
  rest.get('/payment-methods', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockPaymentMethods);
  }),

  // Absolute URL compatibility for payment-methods (http://localhost/payment-methods)
  rest.get((req) => {
    try {
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /https?:\/\/(\[::1\]|localhost|127\.0\.0\.1)(:\d+)?\/payment-methods(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockPaymentMethods);
  }),

  // Compatibility: some older tests hit /api/payments/methods
  rest.get('/api/payments/methods', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    // Return the canonical payment method names in array form to match legacy test expectations
    return send(res, ctx, 200, mockPaymentMethods.map(m => m.name));
  }),

  // GenericScreen test endpoints (success / empty / error)
  rest.get('/api/test', (req, res, ctx) => {
    // Tests may force status via header or query; reuse headerGet logic
    try { const forced = headerGet(req, 'x-msw-force-status'); if (forced && isTestEnv()) return send(res, ctx, parseInt(forced, 10) || 500, {}); } catch (e) {}
    return send(res, ctx, 200, { data: [{ id: 'a', value: 'test item' }] });
  }),

  rest.get('/api/test-empty', (req, res, ctx) => {
    try { const forced = headerGet(req, 'x-msw-force-status'); if (forced && isTestEnv()) return send(res, ctx, parseInt(forced, 10) || 500, {}); } catch (e) {}
    return send(res, ctx, 200, { data: [] });
  }),

  rest.get('/api/test-error', (req, res, ctx) => {
    return send(res, ctx, 500, { error: 'Server error' });
  }),
  
  // طلب الالتقاط (deterministic response for tests)
  rest.post('/api/pickup', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    // Return deterministic requestId and estimatedTime to make tests stable
    return send(res, ctx, 201, { success: true, requestId: 'REQ-12345', estimatedTime: '30 minutes' });
  }),

  // Absolute URL compatibility for pickup POST (http://[::1]/api/pickup)
  rest.post((req) => {
    try {
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /https?:\/\/(\[::1\]|localhost|127\.0\.0\.1)(:\d+)?\/api\/pickup(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 201, { success: true, requestId: 'REQ-12345', estimatedTime: '30 minutes' });
  }),

  // Mock pickup schedule endpoint used by frontend components/tests
  rest.get('/api/pickups/schedule', async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(200);
    return send(res, ctx, 200, { upcoming: [ { id: 101, date: '2025-10-01T09:00:00Z', status: 'scheduled', address: '123 Main St' }, { id: 102, date: '2025-10-05T14:00:00Z', status: 'scheduled', address: '456 Oak Ave' } ], past: [ { id: 51, date: '2025-09-01T09:00:00Z', status: 'completed', address: '789 Pine Rd' } ] });
  })

  ,

  // Available time slots used by the RequestPickup screen. Some clients
  // (Node axios adapters) may request the absolute URL (http://[::1]/api/pickups/timeslots)
  // so provide both the relative handler and a predicate-based absolute-URL
  // handler to ensure MSW intercepts in all environments.
  rest.get('/api/pickups/timeslots', async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    // small delay to mimic network latency and allow loading states in tests
    await delay(50);
    const today = new Date().toISOString().split('T')[0];
    const slots = [
      { date: today, slots: [ { id: '09:00-12:00', name: 'Morning' }, { id: '13:00-16:00', name: 'Afternoon' } ] },
      { date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })(), slots: [ { id: '09:00-12:00', name: 'Morning' }, { id: '13:00-16:00', name: 'Afternoon' } ] }
    ];
    return send(res, ctx, 200, slots);
  }),

  // Absolute URL compatibility for pickups timeslots (http://[::1]/api/pickups/timeslots)
  rest.get((req) => {
    try {
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /https?:\/\/(\[::1\]|localhost|127\.0\.0\.1)(:\d+)?\/api\/pickups\/timeslots(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(50);
    const today = new Date().toISOString().split('T')[0];
    const slots = [
      { date: today, slots: [ { id: '09:00-12:00', name: 'Morning' }, { id: '13:00-16:00', name: 'Afternoon' } ] },
      { date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })(), slots: [ { id: '09:00-12:00', name: 'Morning' }, { id: '13:00-16:00', name: 'Afternoon' } ] }
    ];
    return send(res, ctx, 200, slots);
  }),

  // Compatibility: some frontend code calls the non-/api prefixed path
  // '/pickups/timeslots' (see pickup.service.getAvailableTimeSlots). Mock
  // that path as well so both /pickups/... and /api/pickups/... are covered.
  rest.get('/pickups/timeslots', async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(50);
    const today = new Date().toISOString().split('T')[0];
    const slots = [
      { date: today, slots: [ { id: '09:00-12:00', name: 'Morning' }, { id: '13:00-16:00', name: 'Afternoon' } ] },
      { date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })(), slots: [ { id: '09:00-12:00', name: 'Morning' }, { id: '13:00-16:00', name: 'Afternoon' } ] }
    ];
    return send(res, ctx, 200, slots);
  }),

  // Absolute URL compatibility for non-/api pickups timeslots
  rest.get((req) => {
    try {
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /https?:\/\/(\[::1\]|localhost|127\.0\.0\.1)(:\d+)?\/pickups\/timeslots(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(50);
    const today = new Date().toISOString().split('T')[0];
    const slots = [
      { date: today, slots: [ { id: '09:00-12:00', name: 'Morning' }, { id: '13:00-16:00', name: 'Afternoon' } ] },
      { date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })(), slots: [ { id: '09:00-12:00', name: 'Morning' }, { id: '13:00-16:00', name: 'Afternoon' } ] }
    ];
    return send(res, ctx, 200, slots);
  }),

  // POST handler for API v1 pickups endpoint. Some codepaths use the
  // /api/v1 prefix (or include an absolute host), so provide both a
  // relative path handler and a predicate-based absolute-URL handler.
  rest.post('/api/v1/pickups', async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    // simulate a small processing delay
    await delay(30);
    return send(res, ctx, 201, { success: true, requestId: 'REQ-12345', estimatedTime: '30 minutes' });
  }),

  // Compatibility: frontend services call '/pickups' (no /api prefix)
  // Provide GET and POST handlers so api.getPickups() and api.createPickup()
  // are intercepted regardless of baseURL shape used in tests.
  rest.get('/pickups', async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(50);
    // Return a small deterministic set that tests can rely on
    return send(res, ctx, 200, [ { id: 1, type: 'paper', status: 'scheduled' } ]);
  }),

  // Absolute URL compatibility for GET /pickups (http://localhost/pickups)
  rest.get((req) => {
    try {
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /https?:\/\/(\[::1\]|localhost|127\.0\.0\.1)(:\d+)?\/pickups(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(50);
    return send(res, ctx, 200, [ { id: 1, type: 'paper', status: 'scheduled' } ]);
  }),

  // POST /pickups - used by frontend api.createPickup
  rest.post('/pickups', async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    const body = await readBody(req);
    await delay(30);
    const created = Object.assign({ id: Date.now(), requestId: 'REQ-12345', estimatedTime: '30 minutes' }, body || {});
    return send(res, ctx, 201, created);
  }),

  // Absolute URL compatibility for POST /pickups (http://localhost/pickups)
  rest.post((req) => {
    try {
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /https?:\/\/(\[::1\]|localhost|127\.0\.0\.1)(:\d+)?\/pickups(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    const body = await readBody(req);
    await delay(30);
    const created = Object.assign({ id: Date.now(), requestId: 'REQ-12345', estimatedTime: '30 minutes' }, body || {});
    return send(res, ctx, 201, created);
  }),

  // Regex-based handler to match both absolute and relative URLs ending with /api/v1/pickups
  rest.post(/\/api\/v1\/pickups$/, async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(30);
    return send(res, ctx, 201, { success: true, requestId: 'REQ-12345', estimatedTime: '30 minutes' });
  }),

  // Absolute URL compatibility for POST /api/v1/pickups
  rest.post((req) => {
    try {
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /https?:\/\/(\[::1\]|localhost|127\.0\.0\.1)(:\d+)?\/api\/v1\/pickups(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(30);
    return send(res, ctx, 201, { success: true, requestId: 'REQ-12345', estimatedTime: '30 minutes' });
  }),

  // Absolute URL compatibility for pickups schedule (http://[::1]/api/pickups/schedule)
  rest.get((req) => {
    try {
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /https?:\/\/(\[::1\]|localhost|127\.0\.0\.1)(:\d+)?\/api\/pickups\/schedule(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(200);
    return send(res, ctx, 200, { upcoming: [ { id: 101, date: '2025-10-01T09:00:00Z', status: 'scheduled', address: '123 Main St' }, { id: 102, date: '2025-10-05T14:00:00Z', status: 'scheduled', address: '456 Oak Ave' } ], past: [ { id: 51, date: '2025-09-01T09:00:00Z', status: 'completed', address: '789 Pine Rd' } ] });
  })

  ,

  // Compatibility: handle '/pickups/schedule' (no /api prefix)
  rest.get('/pickups/schedule', async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(200);
    return send(res, ctx, 200, { upcoming: [ { id: 101, date: '2025-10-01T09:00:00Z', status: 'scheduled', address: '123 Main St' }, { id: 102, date: '2025-10-05T14:00:00Z', status: 'scheduled', address: '456 Oak Ave' } ], past: [ { id: 51, date: '2025-09-01T09:00:00Z', status: 'completed', address: '789 Pine Rd' } ] });
  }),

  // Absolute URL compatibility for GET /pickups/schedule (http://localhost/pickups/schedule)
  rest.get((req) => {
    try {
      const reqUrlObj = (req && req.request && req.request.url) ? req.request.url : req.url;
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /https?:\/\/(\[::1\]|localhost|127\.0\.0\.1)(:\d+)?\/pickups\/schedule(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(200);
    return send(res, ctx, 200, { upcoming: [ { id: 101, date: '2025-10-01T09:00:00Z', status: 'scheduled', address: '123 Main St' }, { id: 102, date: '2025-10-05T14:00:00Z', status: 'scheduled', address: '456 Oak Ave' } ], past: [ { id: 51, date: '2025-09-01T09:00:00Z', status: 'completed', address: '789 Pine Rd' } ] });
  }),
];

// Export as ESM so Vite/Vitest import() resolves this module consistently
// across setup files and test files.
export { handlers };
export default { handlers };