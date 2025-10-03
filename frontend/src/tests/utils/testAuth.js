// Small helper to centralize the test-auth seam used by tests
export function setTestAuth(value) {
  try {
    if (typeof globalThis.setTestAuth === 'function') {
      globalThis.setTestAuth(value);
    } else {
      globalThis.__TEST_AUTH__ = value;
    }
  } catch (e) {}
}

export function clearTestAuth() {
  try {
    if (typeof globalThis.setTestAuth === 'function') {
      globalThis.setTestAuth(null);
    } else {
      globalThis.__TEST_AUTH__ = null;
    }
  } catch (e) {}
}
