import { describe, it, expect } from "vitest";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";

const base = "http://localhost";

describe("MSW server mocks", () => {
  it("returns payment methods", async () => {
    const res = await fetch(`${base}/api/payments/methods`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
    expect(data).toEqual(["Visa", "MasterCard", "PayPal"]);
  });

  it("returns vehicles list", async () => {
    const res = await fetch(`${base}/api/vehicles`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.map(v => v.name)).toEqual(["Truck A", "Truck B"]);
  });

  it("returns points balance", async () => {
    const res = await fetch(`${base}/api/points`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data).toHaveProperty("balance", 200);
  });

  it("returns companies list", async () => {
    const res = await fetch(`${base}/api/companies`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.map(c => c.name)).toEqual(["EcoCorp", "GreenTech"]);
  });

  it("can override handler to return 500 for /api/points", async () => {
    server.use(
      http.get("http://localhost/api/points", () =>
        HttpResponse.json(null, { status: 500 })
      )
    );
    const res = await fetch(`${base}/api/points`);
    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
  });
});