import { it, expect } from 'vitest';

it('inspect handlers module exports', async () => {
  const g = (typeof globalThis !== 'undefined') ? globalThis : (typeof global !== 'undefined' ? global : {});
  try {
    // Normal ESM import via relative path
    let mod = null;
    try {
      mod = await import('../mocks/handlers.js');
      console.log('INSPECT: relative import keys=', mod ? Object.keys(mod).slice(0,20) : null);
      try { console.log('INSPECT: relative.handlers.len=', mod && (mod.handlers ? mod.handlers.length : (mod.default && mod.default.handlers ? mod.default.handlers.length : null))); } catch (e) {}
    } catch (e) {
      console.log('INSPECT: relative import failed', e && e.message ? e.message : e);
    }

    // File-URL import
    try {
      const { pathToFileURL } = await import('url');
      const path = (await import('path')).resolve(process.cwd(), 'src', 'mocks', 'handlers.js');
      const fileUrl = pathToFileURL(path).href;
      const mod2 = await import(fileUrl);
      console.log('INSPECT: file-url import keys=', mod2 ? Object.keys(mod2).slice(0,20) : null);
      try { console.log('INSPECT: file.handlers.len=', mod2 && (mod2.handlers ? mod2.handlers.length : (mod2.default && mod2.default.handlers ? mod2.default.handlers.length : null))); } catch (e) {}
    } catch (e) {
      console.log('INSPECT: file-url import failed', e && e.message ? e.message : e);
    }

    // Print global diag flags
    console.log('INSPECT: global diag flags:', {
      HANDLERS_IMPORTED: g.__MSW_HANDLERS_IMPORTED__,
      HANDLERS_IMPORTED_COUNT: g.__MSW_HANDLERS_IMPORTED_COUNT__,
      HANDLERS_APPLIED: g.__MSW_HANDLERS_APPLIED__,
      REALSERVER_CREATED: g.__MSW_REALSERVER_CREATED__,
      GLOBAL_MSW_SERVER: !!g.__MSW_SERVER__,
    });
  } catch (e) {
    console.log('INSPECT: unexpected error', e && e.message ? e.message : e);
  }
  expect(true).toBe(true);
});
