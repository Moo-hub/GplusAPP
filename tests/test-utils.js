// Compatibility shim for test imports under `tests/` folder
// Re-export selected helpers from the project's main test-utils so older
// tests using relative '../test-utils' continue to work.
export * from '../frontend/src/test-utils.js';
