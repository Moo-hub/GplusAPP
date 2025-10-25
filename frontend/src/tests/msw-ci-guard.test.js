import { it, expect } from 'vitest';

it('msw has registered handlers (CI guard)', async () => {
  let server = null;
  try { server = (await import('../mocks/server.js')).server; } catch (e) { server = null; }
  expect(server).toBeTruthy();
  if (server && typeof server.ready === 'object') {
    try { await server.ready; } catch (e) { /* ignore */ }
  }
  let handlers = [];
  try { handlers = await server.listHandlers(); } catch (e) { handlers = []; }
  // Fail the test if no handlers are registered — indicates a broken test setup
  expect(Array.isArray(handlers)).toBe(true);
  expect(handlers.length).toBeGreaterThan(0);
});
