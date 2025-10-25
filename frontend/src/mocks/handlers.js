// Handlers module for MSW used during tests.
// All handler definitions are wrapped in the handlers array and exported.
/**
 * Handlers module for MSW used during tests.
 * JSDoc hints below reduce TypeScript noise while keeping the file
 * flexible for multiple runtime request shapes (node-fetch, undici,
 * msw v2/v3 differences). Prefer narrow types when possible but allow
 * `any` for runtime request shapes that static analysis cannot model.
 */
/**
 * @typedef {{ href?: string, pathname?: string, toString?: function }} UrlLike
 * @typedef {{ url?: UrlLike, json?: function, text?: function, formData?: function, clone?: function, headers?: any, path?: string }} RequestLike
 * @typedef {{ _raw?: string, username?: string, email?: string, password?: string }} BodyLike
 * @typedef {{ request?: RequestLike, url?: UrlLike, body?: any, headers?: any, path?: string }} ReqShape
 * @typedef {Function} ResFn
 * @typedef {any} CtxShape
 */
/* eslint-disable no-empty, no-useless-catch */
// msw v2 exports HTTP handlers under `http` in the core package.
// Alias it to `rest` to preserve the familiar handler API used across the tests.
import { http } from 'msw';
import { logError } from '../logError';

// Diagnostic logger (strictly opt-in). Only log when MSW_DEBUG is explicitly
// enabled as the string 'true' or when globalThis.__MSW_DEBUG__ is true.
const _isMswDebug = () => {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.__MSW_DEBUG__ === true) return true;
    if (typeof process !== 'undefined' && process.env && String(process.env.MSW_DEBUG) === 'true') return true;
  } catch (e) {}
  return false;
};
const mswDiag = (...a) => { try { if (!_isMswDebug()) return; try { require('../utils/logger').debug(...a); } catch (e) { void e; } } catch (e) {} };
// small helper to get the request URL object/string in a safe way
const getReqUrl = (req) => {
  try { return (req && req.request && req.request.url) ? req.request.url : req.url; } catch (e) { return undefined; }
};
const getHref = (req) => {
  try { const u = getReqUrl(req); return u && (u.href || (typeof u.toString === 'function' ? u.toString() : String(u))); } catch (e) { return undefined; }
};
const getPath = (req) => {
  try {
    const maybeReq = req && (req.request || req);
    if (!maybeReq) return undefined;
    if (maybeReq.path) return maybeReq.path;
    if (maybeReq.url && maybeReq.url.pathname) return maybeReq.url.pathname;
    const ru = getReqUrl(req);
    if (ru && ru.pathname) return ru.pathname;
    return undefined;
  } catch (e) { return undefined; }
};

