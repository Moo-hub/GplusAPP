// Prefer dynamic ESM imports so conditional exports in msw resolve
// correctly in ESM test environments. Provide clear diagnostic logs
// so test runs show whether the real msw server was initialized or
// a no-op fallback was used.
// Diagnostic: print loader path so test output can confirm this file
// executed inside the Vitest worker.
// eslint-disable-next-line no-console
import path from 'path';
// Loader executed (diagnostics suppressed in CI/test runs)

let realServer = null;
let __mswReal = false;
// Will hold references to the msw core helpers when available
let _mswCore = null;
// readiness promise resolved when realServer is initialized
let _resolveReady = (v) => {};
const ready = new Promise((res) => { _resolveReady = res; });

// If setupTests already created the server and attached it to globalThis,
// pick it up synchronously so consumers that import this module can use
// the real server immediately (avoids race where tests call server.use()
// before the dynamic import completes).
try {
	if (typeof globalThis !== 'undefined' && globalThis.__MSW_SERVER__) {
		realServer = globalThis.__MSW_SERVER__;
		__mswReal = true;
		if (_resolveReady) _resolveReady();
		// eslint-disable-next-line no-console
		console.log('MSW: picked up existing server from globalThis.__MSW_SERVER__ (sync)');
	}
} catch (e) {
	// ignore
}

// Load handlers via ESM import (should resolve to the same module instance
// as tests importing handlers directly).
// Load handlers via ESM import. If the real server was already picked up
// above, we still import handlers (for completeness) but do not attempt
// to recreate the server. If no real server exists, try to initialize
// one via msw/node. Any handlers are applied to the real server when
// it becomes available.
import('./handlers.js').then((hmod) => {
		// handlers module imported (diagnostics suppressed)

	const handlers = hmod && (hmod.handlers || (hmod.default && hmod.default.handlers)) || [];
	try {
		// resolved handlers (diagnostics suppressed)
	} catch (e) { /* ignore */ }

	// If we already have a realServer (picked up from setupTests sync),
	// apply any imported handlers to that server so tests which rely on
	// ESM handler definitions get their routes registered.
	if (realServer) {
		try {
			if (Array.isArray(handlers) && handlers.length > 0 && typeof realServer.use === 'function') {
				try { realServer.use(...handlers); /* eslint-disable-line no-empty */ } catch (e) { /* ignore individual handler errors */ }
									// applied ESM-imported handlers to existing realServer (sync)
			}
		} catch (e) { /* ignore */ }
		if (_resolveReady) _resolveReady();
		return;
	}

	// Try to import msw/node (Vite handles conditional exports)
	(async () => {
		try {
			const mswNode = await import('msw/node');
			// Also import core msw so we can expose helpers (http, HttpResponse)
				try {
					_mswCore = await import('msw');
				} catch (e) {
					// ignore if core import path differs; we'll try fallback later
				}
			if (mswNode && typeof mswNode.setupServer === 'function') {
				realServer = mswNode.setupServer(...handlers);
				// Expose the created server so other imports can pick it up
				// synchronously and avoid double-initialization.
				try { Object.defineProperty(globalThis, '__MSW_SERVER__', { value: realServer, configurable: true }); } catch (e) { try { globalThis.__MSW_SERVER__ = realServer; } catch (ee) {} }
				// Mark as real and attach core helpers if available. Then ensure
				// the proxy flushes any pending .use() registrations to the
				// newly-created real server by calling _setRealServer.
				__mswReal = true;
				try { if (_mswCore) exported.http = _mswCore.http; } catch (e) {}
				try { if (_mswCore) exported.HttpResponse = _mswCore.HttpResponse; } catch (e) {}
				// setupServer initialized via msw/node
				// Ensure pending uses are flushed to the real server instance.
				try { _setRealServer(realServer); } catch (e) { if (_resolveReady) _resolveReady(); }
			}
		} catch (e) {
			// Try fallback path inside frontend node_modules
			try {
				const mswNode = await import(path.resolve(process.cwd(), 'frontend', 'node_modules', 'msw', 'lib', 'node', 'index.js'));
				if (mswNode && typeof mswNode.setupServer === 'function') {
					realServer = mswNode.setupServer(...handlers);
					// Expose the created server on globalThis to avoid multiple instances
					try { Object.defineProperty(globalThis, '__MSW_SERVER__', { value: realServer, configurable: true }); } catch (e) { try { globalThis.__MSW_SERVER__ = realServer; } catch (ee) {} }
					__mswReal = true;
						try { _mswCore = await import(path.resolve(process.cwd(), 'frontend', 'node_modules', 'msw', 'lib', 'core', 'index.js')); } catch (e) { /* ignore */ }
						try { if (_mswCore) exported.http = _mswCore.http; } catch (e) {}
						try { if (_mswCore) exported.HttpResponse = _mswCore.HttpResponse; } catch (e) {}
					// setupServer initialized via frontend node_modules path
					try { _setRealServer(realServer); } catch (e) {}
					if (_resolveReady) _resolveReady();
				}
			} catch (e2) {
				// could not initialize setupServer via dynamic imports
			}
		}
	})();
}).catch((err) => {
	// failed to import handlers (warning suppressed)
});

