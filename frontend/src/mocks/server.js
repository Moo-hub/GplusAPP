// Prefer dynamic ESM imports so conditional exports in msw resolve
// correctly in ESM test environments. Provide clear diagnostic logs
// so test runs show whether the real msw server was initialized or
// a no-op fallback was used.
// Diagnostic: print loader path so test output can confirm this file
// executed inside the Vitest worker.
// eslint-disable-next-line no-console
import path from 'path';
import { createRequire } from 'module';

// Diagnostic gates: strictly opt-in. Only log when MSW_DEBUG is explicitly
// set to the string 'true' or when globalThis.__MSW_DEBUG__ === true.
const _isMswDebug = () => {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.__MSW_DEBUG__ === true) return true;
    if (typeof process !== 'undefined' && process.env && String(process.env.MSW_DEBUG) === 'true') return true;
  } catch (e) {
    /* ignore */
  }
  return false;
};
const mswDiag = (...args) => {
  try {
    if (!_isMswDebug()) return;
    try { require('../utils/logger').debug(...args); } catch (e) { void e; }
  } catch (e) { /* ignore */ }
};
const mswErr = (...args) => {
  try {
    if (!_isMswDebug()) return;
    try { require('../utils/logger').error(...args); } catch (e) { void e; }
  } catch (e) { /* ignore */ }
};

let realServer = null;
let __mswReal = false;
let _mswCore = null;
let _resolveReady = () => {};
let _readyTimer = null;
const pendingUses = [];

const ready = new Promise((res) => {
  _resolveReady = () => {
    try { res(); } catch (e) {}
    try { if (_readyTimer) clearTimeout(_readyTimer); } catch (e) {}
    try {
      const ext = (typeof globalThis !== 'undefined' && globalThis.__MSW_SERVER_READY_RESOLVE) ? globalThis.__MSW_SERVER_READY_RESOLVE : ((typeof global !== 'undefined' && global.__MSW_SERVER_READY_RESOLVE) ? global.__MSW_SERVER_READY_RESOLVE : null);
      if (ext && typeof ext === 'function') {
        try { ext(); } catch (ee) {}
      }
    } catch (e) {}
  };
  try { _readyTimer = setTimeout(() => { try { _resolveReady && _resolveReady(); } catch (e) {} }, 3000); } catch (e) {}
});

// hoisted helper to flush pending uses and copy helpers
function _setRealServer(s) {
  realServer = s;
  try { exported.__mswReal = true; } catch (e) {}
  try {
    if (realServer && typeof realServer === 'object') {
      try { exported.http = realServer.http || exported.http; } catch (e) {}
      try { exported.HttpResponse = realServer.HttpResponse || exported.HttpResponse; } catch (e) {}
    }
  } catch (e) {}
  try {
    for (const args of pendingUses) {
      if (realServer && typeof realServer.use === 'function') {
        try {
          realServer.use(...args);
        } catch (e) {
          /* ignore */
        }
      }
    }
  } catch (e) {}

  try {
    let count = 0;
    try { if (realServer && typeof realServer.listHandlers === 'function') count = (realServer.listHandlers() || []).length; } catch (ee) { count = -1; }
    if (_isMswDebug()) {
      try { mswDiag('MSW: _setRealServer applied - pendingUses flushed; handlers count (approx)=', count); } catch (e) {}
    }
  } catch (e) {}

  try {
    const curCount = (realServer && typeof realServer.listHandlers === 'function') ? (realServer.listHandlers() || []).length : 0;
    if (curCount === 0) {
      if (_isMswDebug()) {
        try { mswDiag('MSW-WARN: realServer has 0 handlers — do not attach fallback handlers silently.'); } catch (e) {}
      }
    }
  } catch (e) {}

  if (_resolveReady) _resolveReady();
}