// Diagnostic instrumentation: mark when this module executes and record
// a small summary to globalThis so the test probe can assert the import
// ordering and which msw core instance this handler module referenced.
try {
  // set global markers readable by the server probe
  try { if (typeof globalThis !== 'undefined') globalThis.__MSW_HANDLERS_IMPORTED__ = true; } catch (e) {}
  try { if (typeof globalThis !== 'undefined') globalThis.__MSW_HANDLERS_IMPORT_INFO__ = { type: 'http', keys: Object.keys(http || {}).slice(0, 10) }; } catch (e) {}
  // store a short stringified preview of handlers variable when defined later
  try { if (typeof globalThis !== 'undefined') globalThis.__MSW_HANDLERS_RAW_PREVIEW__ = globalThis.__MSW_HANDLERS_RAW_PREVIEW__ || null; } catch (e) {}
  mswDiag('MSW-DIAG: handlers.js executed; core.type=http');
} catch (e) {}

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
  "Visa",
  "MasterCard",
  "PayPal"
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
export const handlers = [
  // Highest priority /api/points handler with predicate matching
  http.get(
    (req) => {
      try {
        const href = getHref(req) || '';
        const path = getPath(req) || '';
        // Match both relative and absolute URLs for /api/points
        if (path && path.includes('/api/points')) return true;
        if (href && /\/api\/points(\?|$)/i.test(href)) return true;
        if (href && /https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?\/api\/points(\?|$)/i.test(href)) return true;
        return false;
      } catch (e) {
        return false;
      }
    },
    (req, res, ctx) => {
      const authHeader = headerGet(req, 'Authorization');
      // PRIORITY 1: Check x-msw-force-status header
      try {
        let headerForced = null;
        // Try 1: req.headers.get() (Headers object with .get() method)
        if (req.headers && typeof req.headers.get === 'function') {
          headerForced = req.headers.get('x-msw-force-status') || 
                         req.headers.get('X-MSW-Force-Status') ||
                         req.headers.get('X-Msw-Force-Status');
        }
        // Try 2: req.headers plain object access
        if (!headerForced && req.headers && typeof req.headers === 'object') {
          headerForced = req.headers['x-msw-force-status'] || 
                         req.headers['X-MSW-Force-Status'] ||
                         req.headers['X-Msw-Force-Status'] ||
                         req.headers['x_msw_force_status'] ||
                         req.headers['X_MSW_FORCE_STATUS'];
        }
        // Try 3: req.request.headers (nested location in some MSW/Node environments)
        if (!headerForced && req.request && req.request.headers) {
          if (typeof req.request.headers.get === 'function') {
            headerForced = req.request.headers.get('x-msw-force-status') || 
                           req.request.headers.get('X-MSW-Force-Status');
          } else if (typeof req.request.headers === 'object') {
            headerForced = req.request.headers['x-msw-force-status'] || 
                           req.request.headers['X-MSW-Force-Status'] ||
                           req.request.headers['x_msw_force_status'];
          }
        }
        // Comprehensive diagnostic logging (use mswDiag for env-aware output)
        mswDiag('[MSW-DIAG] /api/points - headerForced:', headerForced);
        mswDiag('[MSW-DIAG] /api/points - req.headers type:', typeof req.headers);
        mswDiag('[MSW-DIAG] /api/points - req.headers:', req.headers);
        mswDiag('[MSW-DIAG] /api/points - req.request?.headers type:', typeof req.request?.headers);
        mswDiag('[MSW-DIAG] /api/points - req.request?.headers:', req.request?.headers);
        if (headerForced) {
          const status = parseInt(headerForced, 10) || 500;
          mswDiag('[MSW-DIAG] /api/points - Forcing status:', status);
          return send(res, ctx, status, {});
        }
      } catch (e) { 
        console.log('[MSW-DEBUG] /api/points - Error in header check:', e);
      }
      // PRIORITY 2: Check _msw_force_status query parameter
      try {
        let forced = null;
        const reqUrlObj = getReqUrl(req);
        if (reqUrlObj && typeof reqUrlObj === 'object' && reqUrlObj.searchParams) {
          forced = reqUrlObj.searchParams.get('_msw_force_status');
        } else if (typeof reqUrlObj === 'string') {
          try {
            forced = new URL(reqUrlObj, 'http://localhost').searchParams.get('_msw_force_status');
          } catch (e) {
            forced = null;
          }
        }
        if (!forced && req) {
          try {
            const s = typeof reqUrlObj === 'string' ? reqUrlObj :
                     (reqUrlObj && typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj));
            const m = s.match(/[?&]_msw_force_status=([^&]+)/);
            if (m) forced = m[1];
          } catch (e) { /* ignore */ }
        }
        if (forced && isTestEnv()) {
          const status = parseInt(forced, 10) || 500;
          mswDiag('[MSW-DIAG] /api/points: Forcing status', status, 'via query');
          return send(res, ctx, status, {});
        }
      } catch (e) { /* ignore parsing errors */ }
      // PRIORITY 3: Normal authorization check
      if (!authHeader && !isTestEnv()) {
        return send(res, ctx, 401, {});
      }
      // PRIORITY 4: Return mock data
      return send(res, ctx, 200, mockPoints);
    }
  ),
  // Highest priority: /api/points handler with header override
  // Remove duplicate handlers array declaration. Handlers are already defined and exported at the end of the file.
  // Backend-style login endpoint (for form data)
  // Unified /api/v1/auth/login handler (absolute & relative)
  http.post((req) => {
    try {
      const href = getHref(req) || '';
      const path = getPath(req) || '';
      // Match both relative and absolute URLs for /api/v1/auth/login
      if (path && path.includes('/api/v1/auth/login')) return true;
      if (href && /\/api\/v1\/auth\/login(\?|$)/i.test(href)) return true;
      if (href && /https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?\/api\/v1\/auth\/login(\?|$)/i.test(href)) return true;
      return false;
    } catch (e) { return false; }
  }, async (req, res, ctx) => {
    await delay(500);
    // PRIORITY 1: Header Override
    try {
      let headerForced = null;
      if (req.headers && typeof req.headers.get === 'function') {
        headerForced = req.headers.get('x-msw-force-status') || req.headers.get('X-MSW-Force-Status');
      } else if (req.headers && typeof req.headers === 'object') {
        headerForced = req.headers['x-msw-force-status'] || req.headers['X-MSW-Force-Status'];
      }
      if (!headerForced && req.request && req.request.headers) {
        if (typeof req.request.headers.get === 'function') {
          headerForced = req.request.headers.get('x-msw-force-status');
        } else if (typeof req.request.headers === 'object') {
          headerForced = req.request.headers['x-msw-force-status'];
        }
      }
      if (headerForced) {
        const status = parseInt(headerForced, 10) || 500;
        mswDiag('[MSW-DIAG] /api/v1/auth/login: Forcing status', status, 'via header');
        return res(ctx.status(status), ctx.json({}));
      }
    } catch (e) { /* ignore */ }
    // PRIORITY 2: Query Parameter Override
    try {
      let forced = null;
      const reqUrlObj = getReqUrl(req);
      if (reqUrlObj && typeof reqUrlObj === 'object' && reqUrlObj.searchParams) {
        forced = reqUrlObj.searchParams.get('_msw_force_status');
      } else if (typeof reqUrlObj === 'string') {
        try {
          forced = new URL(reqUrlObj, 'http://localhost').searchParams.get('_msw_force_status');
        } catch (e) {
          forced = null;
        }
      }
      if (!forced && req) {
        try {
          const s = typeof reqUrlObj === 'string' ? reqUrlObj : (reqUrlObj && typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj));
          const m = s.match(/[?&]_msw_force_status=(\d+)/);
          if (m) forced = m[1];
        } catch (e) { /* ignore */ }
      }
      if (forced) {
        const status = parseInt(forced, 10) || 500;
        mswDiag('[MSW-DIAG] /api/v1/auth/login: Forcing status', status, 'via query');
        return res(ctx.status(status), ctx.json({}));
      }
    } catch (e) { /* ignore */ }
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
      if (body && typeof body === 'object' && !(/** @type {BodyLike} */ (body))._raw) {
        /** @type {BodyLike} */ const b = /** @type {BodyLike} */ (body);
        username = b.username || b.email || null;
        password = b.password || null;
      } else if (typeof body === 'string') {
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
      mswDiag('DIAG auth v1 parsed', { username, password, rawBody });
    } catch (e) {}
    if (!user || user.password !== password) {
      return send(res, ctx, 401, { detail: 'Incorrect username or password' });
    }
    const token = 'mock-jwt-token-' + Math.random().toString(36).substring(2, 10);
    return res(ctx.status(200), ctx.json({ access_token: token, token_type: 'bearer', user: { id: user.id, name: user.name, email: user.email, role: user.id === 3 ? 'admin' : 'user' } }));
  }),
  
  // Unified /api/auth/login handler (absolute & relative)
  http.post((req) => {
    try {
      const href = getHref(req) || '';
      const path = getPath(req) || '';
      // Match both relative and absolute URLs for /api/auth/login
      if (path && path.includes('/api/auth/login')) return true;
      if (href && /\/api\/auth\/login(\?|$)/i.test(href)) return true;
      if (href && /https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?\/api\/auth\/login(\?|$)/i.test(href)) return true;
      return false;
    } catch (e) { return false; }
  }, async (req, res, ctx) => {
    await delay(500);
    // PRIORITY 1: Header Override
    try {
      let headerForced = null;
      if (req.headers && typeof req.headers.get === 'function') {
        headerForced = req.headers.get('x-msw-force-status') || req.headers.get('X-MSW-Force-Status');
      } else if (req.headers && typeof req.headers === 'object') {
        headerForced = req.headers['x-msw-force-status'] || req.headers['X-MSW-Force-Status'];
      }
      if (!headerForced && req.request && req.request.headers) {
        if (typeof req.request.headers.get === 'function') {
          headerForced = req.request.headers.get('x-msw-force-status');
        } else if (typeof req.request.headers === 'object') {
          headerForced = req.request.headers['x-msw-force-status'];
        }
      }
      if (headerForced) {
        const status = parseInt(headerForced, 10) || 500;
        mswDiag('[MSW-DIAG] /api/auth/login: Forcing status', status, 'via header');
        return res(ctx.status(status), ctx.json({}));
      }
    } catch (e) { /* ignore */ }
    // PRIORITY 2: Query Parameter Override
    try {
      let forced = null;
      const reqUrlObj = getReqUrl(req);
      if (reqUrlObj && typeof reqUrlObj === 'object' && reqUrlObj.searchParams) {
        forced = reqUrlObj.searchParams.get('_msw_force_status');
      } else if (typeof reqUrlObj === 'string') {
        try {
          forced = new URL(reqUrlObj, 'http://localhost').searchParams.get('_msw_force_status');
        } catch (e) {
          forced = null;
        }
      }
      if (!forced && req) {
        try {
          const s = typeof reqUrlObj === 'string' ? reqUrlObj : (reqUrlObj && typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj));
          const m = s.match(/[?&]_msw_force_status=(\d+)/);
          if (m) forced = m[1];
        } catch (e) { /* ignore */ }
      }
      if (forced) {
        const status = parseInt(forced, 10) || 500;
        mswDiag('[MSW-DIAG] /api/auth/login: Forcing status', status, 'via query');
        return res(ctx.status(status), ctx.json({}));
      }
    } catch (e) { /* ignore */ }
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
      try { logError('GLOBAL MSW: /api/auth/login handler error', err && err.message ? err.message : err); } catch (e) {}
      return send(res, ctx, 500, { message: 'handler error' });
    }
  }),
  
  // التسجيل
  http.post('/api/auth/register', async (req, res, ctx) => {
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
  http.post('/api/v1/auth/register', async (req, res, ctx) => {
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
  http.get('/api/v1/auth/me', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) {
      return res(ctx.status(401), ctx.json({}));
    }
    const user = mockUsers[1];
    return res(ctx.status(200), ctx.json({ id: user.id, name: user.name, email: user.email, role: user.id === 3 ? 'admin' : 'user' }));
  }),
  
  // Original "me" endpoint (for compatibility)
  http.get('/api/auth/me', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if ((!authHeader || !authHeader.startsWith('Bearer ')) && !isTestEnv()) {
      return res(ctx.status(401), ctx.json({}));
    }
    const user = mockUsers[0];
    return res(ctx.status(200), ctx.json({ id: user.id, name: user.name, email: user.email }));
  }),
  
  // تسجيل الخروج
  http.post('/api/auth/logout', (req, res, ctx) => res(ctx.status(200), ctx.json({ message: 'تم تسجيل الخروج بنجاح' }))),
  
  // إضافة ال Authorization Header requirement للـ API الأخرى
  // Compatibility: some tests or services call '/points' (without /api prefix)
  // Ensure those requests are also mocked so tests don't hit a real server.
  http.get('/points', (req, res, ctx) => {
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
  http.get((req) => {
    try {
      const reqUrlObj = getReqUrl(req);
      const href = getHref(req);
      if (!href) return false;
      // Match /api/points on common loopback hosts (accept [::1] or ::1)
      return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/api\/points(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, (req, res, ctx) => {
    // Enforce header override logic for absolute URLs
    let headerForced = null;
    if (req.headers && typeof req.headers.get === 'function') {
      headerForced = req.headers.get('x-msw-force-status') || req.headers.get('X-MSW-Force-Status');
    } else if (req.headers && typeof req.headers === 'object') {
      headerForced = req.headers['x-msw-force-status'] || req.headers['X-MSW-Force-Status'] || req.headers['X-msw-force-status'];
    }
    if (headerForced && isTestEnv()) {
      return res(ctx.status(500), ctx.json({}));
    }
    let forced = null;
    const reqUrlObj = getReqUrl(req);
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
      return res(ctx.status(status), ctx.json({}));
    }
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockPoints);
  }),

  // Absolute URL compatibility for non-/api points (http://localhost/points)
  http.get((req) => {
    try {
  const reqUrlObj = getReqUrl(req);
  const href = getHref(req);
      if (!href) return false;
  return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/points(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockPoints);
  }),

  // Points history endpoint (some components call /api/points/history or /points/history)
  http.get('/api/points/history', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    // Return a deterministic history array for tests
    const history = [ { id: 1, date: '2025-09-01', points: 10 }, { id: 2, date: '2025-09-10', points: 5 } ];
    return send(res, ctx, 200, { history });
  }),

  http.get('/points/history', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    const history = [ { id: 1, date: '2025-09-01', points: 10 } ];
    return send(res, ctx, 200, { history });
  }),

  // Absolute URL compatibility for points history (http://localhost/api/points/history)
  http.get((req) => {
    try {
      const href = getHref(req);
      if (!href) return false;
      return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\\d+)?\/api\/points\/history(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    const history = [ { id: 1, date: '2025-09-01', points: 10 } ];
    return send(res, ctx, 200, { history });
  }),

  // Points impact endpoint (some components call /api/points/impact or /points/impact)
  http.get('/api/points/impact', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    const impact = { total: '~1.3kg CO₂', breakdown: [ { category: 'paper', saved: '~0.8kg' } ] };
    return send(res, ctx, 200, { impact });
  }),

  http.get('/points/impact', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    const impact = { total: '~1.3kg CO₂' };
    return send(res, ctx, 200, { impact });
  }),

  // Absolute URL compatibility for points impact (http://localhost/api/points/impact)
  http.get((req) => {
    try {
      const href = getHref(req);
      if (!href) return false;
      return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\\d+)?\/api\/points\/impact(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    const impact = { total: '~1.3kg CO₂' };
    return send(res, ctx, 200, { impact });
  }),

  // Catch bare http://localhost/points (some axios configs use this exact base)
  http.get((req) => {
    try {
  const reqUrlObj = getReqUrl(req);
  const href = getHref(req);
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
  // Intercept both relative and absolute URLs for /api/companies with override logic
  http.get(
    (req) => {
      try {
        const href = getHref(req);
        if (!href) return false;
        // Match /api/companies on any host (localhost, ::1, etc.)
        return /(?:^\/api\/companies$)|(?:https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/api\/companies(\?|$))/i.test(href);
      } catch (e) { return false; }
    },
    (req, res, ctx) => {
      try {
        // Override logic
        let headerForced = headerGet(req, 'x-msw-force-status') || headerGet(req, 'X-MSW-Force-Status');
        if (headerForced && isTestEnv()) {
          const status = parseInt(headerForced, 10) || 500;
          return send(res, ctx, status, {});
        }
        let forced = null;
        const reqUrlObj = getReqUrl(req);
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
        const authHeader = headerGet(req, 'Authorization');
        if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
        return send(res, ctx, 200, mockCompanies);
      } catch (e) { return send(res, ctx, 500, {}); }
    }
  ),
  
  // Unified /api/vehicles handler (absolute & relative)
  http.get((req) => {
    try {
      const href = getHref(req) || '';
      const path = getPath(req) || '';
      // Match both relative and absolute URLs for /api/vehicles
      if (path && path.includes('/api/vehicles')) return true;
      if (href && /\/api\/vehicles(\?|$)/i.test(href)) return true;
      if (href && /https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?\/api\/vehicles(\?|$)/i.test(href)) return true;
      return false;
    } catch (e) { return false; }
  }, (req, res, ctx) => {
    // PRIORITY 1: Header Override
    try {
      let headerForced = null;
      if (req.headers && typeof req.headers.get === 'function') {
        headerForced = req.headers.get('x-msw-force-status') || req.headers.get('X-MSW-Force-Status');
      } else if (req.headers && typeof req.headers === 'object') {
        headerForced = req.headers['x-msw-force-status'] || req.headers['X-MSW-Force-Status'];
      }
      if (!headerForced && req.request && req.request.headers) {
        if (typeof req.request.headers.get === 'function') {
          headerForced = req.request.headers.get('x-msw-force-status');
        } else if (typeof req.request.headers === 'object') {
          headerForced = req.request.headers['x-msw-force-status'];
        }
      }
      if (headerForced) {
        const status = parseInt(headerForced, 10) || 500;
        mswDiag('[MSW-DIAG] /api/vehicles: Forcing status', status, 'via header');
        return res(ctx.status(status), ctx.json({}));
      }
    } catch (e) { /* ignore */ }
    // PRIORITY 2: Query Parameter Override
    try {
      let forced = null;
      const reqUrlObj = getReqUrl(req);
      if (reqUrlObj && typeof reqUrlObj === 'object' && reqUrlObj.searchParams) {
        forced = reqUrlObj.searchParams.get('_msw_force_status');
      } else if (typeof reqUrlObj === 'string') {
        try {
          forced = new URL(reqUrlObj, 'http://localhost').searchParams.get('_msw_force_status');
        } catch (e) {
          forced = null;
        }
      }
      if (!forced && req) {
        try {
          const s = typeof reqUrlObj === 'string' ? reqUrlObj : (reqUrlObj && typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj));
          const m = s.match(/[?&]_msw_force_status=(\d+)/);
          if (m) forced = m[1];
        } catch (e) { /* ignore */ }
      }
      if (forced) {
        const status = parseInt(forced, 10) || 500;
        mswDiag('[MSW-DIAG] /api/vehicles: Forcing status', status, 'via query');
        return res(ctx.status(status), ctx.json({}));
      }
    } catch (e) { /* ignore */ }
    // PRIORITY 3: Auth check
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    // PRIORITY 4: Return mock data
    return send(res, ctx, 200, mockVehicles);
  }),

  // Compatibility: some code calls '/vehicles' without /api prefix.
  http.get('/vehicles', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockVehicles);
  }),

  // Absolute URL compatibility for vehicles (handle http://[::1]/api/vehicles etc.)
  http.get((req) => {
    try {
  const reqUrlObj = getReqUrl(req);
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
  return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/(api\/)?vehicles(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
  // For absolute-URL requests return the canonical vehicle set so
  // tests that expect either naming variant receive the full list.
  return send(res, ctx, 200, mockVehicles);
  }),
  
  // طرق الدفع (Payment Methods)
  // Dedicated absolute URL handler for /api/payment-methods (IPv6/localhost/127.0.0.1) - updated to include more detailed logging
  http.get((req) => {
    try {
      const href = getHref(req);
      const path = getPath(req);
      // Match both relative and absolute URLs
      if (path === '/api/payment-methods') return true;
      if (href && (/\/api\/payment-methods(\?|$)/i.test(href) || /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/api\/payment-methods(\?|$)/i.test(href))) return true;
      return false;
    } catch (e) { return false; }
  }, (req, res, ctx) => {
  // Always return 200 and valid body for payment methods
  return send(res, ctx, 200, mockPaymentMethods);
  }),
// Dedicated absolute URL handler for /api/points (IPv6/localhost/127.0.0.1) with header override
http.get((req) => {
  try {
    const href = getHref(req);
    if (!href) return false;
    return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/api\/points(\?|$)/i.test(href);
  } catch (e) { return false; }
}, (req, res, ctx) => {
  const authHeader = headerGet(req, 'Authorization');
  try {
    let headerForced = null;
    if (req.headers && typeof req.headers.get === 'function') {
      headerForced = req.headers.get('x-msw-force-status');
    } else if (req.headers && typeof req.headers === 'object') {
      headerForced = req.headers['x-msw-force-status'] || req.headers['X-MSW-Force-Status'];
    }
    if (headerForced && isTestEnv()) {
      const status = parseInt(headerForced, 10) || 500;
      return jsonResponse({}, status);
    }
    let forced = null;
    const reqUrlObj = getReqUrl(req);
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
      return jsonResponse({}, status);
    }
  } catch (e) { /* ignore parsing errors */ }
  if ((headerGet(req, 'x-msw-force-status') || headerGet(req, 'X-MSW-Force-Status')) && isTestEnv()) {
    const status = parseInt(headerGet(req, 'x-msw-force-status') || headerGet(req, 'X-MSW-Force-Status'), 10) || 500;
    return jsonResponse({}, status);
  }
  if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
  return send(res, ctx, 200, mockPoints);
}),
  // Intercept both relative and absolute URLs for /api/payment-methods
  http.get((req) => {
    try {
      const href = getHref(req);
      if (!href) return false;
      // Match /api/payment-methods on any host (localhost, ::1, etc.)
      return /(?:^\/api\/payment-methods$)|(?:https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/api\/payment-methods(\?|$))/i.test(href);
    } catch (e) { return false; }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    try { mswDiag('MSW-DIAG: /api/payment-methods invoked; href=', getHref(req)); } catch (e) {}
    return send(res, ctx, 200, mockPaymentMethods);
  }),
  // Compatibility: some code calls '/payment-methods' without /api prefix. - ensure both paths are handled
  http.get('/payment-methods', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockPaymentMethods);
  }),

  // Absolute URL compatibility for payment-methods (http://localhost/payment-methods)
  // Absolute URL compatibility for payments/methods (http://localhost/payments/methods)
  http.get((req) => {
    try {
      const href = getHref(req);
      try { mswDiag('MSW-DIAG: payments/methods absolute predicate sees href=', href); } catch (e) {}
      if (!href) return false;
      const matched = /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/payments\/methods(\?|$)/i.test(href);
      try { mswDiag('MSW-DIAG: payments/methods absolute predicate regex matched=', matched); } catch (e) {}
      return matched;
    } catch (e) {
      return false;
    }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    try { mswDiag('MSW-DIAG: absolute payments/methods predicate invoked; href=', getHref(req)); } catch (e) {}
    return send(res, ctx, 200, mockPaymentMethods);
  }),

  // Node/axios adapter shapes: some requests expose a `request.path` or
  // `request` object with path property instead of a clean url.href string.
  // Add targeted predicate handlers that look for those shapes and match
  // the common endpoints directly to avoid falling through to the safety-net.
  http.get((req) => {
    try {
      const path = getPath(req);
      try { mswDiag('MSW-DIAG: adapter-shaped payments/methods predicate sees path=', path); } catch (e) {}
      if (!path) return false;
      return path === '/api/payments/methods' || path === '/payments/methods';
    } catch (e) { return false; }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, mockPaymentMethods);
  }),

  // (removed permissive diagnostic predicate) - use the explicit relative
  // and absolute predicates above for payment-methods. Keeping diagnostics
  // gated by MSW_DEBUG in the dedicated handlers.

  // Compatibility: some older tests hit /api/payments/methods
  http.get('/api/payments/methods', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
  // Always return the full payment methods array for consistency
  return send(res, ctx, 200, mockPaymentMethods);
  }),

  // GenericScreen test endpoints (success / empty / error)
  http.get('/api/test', (req, res, ctx) => {
    // Tests may force status via header or query; reuse headerGet logic
    try { const forced = headerGet(req, 'x-msw-force-status'); if (forced && isTestEnv()) return send(res, ctx, parseInt(forced, 10) || 500, {}); } catch (e) {}
    return send(res, ctx, 200, { data: [{ id: 'a', value: 'test item' }] });
  }),

  http.get('/api/test-empty', (req, res, ctx) => {
    try { const forced = headerGet(req, 'x-msw-force-status'); if (forced && isTestEnv()) return send(res, ctx, parseInt(forced, 10) || 500, {}); } catch (e) {}
    return send(res, ctx, 200, { data: [] });
  }),

  http.get('/api/test-error', (req, res, ctx) => {
    return send(res, ctx, 500, { error: 'Server error' });
  }),
  
  // طلب الالتقاط (deterministic response for tests)
  http.post('/api/pickup', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    // Return deterministic requestId and estimatedTime to make tests stable
    return send(res, ctx, 201, { success: true, requestId: 'REQ-12345', estimatedTime: '30 minutes' });
  }),

  // Absolute URL compatibility for pickup POST (http://[::1]/api/pickup)
  http.post((req) => {
    try {
  const href = getHref(req);
      if (!href) return false;
  return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/api\/pickup(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 201, { success: true, requestId: 'REQ-12345', estimatedTime: '30 minutes' });
  }),

  // Node/axios adapter shapes for pickups (GET/POST): match request.path
  http.get((req) => {
    try {
    const path = getPath(req);
  try { mswDiag('MSW-DIAG: adapter-shaped pickups GET predicate sees path=', path); } catch (e) {}
      if (!path) return false;
      return path === '/api/pickups' || path === '/pickups' || path === '/api/pickups/schedule' || path === '/pickups/schedule';
    } catch (e) { return false; }
  }, async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(50);
    return send(res, ctx, 200, [ { id: 1, type: 'paper', status: 'scheduled' } ]);
  }),

  http.post((req) => {
    try {
    const path = getPath(req);
  try { mswDiag('MSW-DIAG: adapter-shaped pickups POST predicate sees path=', path); } catch (e) {}
      if (!path) return false;
      return path === '/api/pickups' || path === '/pickups' || path === '/api/v1/pickups';
    } catch (e) { return false; }
  }, async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    const body = await readBody(req);
    await delay(30);
    const created = Object.assign({ id: Date.now(), requestId: 'REQ-12345', estimatedTime: '30 minutes' }, body || {});
    return send(res, ctx, 201, created);
  }),

  // Mock pickup schedule endpoint used by frontend components/tests
  http.get('/api/pickups/schedule', async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(200);
    return send(res, ctx, 200, { upcoming: [ { id: 101, date: '2025-10-01T09:00:00Z', status: 'scheduled', address: '123 Main St' }, { id: 102, date: '2025-10-05T14:00:00Z', status: 'scheduled', address: '456 Oak Ave' } ], past: [ { id: 51, date: '2025-09-01T09:00:00Z', status: 'completed', address: '789 Pine Rd' } ] });
  }),

  // Available time slots used by the RequestPickup screen. Some clients
  // (Node axios adapters) may request the absolute URL (http://[::1]/api/pickups/timeslots)
  // so provide both the relative handler and a predicate-based absolute-URL
  // handler to ensure MSW intercepts in all environments.
  http.get('/api/pickups/timeslots', async (req, res, ctx) => {
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
  http.get((req) => {
    try {
  const href = getHref(req);
      if (!href) return false;
  return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/api\/pickups\/timeslots(\?|$)/i.test(href);
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
  http.get('/pickups/timeslots', async (req, res, ctx) => {
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
  http.get((req) => {
    try {
  const reqUrlObj = getReqUrl(req);
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
  return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/pickups\/timeslots(\?|$)/i.test(href);
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
  http.post('/api/v1/pickups', async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    // simulate a small processing delay
    await delay(30);
    return send(res, ctx, 201, { success: true, requestId: 'REQ-12345', estimatedTime: '30 minutes' });
  }),

  // Compatibility: frontend services call '/pickups' (no /api prefix)
  // Provide GET and POST handlers so api.getPickups() and api.createPickup()
  // are intercepted regardless of baseURL shape used in tests.
  http.get('/pickups', async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(50);
    // Return a small deterministic set that tests can rely on
    return send(res, ctx, 200, [ { id: 1, type: 'paper', status: 'scheduled' } ]);
  }),

  // Absolute URL compatibility for GET /pickups (http://localhost/pickups)
  http.get((req) => {
    try {
  const reqUrlObj = getReqUrl(req);
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
  return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/pickups(\?|$)/i.test(href);
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
  http.post('/pickups', async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    const body = await readBody(req);
    await delay(30);
    const created = Object.assign({ id: Date.now(), requestId: 'REQ-12345', estimatedTime: '30 minutes' }, body || {});
    return send(res, ctx, 201, created);
  }),

  // Absolute URL compatibility for POST /pickups (http://localhost/pickups)
  http.post((req) => {
    try {
  const reqUrlObj = getReqUrl(req);
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
  return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/pickups(\?|$)/i.test(href);
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
  http.post(/\/api\/v1\/pickups$/, async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(30);
    return send(res, ctx, 201, { success: true, requestId: 'REQ-12345', estimatedTime: '30 minutes' });
  }),

  // Absolute URL compatibility for POST /api/v1/pickups
  http.post((req) => {
    try {
  const reqUrlObj = getReqUrl(req);
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
  return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/api\/v1\/pickups(\?|$)/i.test(href);
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
  http.get((req) => {
    try {
  const reqUrlObj = getReqUrl(req);
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
  return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/api\/pickups\/schedule(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(200);
    return send(res, ctx, 200, { upcoming: [ { id: 101, date: '2025-10-01T09:00:00Z', status: 'scheduled', address: '123 Main St' }, { id: 102, date: '2025-10-05T14:00:00Z', status: 'scheduled', address: '456 Oak Ave' } ], past: [ { id: 51, date: '2025-09-01T09:00:00Z', status: 'completed', address: '789 Pine Rd' } ] });
  }),

  // Compatibility: handle '/pickups/schedule' (no /api prefix)
  http.get('/pickups/schedule', async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(200);
    return send(res, ctx, 200, { upcoming: [ { id: 101, date: '2025-10-01T09:00:00Z', status: 'scheduled', address: '123 Main St' }, { id: 102, date: '2025-10-05T14:00:00Z', status: 'scheduled', address: '456 Oak Ave' } ], past: [ { id: 51, date: '2025-09-01T09:00:00Z', status: 'completed', address: '789 Pine Rd' } ] });
  }),

  // Notifications: unread count and list. Some UI components call absolute
  // URLs like http://localhost/api/notifications/unread or /notifications/unread
  http.get('/api/notifications/unread', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { unread: 0 });
  }),

  http.get('/notifications/unread', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { unread: 0 });
  }),

  // Absolute-URL predicate for notifications/unread
  http.get((req) => {
    try {
  const reqUrlObj = getReqUrl(req);
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
  return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/(?:api\/)?notifications\/unread(\?|$)/i.test(href);
    } catch (e) { return false; }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { unread: 0 });
  }),

  // Notifications list (recent)
  http.get('/api/notifications', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { notifications: [] });
  }),

  // Unread-count endpoints: frontend calls /notifications/unread-count
  // and sometimes uses absolute URLs like http://localhost/notifications/unread-count
  http.get('/notifications/unread-count', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { count: 0 });
  }),

  http.get('/api/notifications/unread-count', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { count: 0 });
  }),

  // Absolute-URL compatibility for unread-count endpoints
  http.get((req) => {
    try {
  const reqUrlObj = getReqUrl(req);
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /https?:\/\/(?:\[::1\]|localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?\/(?:api\/)?notifications\/unread-count(\?|$)/i.test(href);
    } catch (e) { return false; }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { count: 0 });
  }),

  // Absolute URL compatibility for notifications list (cover host variants)
  http.get((req) => {
    try {
  const reqUrlObj = getReqUrl(req);
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
      return /https?:\/\/(?:\[::1\]|localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?\/(?:api\/)?notifications(\?|$)/i.test(href);
    } catch (e) { return false; }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { notifications: [] });
  }),

  // Metrics endpoints used by dashboard widgets. Provide deterministic
  // responses and absolute-URL handlers so tests don't attempt real network
  // calls and don't fail on missing metrics services.
  http.get('/api/metrics/redis', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { status: 'ok', used: 12345 });
  }),

  http.get((req) => {
    try {
  const reqUrlObj = getReqUrl(req);
      const href = reqUrlObj && (reqUrlObj.href || (typeof reqUrlObj.toString === 'function' ? reqUrlObj.toString() : String(reqUrlObj)));
      if (!href) return false;
  return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/api\/metrics\/redis(\?|$)/i.test(href);
    } catch (e) { return false; }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { status: 'ok', used: 12345 });
  }),

  // Broader catch-all predicate for common metrics endpoints and telemetry
  http.get((req) => {
    try {
        const reqUrlObj = getReqUrl(req);
        const href = getHref(req);
        if (!href) return false;
        // match endpoints used by dashboard widgets (redis, prometheus-like, metrics)
        return /https?:\/\/(?:\[::1\]|localhost|127\.0\.0\.1|0\.0\.0\.0)(:\\d+)?\/(?:api\/)?(metrics|metrics\/redis|metrics\/prometheus|telemetry)(\?|$)/i.test(href);
      } catch (e) { return false; }
  }, (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { status: 'ok', used: 0, details: {} });
  }),

  // Specific metrics subpaths used by the frontend
  http.get('/api/v1/metrics/redis/memory', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { total: 1024 * 1024 * 128, used: 12345 });
  }),

  http.get('/api/v1/metrics/redis/keys', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { keys: [ { pattern: '*', count: 123 } ] });
  }),

  http.get('/api/v1/metrics/api/performance', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    // Return a deterministic payload with an overall summary and a
    // list of top endpoints. Components expect `data.overall` and
    // `data.endpoints` to exist with numeric fields.
    const payload = {
      overall: {
        avg_response_time: 45.2,
        cache_hit_ratio: 0.85,
        requests_per_minute: 120,
      },
      endpoints: [
        { path: '/api/v1/users', avg_response_time: 32.4, cache_hit_ratio: 0.92 },
        { path: '/api/v1/points', avg_response_time: 55.1, cache_hit_ratio: 0.78 },
        { path: '/api/v1/pickups', avg_response_time: 102.5, cache_hit_ratio: 0.60 },
      ],
    };
    return send(res, ctx, 200, payload);
  }),

  http.get('/api/v1/metrics/system/health', (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    return send(res, ctx, 200, { status: 'healthy' });
  }),

  // Absolute URL compatibility for GET /pickups/schedule (http://localhost/pickups/schedule)
  http.get((req) => {
    try {
      const reqUrlObj = getReqUrl(req);
      const href = getHref(req);
      if (!href) return false;
  return /https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1)(:\d+)?\/pickups\/schedule(\?|$)/i.test(href);
    } catch (e) {
      return false;
    }
  }, async (req, res, ctx) => {
    const authHeader = headerGet(req, 'Authorization');
    if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {});
    await delay(200);
    return send(res, ctx, 200, { upcoming: [ { id: 101, date: '2025-10-01T09:00:00Z', status: 'scheduled', address: '123 Main St' }, { id: 102, date: '2025-10-05T14:00:00Z', status: 'scheduled', address: '456 Oak Ave' } ], past: [ { id: 51, date: '2025-09-01T09:00:00Z', status: 'completed', address: '789 Pine Rd' } ] });
  }),
  // Robust catch-all handler for /api/payments/methods (absolute/relative)
  http.get((req) => {
    try {
      const href = getHref(req);
      const path = getPath(req);
      // Match any absolute or relative URL for /api/payments/methods
      if (path && path.endsWith('/api/payments/methods')) return true;
      if (href && /\/api\/payments\/methods(\?|$)/i.test(href)) return true;
      return false;
    } catch (e) { return false; }
  }, (req, res, ctx) => {
    return send(res, ctx, 200, mockPaymentMethods);
  }),
  // loopback hosts (localhost, 127.0.0.1, ::1, [::1]) that wasn't matched above.
  // This ensures tests never make real network calls even if a predicate
  // earlier misses a specific path shape. Return a small JSON to make
  // failing network calls deterministic and easier to assert in tests.
  http.all((req) => {
    try {
      const reqUrlObj = getReqUrl(req);
      const href = getHref(req);
      if (!href) return false;
      // match any absolute URL targeting common loopback hosts
      if (/^https?:\/\/(?:\[::1\]|::1|localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?\//i.test(href)) return true;
      return false;
    } catch (e) { return false; }
  }, (req, res, ctx) => {
    // For test determinism, return a 200 with a small body indicating the
    // request was intercepted by the safety-net handler. Tests that expect
    // a specific payload should still prefer the dedicated handlers above.
    try { const authHeader = headerGet(req, 'Authorization'); if (!authHeader && !isTestEnv()) return send(res, ctx, 401, {}); } catch (e) {}
  try { const reqUrlObj2 = getReqUrl(req); const href2 = reqUrlObj2 && (reqUrlObj2.href || (typeof reqUrlObj2.toString === 'function' ? reqUrlObj2.toString() : String(reqUrlObj2))); mswDiag('MSW-DIAG: safety-net intercepted href=', href2); try { if (typeof globalThis !== 'undefined') { globalThis.__MSW_SAFETY_NET_COUNT__ = (globalThis.__MSW_SAFETY_NET_COUNT__ || 0) + 1; } } catch (e) {} } catch (e) {}
    // Fail-fast: return 500 to ensure tests can't silently continue when a
    // request escaped dedicated handlers. The guard test will detect safety-net
    // usage and CI will surface the issue for fixing mocks/predicates.
    return send(res, ctx, 500, { __msw_safety_net: true, intercepted: true, path: getPath(req) || null });
  }),
  // Handler for /api/health (absolute & relative)
  http.head(
    (req) => {
      try {
        const href = typeof getHref === 'function' ? getHref(req) : '';
        const path = typeof getPath === 'function' ? getPath(req) : '';
        // Match both relative and absolute URLs for /api/health
        if (path && path.includes('/api/health')) return true;
        if (href && /\/api\/health(\?|$)/i.test(href)) return true;
        if (href && /https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?\/api\/health(\?|$)/i.test(href)) return true;
        return false;
      } catch (e) { return false; }
    },
    (req, res, ctx) => {
      // Simulate healthy backend
      return res(ctx.status(200));
    }
  ),
  // ✅ Catch-all handler - MUST BE LAST
  http.all((req) => true, (req, res, ctx) => {
    const url = (typeof getHref === 'function' ? getHref(req) : req.url?.href) || (typeof getPath === 'function' ? getPath(req) : req.url?.pathname) || 'unknown';
    const method = req.method || 'UNKNOWN';
    // Log unhandled requests for debugging
    console.warn('[MSW] Unhandled request:', method, url);
    // Return 404 instead of letting request go through to network
    return res(
      ctx.status(404),
      ctx.json({ 
        error: 'Not Found', 
        message: `No handler found for ${method} ${url}`,
        url, 
        method 
      })
    );
  })
];

// Export the handlers array directly
// ...existing code...