import '../../test-utils/mockWebsocketShim';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Mock the websocket service module so that any import of
// '../../services/websocket.service' inside the component tree will
// receive the ESM test shim located at '../../test-shims/websocket.service'.
vi.mock('../../services/websocket.service', async () => {
  const mod = await import('../../test-shims/websocket.service');
  return {
    default: mod.default,
    websocketService: mod.websocketService,
    resetWebsocketShim: mod.resetWebsocketShim,
  };
});

// Import the mocked module (the vi.mock above ensures this resolves to the shim)
import websocketService from '../../services/websocket.service';
import { renderWithProviders, makeAuthMocks } from '../../../../tests/test-utils.jsx';

// Mock the translations used by Header and expose the changeLanguage mock
vi.mock('react-i18next', () => {
  const changeLanguage = vi.fn();
  return {
    useTranslation: () => ({
      t: (k) => k,
      i18n: { language: 'en', changeLanguage }
    }),
    // expose the mock so tests can import it without calling hooks
    __esModule: true,
    _changeLanguageMock: changeLanguage,
  };
});

// Mock Notifications child component (kept simple)
vi.mock('../Notifications', () => ({ default: () => <div data-testid="notifications-content" /> }));

describe('Header Component', () => {
  let auth;

  beforeEach(async () => {
    vi.clearAllMocks();
    document.documentElement.classList.remove('dark');
    auth = makeAuthMocks();
    // Reset the shim to a clean state by importing it directly.
    const shim = await import('../../test-shims/websocket.service');
    shim.resetWebsocketShim();
    // connect is a noop in the shim, but keep a spy so tests can assert calls.
  const wsAny = /** @type {any} */ (websocketService);
  wsAny.connect = vi.fn();
  // Provide a minimal fake ws object. Use numeric fallback if WebSocket.OPEN
  // is not available in this environment.
  const WS_OPEN = (typeof WebSocket !== 'undefined' && typeof WebSocket.OPEN === 'number') ? WebSocket.OPEN : 1;
  wsAny.ws = { readyState: WS_OPEN };
  });

  it('renders header with correct elements', () => {
  renderWithProviders(<Header />, { auth });

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('app-logo')).toBeInTheDocument();
    expect(screen.getByText('GPlus')).toBeInTheDocument();
    expect(screen.getByTestId('language-selector')).toBeInTheDocument();
    expect(screen.getByTestId('dark-mode-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  it('toggles dark mode when the button is clicked', () => {
  renderWithProviders(<Header />, { auth });

    const darkModeToggle = screen.getByTestId('dark-mode-toggle');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(darkModeToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(darkModeToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('changes language when a different language is selected', async () => {
    // Import the exposed changeLanguage mock from the mocked module
    const mod = await import('react-i18next');
    const changeLanguageMock = mod._changeLanguageMock;
    renderWithProviders(<Header />, { auth });

    const selector = screen.getByTestId('language-selector');
    expect(selector).toBeInTheDocument();

    // Change to Arabic
    fireEvent.change(selector, { target: { value: 'ar' } });
    // Wait for microtask so the handler runs
    await new Promise((r) => setTimeout(r, 0));
    expect(changeLanguageMock).toHaveBeenCalledWith('ar');
  });

  it('displays notification badge when notifications are received', async () => {
  renderWithProviders(<Header />, { auth });

    // Initially there should be no badge
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();

    // Emit a test notification using the global websocket mock. Delay one microtask
    // so the component's useEffect subscription has been installed.
    await new Promise((r) => setTimeout(r, 0));
  // Use the shim's emit helper to simulate a server push
  const wsAny = /** @type {any} */ (websocketService);
  wsAny.emitToTest('notification');

    // Wait for the badge to appear (state updates are async)
    const badge = await screen.findByTestId('notification-badge');
    expect(badge).toBeInTheDocument();
    await waitFor(() => expect(badge).toHaveTextContent('1'));
  });

  it('toggles notification dropdown when bell is clicked', async () => {
  renderWithProviders(<Header />, { auth });

    expect(screen.queryByTestId('notifications-dropdown')).not.toBeInTheDocument();

  // Click to open
  fireEvent.click(screen.getByTestId('notification-bell'));
  expect(screen.getByTestId('notifications-dropdown')).toBeInTheDocument();

  // Click to close
  fireEvent.click(screen.getByTestId('notification-bell'));
  expect(screen.queryByTestId('notifications-dropdown')).not.toBeInTheDocument();
  });

  it('resets notification count when opening the notification dropdown', async () => {
  renderWithProviders(<Header />, { auth });

    // Add two notifications, ensuring the subscription is ready first.
    await new Promise((r) => setTimeout(r, 0));
  const wsAny = /** @type {any} */ (websocketService);
  wsAny.emitToTest('notification');
  wsAny.emitToTest('notification');

    // Wait for the badge to show '2'
    const twoBadge = await screen.findByTestId('notification-badge');
    await waitFor(() => expect(twoBadge).toHaveTextContent('2'));

    // Open the dropdown which should reset the count
    fireEvent.click(screen.getByTestId('notification-bell'));
    await waitFor(() => expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument());
  });
});