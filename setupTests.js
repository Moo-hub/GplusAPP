// Global mock for CSRFService to ensure type-safe returns in tests
vi.mock('./src/services/csrf', () => ({
	default: {
		getToken: vi.fn(() => 'mock-token'),
		setToken: vi.fn(),
		clearToken: vi.fn(),
		refreshToken: vi.fn(() => Promise.resolve('mock-token')),
	},
	useCSRF: () => ({
		token: 'mock-token',
		setToken: vi.fn(),
		refresh: vi.fn(() => Promise.resolve('mock-token')),
		clear: vi.fn(),
	})
}));
// Global mock for WebSocket API to fix service and type errors in tests
global.MockWebSocket = vi.fn(() => ({
	readyState: 1, // OPEN state
	url: 'ws://localhost:8080',
	send: vi.fn(),
	onopen: vi.fn(),
	onmessage: vi.fn(),
	onclose: vi.fn(),
	onerror: vi.fn(),
	close: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	sentMessages: [],
}));
global.WebSocket = global.MockWebSocket;
// Global mock for react-toastify to fix module errors in tests
import { vi, afterEach } from 'vitest';
vi.mock('react-toastify', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		dismiss: vi.fn(),
	},
	ToastContainer: () => null,
	toastify: {
		isActive: vi.fn(() => false),
		update: vi.fn(),
	},
}));
// setupTests.js - Essential test setup for Vitest
import '@testing-library/jest-dom';
// Initialize a minimal i18next instance so components using useTranslation don't crash
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
try {
	if (!i18next.isInitialized) {
		i18next
			.use(initReactI18next)
			.init({
				lng: 'en',
				fallbackLng: 'en',
				resources: { en: { translation: {} } },
				interpolation: { escapeValue: false },
				react: { useSuspense: false },
				initImmediate: false,
			});
	}
} catch (e) {
	// ignore init errors in test bootstrap
}

// Provide a lightweight react-i18next mock by default; specific tests can
// call vi.unmock('react-i18next') to use the real implementation.
vi.mock('react-i18next', () => {
	const t = (key, opts) => (typeof key === 'string' ? key : String(key));
	const i18n = {
		language: 'en',
		languages: ['en', 'ar'],
		changeLanguage: vi.fn(),
		t,
		dir: vi.fn(() => 'ltr'),
		on: vi.fn(),
		off: vi.fn(),
		exists: vi.fn(() => true),
		getFixedT: vi.fn(() => t),
		options: { react: { useSuspense: false } },
	};
	return {
		useTranslation: () => ({ t, i18n }),
		I18nextProvider: ({ children }) => children,
		Trans: ({ children }) => children,
		withTranslation: () => (Component) => Component,
		Translation: ({ children }) => children({ t, i18n }),
		initReactI18next: { type: '3rdParty', init: vi.fn() },
	};
});

// Mock browser globals for Vitest jsdom environment
if (typeof window === 'undefined') {
	global.window = {};
}
if (typeof document === 'undefined') {
	global.document = {};
}
if (typeof navigator === 'undefined') {
	global.navigator = { userAgent: 'node.js' };
}
if (typeof localStorage === 'undefined') {
	global.localStorage = {
		getItem: () => null,
		setItem: () => {},
		removeItem: () => {},
		clear: () => {},
	};
}
if (typeof Storage === 'undefined') {
	global.Storage = function() {};
}

console.log('[setupTests] Browser globals mocked for Vitest');

// Ensure no leaking global stubs across test files
afterEach(() => {
	try { vi.unstubAllGlobals(); } catch (e) {}
	try { if (typeof globalThis !== 'undefined' && globalThis.GenericScreen) delete globalThis.GenericScreen; } catch (e) {}
	try { if (typeof global !== 'undefined' && global.GenericScreen) delete global.GenericScreen; } catch (e) {}
});

export default {};