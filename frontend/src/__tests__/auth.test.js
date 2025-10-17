import serverModule from '../mocks/server';
const { server } = serverModule;

let http = null;
let HttpResponse = null;
try {
  http = server && server.http ? server.http : null;
  HttpResponse = server && server.HttpResponse ? server.HttpResponse : null;
} catch (e) {}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createAndRegisterHandlers = () => {
  try {
    const h = [];
    const httpImpl = server && server.http ? server.http : http;
    const HttpResponseImpl = server && server.HttpResponse ? server.HttpResponse : HttpResponse;
    if (!httpImpl || !HttpResponseImpl) return;

    h.push(httpImpl.post('/api/auth/login', async ({ request }) => {
      const body = await request.json();
      const { email, password } = body || {};
      const success = email === 'test@example.com' && password === 'password123';
      const payload = success ? { user: { id: 2, name: 'Test User', email }, token: 'mock-token' } : { message: 'Invalid credentials' };
      const status = success ? 200 : 401;
      return HttpResponseImpl.json(payload, { status });
    }));

    h.push(httpImpl.post('/api/v1/auth/login', async ({ request }) => {
      const text = await request.text();
      const params = new URLSearchParams(text);
      const username = params.get('username');
      const password = params.get('password');
      const success = username === 'test@example.com' && password === 'password123';
      const payload = success ? { access_token: 'mock-jwt-token', token_type: 'bearer', user: { id: 2, name: 'Test User', email: username } } : { detail: 'Incorrect username or password' };
      const status = success ? 200 : 401;
      return HttpResponseImpl.json(payload, { status });
    }));

    server.resetHandlers(...h);
  } catch {}
};

createAndRegisterHandlers();

test('MSW login handler accepts valid credentials (JSON endpoint)', async () => {
  const resp = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-msw-skip-global': '1' },
    body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
  });

  const data = await resp.json();
  expect(resp.status).toBe(200);
  expect(data).toHaveProperty('user');
  expect(data.user.email).toBe('test@example.com');
}, 10000);

test('MSW backend-style login endpoint (form data) succeeds', async () => {
  const params = new URLSearchParams();
  params.append('username', 'test@example.com');
  params.append('password', 'password123');

  const resp = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'x-msw-skip-global': '1' },
    body: params.toString()
  });

  const data = await resp.json();
  expect(resp.status).toBe(200);
  expect(data).toHaveProperty('access_token');
  expect(data).toHaveProperty('user');
  expect(data.user.email).toBe('test@example.com');
}, 10000);
