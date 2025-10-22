// Simple error logging utility for frontend
export function logError(...args) {
  // Accept either (error) or (message, error) and print a helpful
  // diagnostic. Keep this minimal so tests can rely on console output
  // without throwing when logging undefined values.
  try {
    if (args.length === 0) return console.error('App Error: <no args>');
    if (args.length === 1) return console.error('App Error:', args[0]);
    // message + error
    const [msg, err] = args;
    return console.error('App Error:', msg, err);
  } catch (e) {
    void e; // Best-effort fallback to avoid throwing inside error logging
    try { console.error('logError fallback', e); } catch (_) { void _; }
  }
}

