import { setupServer } from 'msw/node';
import { rest } from 'msw';

// هنا بتحاكي API Calls
export const server = setupServer(
  rest.get('/api/payments/methods', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, name: 'Visa' },
        { id: 2, name: 'PayPal' },
      ])
    );
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