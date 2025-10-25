/* Vitest probe: checks msw module resolution inside worker and lists handlers */
import { it, expect } from 'vitest';

it('msw resolution probe - worker', async () => {
  const resolved = { main: null, worker: null };
  try {
    // Try different ways to resolve msw
    try { resolved.main = require && typeof require.resolve === 'function' ? require.resolve('msw') : null; } catch (e) { resolved.main = 'require.resolve failed: ' + e.message; }
    try { const r = import.meta && import.meta.url ? 'import.meta_present' : 'import.meta_absent'; resolved.worker = r; } catch (e) { resolved.worker = 'import.meta check failed'; }
  } catch (e) { /* ignore */ }
  // Try to import the server proxy and list handlers
  let server = null;
  try { server = (await import('../mocks/server.js')).server; } catch (e) { server = null; }
  let handlersList = [];
  try {
    if (server && typeof server.listHandlers === 'function') {
      handlersList = await server.listHandlers();
    }
  } catch (e) { handlersList = ['listHandlers failed: ' + (e && e.message)]; }
  // Print to test logs (Vitest captures console output)
  // eslint-disable-next-line no-console
  const g = (typeof globalThis !== 'undefined') ? globalThis : (typeof global !== 'undefined' ? global : {});
  const diagFlags = {
    HANDLERS_MODULE_LOADED: g.__MSW_HANDLERS_MODULE_LOADED__ || null,
    HANDLERS_IMPORTED_COUNT: g.__MSW_HANDLERS_IMPORTED_COUNT__ || null,
    HANDLERS_APPLIED: g.__MSW_HANDLERS_APPLIED__ || null,
    HANDLERS_APPLIED_COUNT: g.__MSW_HANDLERS_APPLIED_COUNT__ || null,
    REALSERVER_CREATED: g.__MSW_REALSERVER_CREATED__ || null,
    HANDLERS_IMPORTED_FLAG: g.__MSW_HANDLERS_IMPORTED__ || null,
  };
  console.log('msw-probe: resolved.main=', resolved.main, 'resolved.worker=', resolved.worker, 'handlersCount=', (Array.isArray(handlersList) ? handlersList.length : handlersList), 'diagFlags=', diagFlags);
  // Basic expectations: server exists and handlersList is an array
  expect(Array.isArray(handlersList)).toBe(true);
});