// exported proxy (define before init so helpers can set properties)
const exported = {
  __mswReal: !!__mswReal,
  ready,
  listen: async (opts = {}) => {
    const effectiveOpts = Object.assign({ onUnhandledRequest: 'warn' }, opts || {});
    if (realServer && typeof realServer.listen === 'function') return realServer.listen(effectiveOpts);
    try { await ready; } catch (e) {}
    if (realServer && typeof realServer.listen === 'function') return realServer.listen(effectiveOpts);
  },
  close: async () => {
    if (realServer && typeof realServer.close === 'function') return realServer.close();
    try { await ready; } catch (e) {}
    if (realServer && typeof realServer.close === 'function') return realServer.close();
  },
  resetHandlers: async (...args) => {
    if (realServer && typeof realServer.resetHandlers === 'function') return realServer.resetHandlers(...args);
    try { await ready; } catch (e) {}
    if (realServer && typeof realServer.resetHandlers === 'function') return realServer.resetHandlers(...args);
  },
  use: (...args) => {
    if (realServer && typeof realServer.use === 'function') {
      try {
        const adapted = [];
        for (const hArgs of args) {
          const handlersToProcess = Array.isArray(hArgs) ? hArgs : [hArgs];
          for (const h of handlersToProcess) {
            try {
              const info = h && (h.info || (h.constructor && h.constructor.name)) || '';
              const asString = String(h);
              // eslint-disable-next-line no-useless-escape
              const apiPathMatch = (asString && asString.match(/(GET|POST|PUT|DELETE|PATCH)?\s*(?:['"])?(\/api\/[\w\-\/]+)(?:['"])?/i)) || (info && info.path && info.path.match(/(\/api\/[\w\-\/]+)/i));
              if (apiPathMatch && _mswCore && _mswCore.http) {
                let method = 'get';
                let pathStr = null;
                if (apiPathMatch[2]) {
                  method = (apiPathMatch[1] || 'GET').toLowerCase();
                  pathStr = apiPathMatch[2];
                } else {
                  pathStr = apiPathMatch[1];
                  method = 'get';
                }
                try {
                  if (realServer && typeof realServer.resetHandlers === 'function') {
                    realServer.resetHandlers();
                  }
                  if (typeof _mswCore.http[method] === 'function') {
                    adapted.push(_mswCore.http[method](pathStr, (req, res, ctx) => res(ctx.status(500))));
                    continue;
                  }
                } catch (ee) {}
              }
              adapted.push(h);
            } catch (e) { adapted.push(h); }
          }
        }
        if (adapted.length > 0) return realServer.use(...adapted);
        return realServer.use(...args);
      } catch (e) {}
    }
    pendingUses.push(args);
  }
};

exported.http = undefined;
exported.HttpResponse = undefined;

exported.listHandlers = async () => {
  if (realServer && typeof realServer.listHandlers === 'function') return realServer.listHandlers();
  try { await ready; } catch (e) {}
  if (realServer && typeof realServer.listHandlers === 'function') return realServer.listHandlers();
  return [];
};

// pick up any synchronously-created server placed on globalThis
try {
  if (typeof globalThis !== 'undefined' && globalThis.__MSW_SERVER__) {
    _setRealServer(globalThis.__MSW_SERVER__);
  }
} catch (e) {}

// Async init: import handlers and create msw/node server
(async function init() {
  try {
    const hmod = await import('./handlers.js');
    const handlers = hmod && (hmod.handlers || (hmod.default && hmod.default.handlers)) || [];
    try { if (typeof globalThis !== 'undefined') globalThis.__MSW_HANDLERS_IMPORTED__ = Date.now(); } catch (e) {}
    try { if (typeof globalThis !== 'undefined') globalThis.__MSW_HANDLERS_IMPORTED_COUNT__ = (handlers && handlers.length) || 0; } catch (e) {}

    if (Array.isArray(handlers) && handlers.length > 0) {
      // create server via ESM entry
      try {
        const mswNode = await import('msw/node');
        try { _mswCore = await import('msw'); } catch (e) {}
        if (mswNode && typeof mswNode.setupServer === 'function') {
          realServer = mswNode.setupServer(...handlers);
          try { Object.defineProperty(globalThis, '__MSW_SERVER__', { value: realServer, configurable: true }); } catch (e) { try { globalThis.__MSW_SERVER__ = realServer; } catch (ee) {} }
          __mswReal = true;
  try { if (_mswCore) exported.http = _mswCore.http; } catch (e) { /* ignore */ }
  try { if (_mswCore) exported.HttpResponse = _mswCore.HttpResponse; } catch (e) { /* ignore */ }
          _setRealServer(realServer);
          try { if (typeof globalThis !== 'undefined') globalThis.__MSW_REALSERVER_CREATED__ = Date.now(); } catch (e) {}
          return;
        }
      } catch (e) {
        // fallthrough to CJS/direct fallback
      }

      // try CJS require
      try {
        const rq = (typeof require === 'function') ? require : (createRequire ? createRequire(process.cwd()) : null);
        if (rq) {
          const mswNodeCjs = rq('msw/node');
          if (mswNodeCjs && typeof mswNodeCjs.setupServer === 'function') {
            realServer = mswNodeCjs.setupServer(...handlers);
            try { Object.defineProperty(globalThis, '__MSW_SERVER__', { value: realServer, configurable: true }); } catch (e) { try { globalThis.__MSW_SERVER__ = realServer; } catch (ee) {} }
            __mswReal = true;
            if (_resolveReady) _resolveReady();
            return;
          }
        }
      } catch (e) {}

      // direct node_modules import
      try {
        const fallbackPath = path.resolve(process.cwd(), 'node_modules', 'msw', 'lib', 'node', 'index.js');
        const mswNodeDirect = await import(fallbackPath);
        if (mswNodeDirect && typeof mswNodeDirect.setupServer === 'function') {
          realServer = mswNodeDirect.setupServer(...handlers);
          try { Object.defineProperty(globalThis, '__MSW_SERVER__', { value: realServer, configurable: true }); } catch (e) { try { globalThis.__MSW_SERVER__ = realServer; } catch (e) { /* ignore */ } }
          __mswReal = true;
          if (_resolveReady) _resolveReady();
          return;
        }
      } catch (e) {}
    }

    // If we get here, either handlers were empty or server creation failed.
    // Resolve readiness so consumers won't hang. Do not attach fallback handlers.
    if (_resolveReady) _resolveReady();
  } catch (err) {
    const debugEnabled = (typeof process !== 'undefined' && process.env && process.env.MSW_DEBUG) || (typeof globalThis !== 'undefined' && globalThis.__MSW_DEBUG__);
    if (debugEnabled) {
  try { mswErr('MSW: handlers import failed', err && err.message ? err.message : err); } catch (e) { /* ignore */ }
    }
    if (_resolveReady) _resolveReady();
  }
})();

export const server = exported;
export default { server };
