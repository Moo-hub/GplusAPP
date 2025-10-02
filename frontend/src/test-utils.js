// Central test utilities aggregator (ESM). Re-export helpers used across tests.
export * from './test-utils.mockResponse';
export * from './test-utils.jsx';

// Intentionally ESM to match the frontend codebase which uses import/export.// Central test utilities for frontend tests. Re-export helpers so tests can import from
// `../test-utils` instead of touching implementation files.
const { mockResponse } = require('./test-utils.mockResponse');

module.exports = { mockResponse };
// Test utils aggregator. Export common helpers used across tests.
export * from './test-utils.mockResponse';

// You can add other shared test utilities here later (render wrappers, providers, etc.)
// Lightweight shim that re-exports the JSX-based implementation so tests and
// existing imports can remain unchanged while runtime JSX lives in .jsx files.
// Keep ts-nocheck to avoid lint/type issues in the shim.
// @ts-nocheck
export * from './test-utils.jsx';