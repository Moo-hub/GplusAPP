import React from 'react';

export default function Toast({ message, type = 'info', visible = true, onDismiss }) {
  if (!visible) return null;

  const role = type === 'error' ? 'alert' : 'status';
  const live = type === 'error' ? 'assertive' : 'polite';

  return (
    <div role={role} aria-live={live} className={`toast toast-${type}`}>
      <div>{message}</div>
      {typeof onDismiss === 'function' && (
        <button aria-label="Dismiss notification" onClick={onDismiss}>Dismiss</button>
      )}
    </div>
  );
}
