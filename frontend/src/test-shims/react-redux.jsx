import React from 'react';

// Minimal react-redux shim for tests that only need Provider shape
export function Provider({ children }) {
  return React.createElement(React.Fragment, null, children);
}

export function connect() {
  return (Component) => Component;
}

export default { Provider, connect };
