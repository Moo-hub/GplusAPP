import { describe, it, expect } from 'vitest';

// This test asserts that the MSW safety-net handler was not used during
// the test run. If it was used, it indicates a missing/incorrect mock predicate
// and should fail fast in CI so we don't silently accept network-mismatch bugs.

describe('msw safety-net guard', () => {
  it('did not invoke safety-net handler', () => {
    // globalThis.__MSW_SAFETY_NET_COUNT__ is incremented by the safety-net handler
    const count = (typeof globalThis !== 'undefined' && globalThis.__MSW_SAFETY_NET_COUNT__) || 0;
    expect(count).toBe(0);
  });
});
