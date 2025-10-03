export const requestPickup = async (data) => {
  // Build an absolute URL in a robust way so tests (node/jsdom) and
  // different runtime shapes don't cause URL parsing errors.
  const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost';
  let url = null;
  try {
    url = new URL('/api/v1/pickups', origin).href;
  } catch (e) {
    // Fallback to a simple concatenation if URL construction fails
    url = origin.replace(/\/$/, '') + '/api/v1/pickups';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {})
  });
  // Try to parse JSON; if parsing fails, return a generic shape
  const json = await res.json().catch(() => ({}));
  return json;
};