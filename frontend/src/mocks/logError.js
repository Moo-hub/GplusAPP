// Shim to ensure MSW and mocks import the canonical logError implementation.
// This avoids duplicate definitions across the codebase and centralizes
// MSW_DEBUG gating behavior in `../logError.js`.
// Shim to ensure MSW and mocks import the canonical logError implementation.
// This avoids duplicate definitions across the codebase and centralizes
// MSW_DEBUG gating behavior in `../logError.js`.
export { logError } from '../logError.js';

