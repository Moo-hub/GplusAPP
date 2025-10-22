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