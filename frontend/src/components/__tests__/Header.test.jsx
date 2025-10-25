// import React from 'react'; // Remove duplicate React import
import '../../test-utils/mockWebsocketShim';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('react-i18next');
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

import Header from '../Header';
describe('Header Component', () => {
    // Use a stable spy for all tests
    const changeLanguageSpy = vi.fn(() => Promise.resolve());
    beforeEach(() => {
      vi.clearAllMocks();
      globalThis.__TEST_I18N__ = {
        t: (k) => k,
        i18n: {
          language: 'en',
          changeLanguage: changeLanguageSpy
        }
      };
      document.documentElement.classList.remove('dark');
    });

    afterAll(() => {
      delete globalThis.__TEST_I18N__;
    });
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

  expect(screen.getAllByTestId('app-header')[0]).toBeInTheDocument();
  expect(screen.getAllByTestId('app-logo')[0]).toBeInTheDocument();
  expect(screen.getByText('GPlus')).toBeInTheDocument();
  expect(screen.getAllByTestId('language-selector')[0]).toBeInTheDocument();
  expect(screen.getAllByTestId('dark-mode-toggle')[0]).toBeInTheDocument();
  // notification-bell may appear multiple times, so use getAllByTestId
  expect(screen.getAllByTestId('notification-bell').length).toBeGreaterThan(0);
  });

  it('toggles dark mode when the button is clicked', () => {
  renderWithProviders(<Header />, { auth });

  const darkModeToggle = screen.getAllByTestId('dark-mode-toggle')[0];
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(darkModeToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(darkModeToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('changes language when a different language is selected', async () => {
  // Ensure the spy is set before render
  globalThis.__TEST_I18N__.i18n.changeLanguage = changeLanguageSpy;
  renderWithProviders(<Header />, { auth });

  const selectors = screen.getAllByTestId('language-selector');
  const selector = selectors[0];
  expect(selector).toBeInTheDocument();

  // Change to Arabic
  fireEvent.change(selector, { target: { value: 'ar' } });
  // Wait for microtask so the handler runs
  await new Promise((r) => setTimeout(r, 0));
  expect(changeLanguageSpy).toHaveBeenCalledWith('ar');
  });

  it('displays notification badge when notifications are received', async () => {
  renderWithProviders(<Header />, { auth });

    // Initially there should be no badge
  expect(screen.queryAllByTestId('notification-badge').length).toBe(0);

    // Emit a test notification using the global websocket mock. Delay one microtask
    // so the component's useEffect subscription has been installed.
    await new Promise((r) => setTimeout(r, 0));
  // Use the shim's emit helper to simulate a server push
  const wsAny = /** @type {any} */ (websocketService);
  wsAny.emitToTest('notification');

    // Wait for the badge to appear (state updates are async)
  const badges = await screen.findAllByTestId('notification-badge');
  const badge = badges[0];
  expect(badge).toBeInTheDocument();
  await waitFor(() => expect(badge).toHaveTextContent('1'));
  });

  it('toggles notification dropdown when bell is clicked', async () => {
  renderWithProviders(<Header />, { auth });

  expect(screen.queryAllByTestId('notifications-dropdown').length).toBe(0);

  // Click to open
  const bells = screen.getAllByTestId('notification-bell');
  fireEvent.click(bells[0]);
  expect(screen.getAllByTestId('notifications-dropdown')[0]).toBeInTheDocument();

  // Click to close
  const bells2 = screen.getAllByTestId('notification-bell');
  fireEvent.click(bells2[0]);
  expect(screen.queryAllByTestId('notifications-dropdown').length).toBe(0);
  });

  it('resets notification count when opening the notification dropdown', async () => {
  renderWithProviders(<Header />, { auth });

    // Add two notifications, ensuring the subscription is ready first.
    await new Promise((r) => setTimeout(r, 0));
  const wsAny = /** @type {any} */ (websocketService);
  wsAny.emitToTest('notification');
  wsAny.emitToTest('notification');

    // Wait for the badge to show '2'
  const twoBadges = await screen.findAllByTestId('notification-badge');
  await waitFor(() => expect(twoBadges[0]).toHaveTextContent('2'));

    // Open the dropdown on every header to reset the count everywhere
    const bells3 = screen.getAllByTestId('notification-bell');
    for (const bell of bells3) {
      fireEvent.click(bell);
    }
    await waitFor(() => {
      // For each header, ensure it contains no notification-badge
      const headers = screen.getAllByTestId('app-header');
      for (const header of headers) {
        const badge = header.querySelector('[data-testid="notification-badge"]');
        expect(badge).toBeNull();
      }
    });
  });
});