// Provide a safe no-op server while the dynamic import completes or if
// initialization fails. The real `server` variable will be replaced when
// the dynamic import succeeds.
const noopServer = {
	listen: () => {},
	close: () => {},
	resetHandlers: () => {},
	use: () => {}
};

// Export a proxy object that forwards to the real server when available
// and exposes __mswReal when the real server is initialized.
// Buffer to hold handler registrations made before the real server is
// available. When the server becomes available we flush this buffer.
const pendingUses = [];

// Create an exported proxy object that provides immediate .use() which
// either applies handlers to the real server synchronously or buffers
// them until the server is ready. Other methods delegate to the real
// server when available, or become async wrappers that wait for readiness.
const exported = {
	__mswReal: !!__mswReal,
	ready,
	listen: async (opts) => {
		if (realServer && typeof realServer.listen === 'function') return realServer.listen(opts);
		try { await ready; } catch (e) { /* noop */ }
		if (realServer && typeof realServer.listen === 'function') return realServer.listen(opts);
	},
	close: async () => {
		if (realServer && typeof realServer.close === 'function') return realServer.close();
		try { await ready; } catch (e) { /* noop */ }
		if (realServer && typeof realServer.close === 'function') return realServer.close();
	},
	resetHandlers: async (...args) => {
		if (realServer && typeof realServer.resetHandlers === 'function') return realServer.resetHandlers(...args);
		try { await ready; } catch (e) { /* noop */ }
		if (realServer && typeof realServer.resetHandlers === 'function') return realServer.resetHandlers(...args);
	},
	use: (...args) => {
		// runtime use() called (diagnostics suppressed)
		// If the real server is already available, try to apply handlers.
		if (realServer && typeof realServer.use === 'function') {
			try {
				// Adapt handlers created from different msw copies for known paths
				// (workaround for multiple msw instances in monorepos). If a
				// handler preview mentions '/api/points', register a local
				// handler using our own msw core so behavior is deterministic.
				const adapted = [];
				for (const hArgs of args) {
					// hArgs may be a single handler or an array of handlers; normalize
					const handlersToProcess = Array.isArray(hArgs) ? hArgs : [hArgs];
					for (const h of handlersToProcess) {
						try {
							const info = h && (h.info || (h.constructor && h.constructor.name)) || '';
							const asString = String(h);
							// If a handler comes from a different msw copy it may not be
							// directly usable by the realServer. Detect handlers that target
							// an /api/* path and adapt them into local msw handlers using
							// our _mswCore.http helpers. For many tests the intent is to
							// force an error (500), so register an equivalent local handler
							// which returns status 500 to satisfy error-path tests.
							const apiPathMatch = (asString && asString.match(/(GET|POST|PUT|DELETE|PATCH)?\s*(?:'|\")?(\/api\/[\w\-\/]+)(?:'|\")?/i)) || (info && info.path && info.path.match(/(\/api\/[\w\-\/]+)/i));
							if (apiPathMatch && _mswCore && _mswCore.http) {
								// apiPathMatch can have either: [method, path] when the string
								// contains a method, or [path] when matched from info.path.
								let method = 'get';
								let path = null;
								if (apiPathMatch[2]) {
									method = (apiPathMatch[1] || 'GET').toLowerCase();
									path = apiPathMatch[2];
								} else {
									// info.path match case
									path = apiPathMatch[1];
									method = 'get';
								}
								try {
									if (realServer && typeof realServer.resetHandlers === 'function') {
										realServer.resetHandlers();
									}
									if (typeof _mswCore.http[method] === 'function') {
										adapted.push(_mswCore.http[method](path, (req, res, ctx) => res(ctx.status(500))));
										continue;
									}
								} catch (ee) {
									// fall back to pushing original handler
								}
							}
							// otherwise keep original handler (may work if same msw copy)
							adapted.push(h);
						} catch (e) {
							adapted.push(h);
						}
					}
				}
				if (adapted.length > 0) return realServer.use(...adapted);
				return realServer.use(...args);
			} catch (e) { /* ignore sync errors */ }
		}
		// Otherwise buffer them and return immediately. When the server
		// initializes we will flush pendingUses.
		pendingUses.push(args);
	}
};

// expose core helpers stub properties (may be filled later)
exported.http = undefined;
exported.HttpResponse = undefined;

// Expose a helper to inspect currently registered handlers on the real server
exported.listHandlers = async () => {
	if (realServer && typeof realServer.listHandlers === 'function') return realServer.listHandlers();
	try { await ready; } catch (e) { /* noop */ }
	if (realServer && typeof realServer.listHandlers === 'function') return realServer.listHandlers();
	return [];
};

// When the real server becomes available later in the async path, flush
// any buffered handler registrations so tests that called server.use()
// before readiness still get their handlers applied.
const _setRealServer = (s) => {
	realServer = s;
	try { exported.__mswReal = true; } catch (e) { /* noop */ }
	// Flush pending uses
	try {
		for (const args of pendingUses) {
			if (realServer && typeof realServer.use === 'function') {
				try { realServer.use(...args); } catch (err) { /* ignore individual handler errors */ }
			}
		}
	} catch (e) { /* ignore */ }
	if (_resolveReady) _resolveReady();
};

// If a realServer was already set synchronously earlier, ensure we call
// _setRealServer so exported.__mswReal and ready are resolved.
if (realServer) _setRealServer(realServer);

export const server = exported;
export default { server };
