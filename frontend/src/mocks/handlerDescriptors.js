// Minimal descriptor list for critical API endpoints used in focused tests
// Each descriptor: { method, path, response, status, behavior }
export const descriptors = [
  { method: 'get', path: '/api/payments/methods', status: 200, response: [ 'Visa', 'MasterCard', 'PayPal' ] },
  { method: 'get', path: '/api/vehicles', status: 200, response: [ { id: 3, name: 'Truck A' }, { id: 4, name: 'Truck B' } ] },
  { method: 'get', path: '/api/points', status: 200, response: { balance: 200, impact: '~1.3kg CO₂', reward: '5% off next pickup' }, supportsForcedStatus: true },
  { method: 'get', path: '/api/companies', status: 200, response: [ { id: 1, name: 'EcoCorp' }, { id: 2, name: 'GreenTech' } ] },
  { method: 'post', path: '/api/auth/login', status: 200, response: (body) => ({ user: { id: 2, email: body && (body.email || body.username) || 'test@example.com' }, token: 'mock-token' }), acceptFormOrJson: true },
  { method: 'post', path: '/api/v1/auth/login', status: 200, response: (body) => ({ access_token: 'mock-jwt-token', token_type: 'bearer', user: { id: 2, email: body && (body.username || body.email) || 'test@example.com' } }), acceptFormOrJson: true }
];

export default { descriptors };
