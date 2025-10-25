import { AuthProvider } from '../contexts/AuthContext.jsx';
import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api';
import { seedLocalStorage } from '../tests/utils/storageMock';
import websocketService from '../services/websocket.service';

// Mock api and websocket
vi.mock('../services/api', () => ({ default: { post: vi.fn() } }));
vi.mock('../services/websocket.service', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
}));

// Tiny consumer component that calls login when mounted and renders user email
function LoginInvoker({ email, password }) {
  const auth = useAuth();
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await auth.login(email, password);
        if (mounted) {
          // render a simple DOM marker with the email
          const node = document.createElement('div');
          node.setAttribute('data-testid', 'invoked-user');
          node.textContent = u?.email || '';
          document.body.appendChild(node);
        }
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, [auth, email, password]);
  return null;
}

describe('Auth unit tests (fast)', () => {
  let clearStorageMocks;
  beforeEach(() => {
    vi.clearAllMocks();
    // setup localStorage mock helper
    const s = seedLocalStorage();
    clearStorageMocks = s.clear;
  });

  afterEach(() => {
    try { if (typeof clearStorageMocks === 'function') clearStorageMocks(); } catch (e) {}
  });

  it('login saves token/user and connects websocket quickly', async () => {
    const mockUser = { id: 1, email: 'fast@example.com' };
    const mockToken = 'fast-token';
  // Return both the direct shape and an Axios-like { data } wrapper so the
  // AuthContext login which accepts both forms will succeed regardless of
  // whether api.post is wired to return response or response.data.
  // Some test environments may wrap the mock differently; assign a concrete
  // implementation to guarantee the exact resolved shape expected by login().
  api.post = async () => ({ access_token: mockToken, user: mockUser, data: { access_token: mockToken, user: mockUser } });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <LoginInvoker email="fast@example.com" password="pw" />
        </AuthProvider>
      </QueryClientProvider>
    );

  // Wait for the invoker to append the user marker to the document
  // Use findBy* to await asynchronous DOM mutation and avoid racey getBy*
  const invoked = await screen.findByTestId('invoked-user');
  expect(invoked).toBeInTheDocument();
    expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  // websocket connect should be called once
  expect(websocketService.connect).toHaveBeenCalled();
    // Clean up explicit DOM node appended by LoginInvoker to avoid leaking
    try { document.querySelectorAll('[data-testid="invoked-user"]').forEach(n => n.remove()); } catch (e) {}
  }, { timeout: 2000 });
});
