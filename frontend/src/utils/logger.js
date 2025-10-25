/* eslint-disable no-console */
// Lightweight logger wrapper used to centralize logging behavior.
// In development this forwards to console; in production it can be replaced
// with a no-op or a remote logging sink.
const isDev = typeof process !== 'undefined' ? (process.env.NODE_ENV !== 'production') : true;

const noop = () => {};

function safeCall(fn, ...args) {
  try {
    if (typeof fn === 'function') fn(...args);
  } catch (e) {
    // swallow errors from logging to avoid cascading failures
    void e;
  }
}

export const debug = (...args) => {
  if (!isDev) return;
  safeCall(console.debug, ...args);
};

export const info = (...args) => {
  if (!isDev) return;
  safeCall(console.info, ...args);
};

export const warn = (...args) => {
  safeCall(console.warn, ...args);
};

export const error = (...args) => {
  safeCall(console.error, ...args);
};

export default { debug, info, warn, error };
