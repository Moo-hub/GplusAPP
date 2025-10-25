// Universal i18n mock for all tests
export const setupI18nMock = () => {
	const translations = {
		'dashboard.redisMemoryUsage': 'Redis Memory Usage',
		'dashboard.usedMemory': 'Used Memory',
		'dashboard.totalMemory': 'Total Memory',
		'dashboard.fragmentationRatio': 'Fragmentation Ratio',
		'dashboard.connectedClients': 'Connected Clients',
		'dashboard.stable': 'Stable',
		'dashboard.atRate': 'at Rate',
		'auth.welcome': 'Welcome',
		'auth.logout': 'Logout',
		'nav.dashboard': 'Dashboard',
		'nav.points': 'Points',
		'nav.pickups': 'Pickups',
		'nav.companies': 'Companies',
		'nav.profile': 'Profile',
		'nav.performance': 'Performance',
		'dashboard.systemHealth': 'System Health',
		'dashboard.latency': 'Latency',
		'dashboard.connections': 'Connections',
		'dashboard.redisKeyUsage': 'Redis Key Usage',
		'dashboard.totalKeyPatterns': 'Total Key Patterns',
		'dashboard.totalMemoryUsed': 'Total Memory Used',
		'Payment': 'Payment',
		'Credit Card': 'Credit Card',
		'Wallet': 'Wallet',
		'Pickup Schedule': 'Pickup Schedule',
		'Upcoming Requests': 'Upcoming Requests',
		'Past Requests': 'Past Requests',
		'Vehicles': 'Vehicles',
		'loading': 'loading',
		'error': 'error',
		'empty': 'empty',
		'validation.materialsRequired': 'Materials required',
		'validation.dateRequired': 'Date required',
		'validation.addressRequired': 'Address required',
		// Add more keys as needed
	};
	return {
		useTranslation: () => ({
			t: (key) => translations[key] || key,
			i18n: {
				language: 'en',
				changeLanguage: () => Promise.resolve()
			}
		})
	};
};
// Central test utilities aggregator (ESM). Re-export helpers used across tests.
// Keep this file minimal and ESM so tests can import from `../test-utils`.
export * from './test-utils.mockResponse';
export * from './test-utils.jsx';

// Provide a CommonJS-compatible fallback for environments that `require()` this
// file (legacy test scripts). This keeps interop intact while preferring ESM.
try {
	// eslint-disable-next-line no-undef
	if (typeof module !== 'undefined' && module && module.exports && !module.exports.__esModule) {
		// lazy require to avoid evaluating modules at import time
		// eslint-disable-next-line global-require
		module.exports = require('./test-utils.jsx');
	}
} catch (e) {
	// ignore in ESM-first environments
}