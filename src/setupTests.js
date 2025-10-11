// Repo-root shim for vitest setup file resolution.
// Ensure the Vitest-provided `expect` is set as the global `expect` before
// the frontend bootstrap runs. Some configs or legacy tooling may inject
// Chai's `expect` which causes matcher registration to land on the wrong
// implementation (producing "Invalid Chai property: ..." errors).

import { expect } from 'vitest';

// Force the active global expect to Vitest's expect implementation.
// This makes sure `expect.extend(...)` in the frontend bootstrap applies
// to the same `expect` that tests will use at runtime.
globalThis.expect = expect;

// Now import the canonical frontend setup which will call `expect.extend`.
import '../frontend/src/setupTests.js';