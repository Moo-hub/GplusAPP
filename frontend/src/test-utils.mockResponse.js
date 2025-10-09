
// Test helper: create a Response-like object that behaves like the Fetch API Response
// so tests that call `response.json()` or `response.text()` can work with simple mocks.
export function mockResponse({ ok = true, status = ok ? 200 : 500, body = null, headers = {} } = {}) {
  return {
    ok,
    status,
    headers,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

export default mockResponse;
