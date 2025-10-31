import { describe, it, expect } from "vitest";
// Ensure the full frontend test bootstrap runs (starts MSW CJS server, sets __TEST__)
import '../setupTests.js';
import { server } from "../mocks/server";
// Ensure test mode so handlers that check for Authorization allow requests
global.__TEST__ = true;

// Diagnostic: print runtime info so we can see whether the proxied server is real
// and whether fetch is the node-fetch implementation or the jsdom fetch.
// eslint-disable-next-line no-console
// eslint-disable-next-line no-console
// diagnostic logs suppressed
// console.log('TEST DIAG: global.__TEST__ ->', typeof global !== 'undefined' ? global.__TEST__ : 'no-global');
// console.log('TEST DIAG: globalThis.__MSW_SERVER__ ->', typeof globalThis !== 'undefined' ? !!globalThis.__MSW_SERVER__ : 'no-globalThis');
// eslint-disable-next-line no-console
console.log('TEST DIAG: imported server.__mswReal ->', server && server.__mswReal);
// eslint-disable-next-line no-console
console.log('TEST DIAG: typeof fetch ->', typeof fetch, 'fetch.toString ->', (typeof fetch === 'function' ? fetch.toString().slice(0,200) : '')); 

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
// Prefer using the msw http helper attached to the proxied server so runtime
// overrides come from the same msw instance. Fall back to importing from
// msw package if the proxy doesn't expose them.
let http = null;
let HttpResponse = null;
try {
  http = server && server.http ? server.http : null;
  HttpResponse = server && server.HttpResponse ? server.HttpResponse : null;
} catch (e) {}
if (!http) {
  try { const m = await import('msw'); http = m.http; HttpResponse = m.HttpResponse; } catch (e) {}
}

// Use relative URLs so MSW can intercept them reliably in the test environment

describe("MSW server mocks", () => {
  it("returns payment methods", async () => {
  // Ensure server readiness
  // diagnostics suppressed: server.__mswReal and globalThis.__MSW_SERVER__
  const res = await fetch(`/api/payments/methods`);
    if (!res.ok) {
      try { const txt = await res.text(); console.warn('TEST: non-ok response', res.status, res.url, txt); } catch (e) { console.warn('TEST: non-ok response and failed to read body', e && e.message); }
    }
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
    expect(data).toEqual(["Visa", "MasterCard", "PayPal"]);
  });

  it("returns vehicles list", async () => {
  const res = await fetch(`/api/vehicles`);
    if (!res.ok) {
      try { const txt = await res.text(); console.warn('TEST: non-ok response', res.status, res.url, txt); } catch (e) {}
    }
    expect(res.ok).toBe(true);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data && data.data ? data.data : []);
    expect(list.map(v => v.name)).toEqual(["Truck A", "Truck B"]);
  });

  it("returns points balance", async () => {
  const res = await fetch(`/api/points`);
    if (!res.ok) {
      try { const txt = await res.text(); console.warn('TEST: non-ok response', res.status, res.url, txt); } catch (e) {}
    }
    expect(res.ok).toBe(true);
    const data = await res.json();
    const balance = (data && typeof data.balance !== 'undefined') ? data.balance : (data && data.data && data.data[0] && data.data[0].balance);
    expect(balance).toBe(200);
  });

  it("returns companies list", async () => {
  const res = await fetch(`/api/companies`);
    if (!res.ok) {
      try { const txt = await res.text(); console.warn('TEST: non-ok response', res.status, res.url, txt); } catch (e) {}
    }
    expect(res.ok).toBe(true);
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data && data.data ? data.data : []);
    expect(list.map(c => c.name)).toEqual(["EcoCorp", "GreenTech"]);
  });

  it("can override handler to return 500 for /api/points", async () => {
    // Use header-based forced status which is more robust across request shapes.
    const res = await fetch(`/api/points`, { headers: { 'x-msw-force-status': '500' } });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
  });
});