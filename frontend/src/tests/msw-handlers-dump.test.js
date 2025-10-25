import { test } from 'vitest';
import { server } from '../mocks/server';

test('dump msw handlers', async () => {
  try {
    if (server && server.ready && typeof server.ready.then === 'function') await server.ready;
    const handlers = (server && typeof server.listHandlers === 'function') ? await server.listHandlers() : [];
    // eslint-disable-next-line no-console
    console.log('msw-handlers-dump: handlers length=', handlers.length);
    try {
      for (const h of handlers) {
        try { console.log('HANDLER:', String(h).slice(0, 200)); } catch (e) { console.log('HANDLER-ERR', e && e.message); }
      }
    } catch (e) { console.log('dump failed', e && e.message); }
  } catch (e) { console.log('dump error', e && e.message); }
});
