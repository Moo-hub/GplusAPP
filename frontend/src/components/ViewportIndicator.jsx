import React from 'react';

// Minimal ViewportIndicator used in tests. Keeps markup tiny and
// deterministic so tests can query by data-testid.
export default function ViewportIndicator() {
  return <div data-testid="viewport-indicator" />;
}
