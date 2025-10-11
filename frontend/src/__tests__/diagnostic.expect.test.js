import { it } from 'vitest';

it('diagnostic: which expect', () => {
  // Log some telltale properties from the global expect implementation
  // Vitest's expect has `extend` and `getState`; chai's expect usually is a function with `.to` chain.
  const e = global.expect || (typeof expect !== 'undefined' && expect);
  // Print constructor and keys
  // eslint-disable-next-line no-console
  console.log('expect type:', typeof e);
  try {
    // eslint-disable-next-line no-console
    console.log('expect keys:', Object.keys(e || {}));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('expect keys error', err && err.message);
  }
  try {
    // eslint-disable-next-line no-console
    console.log('expect.toString()', e && e.toString && e.toString());
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log('expect toString error', err && err.message);
  }
});