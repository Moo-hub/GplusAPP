import { describe, it } from 'vitest';

describe('debug document', () => {
  it('prints document.createElement type', () => {
    // These logs will appear in the test run stderr so we can inspect
    // what's available in the test environment during setup.
    // eslint-disable-next-line no-console
    console.error('typeof document:', typeof document);
    // eslint-disable-next-line no-console
    console.error('typeof document.createElement:', typeof (document && document.createElement));
    // eslint-disable-next-line no-console
    console.error('typeof window.document:', typeof (window && window.document));
    // eslint-disable-next-line no-console
    console.error('typeof window.document.createElement:', typeof (window && window.document && window.document.createElement));
  });
});
