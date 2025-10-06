// Simple serial runner for axe.run to avoid axe concurrency errors in tests.
// Adds a small retry/backoff when axe reports it's already running or when
// a string error is returned (some axe builds return a string message).
const queue = [];
let running = false;

async function runNext() {
  if (running) return;
  const item = queue.shift();
  if (!item) return;
  running = true;
  try {
    const res = await runWithRetries(item.fn);
    item.resolve(res);
  } catch (e) {
    item.reject(e);
  } finally {
    running = false;
    // schedule next microtask to avoid deep recursion
    setTimeout(() => runNext(), 0);
  }
}

async function runWithRetries(fn, maxRetries = 6, delayMs = 20) {
  let lastErr = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      // Some axe builds may return an error string instead of throwing.
      if (typeof result === 'string' && /Axe is already running/.test(result)) {
        lastErr = new Error(result);
        // wait and retry
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      return result;
    } catch (err) {
      // If axe indicates a concurrency issue, retry after a short delay
      const message = err && (err.message || String(err));
      if (message && /Axe is already running/.test(message)) {
        lastErr = err;
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      // Non-retryable error, rethrow
      throw err;
    }
  }
  // Exhausted retries
  throw lastErr || new Error('enqueueAxe: exhausted retries');
}

export function enqueueAxe(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    runNext();
  });
}

export default enqueueAxe;
