import { rest } from "msw";
import { setupServer } from "msw/node";

// هنا بتحاكي API Calls
export const server = setupServer(
  rest.get("/api/payments/methods", (_req, res, ctx) => {
    return res(ctx.json(["Visa", "MasterCard", "PayPal"]));
  }),
  rest.get('/api/vehicles', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, name: 'Truck A' },
        { id: 2, name: 'Truck B' },
      ])
    );
  }),
  rest.get('/api/points', (req, res, ctx) => {
    return res(
      ctx.json({ balance: 200 })
    );
  }),
  rest.get('/api/companies', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, name: 'EcoCorp' },
        { id: 2, name: 'GreenTech' },
      ])
    );
  })
);
