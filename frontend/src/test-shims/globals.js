// Minimal globals shim loaded early in tests to provide common globals
// used by older tests: React (for JSX without explicit import), and some
// testing-library helpers that older tests assume are global.
/* eslint-env node, jest */
import { createRequire } from 'module';
import path from 'path';
const requireCjs = createRequire(path.resolve(process.cwd(), 'package.json'));

try {
  // Ensure React is available globally for legacy tests that omit the import
  let React = null;
  try {
    React = requireCjs('react');
  } catch (e) {
    // fallback to dynamic import without top-level await
    try {
      import('react').then((m) => { const R = m && m.default ? m.default : m; if (!globalThis.React) globalThis.React = R; }).catch(() => {});
  } catch (er) { void er; }
  }
  if (React && typeof React === 'object') {
    // normalize default interop
    const RealReact = React.default ? React.default : React;
    if (!globalThis.React) globalThis.React = RealReact;
  }
} catch (e) { void e; }

// Expose some testing-library helpers as globals if not present
try {
  const tl = requireCjs('@testing-library/react');
  if (tl) {
    if (!globalThis.getByRole) globalThis.getByRole = tl.getByRole;
    if (!globalThis.getByText) globalThis.getByText = tl.getByText;
    if (!globalThis.findByText) globalThis.findByText = tl.findByText;
    if (!globalThis.waitFor) globalThis.waitFor = tl.waitFor;
    if (!globalThis.act) globalThis.act = tl.act || (async (cb) => { await cb(); });
  }
} catch (e) { void e; }

export default {};
