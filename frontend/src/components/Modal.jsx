import React, { useEffect, useRef } from 'react';

export default function Modal({
  children,
  isOpen = true,
  onClose = () => {},
  title,
  ariaLabelledBy,
  headingLevel = 2,
}) {
  const dialogRef = useRef(null);
  const headingId = ariaLabelledBy || (title ? `modal-title-${Math.random().toString(36).slice(2, 8)}` : undefined);

  useEffect(() => {
    if (!isOpen) return;

    // Focus management: try to focus the first focusable element, otherwise
    // focus the dialog itself to ensure screen readers move to it.
    const el = dialogRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (focusable && focusable.length > 0) {
      try { focusable[0].focus && focusable[0].focus(); } catch (e) { el.focus && el.focus(); }
    } else {
      try { el.focus && el.focus(); } catch (e) { /* ignore */ }
    }

    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        try { onClose(); } catch (err) { /* ignore */ }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const headingLevelClamped = Math.max(1, Math.min(6, headingLevel));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="modal"
      ref={dialogRef}
      tabIndex={-1}
    >
      {title && (
        React.createElement(
          `h${headingLevelClamped}`,
          { id: headingId },
          title
        )
      )}
      {children}
    </div>
  );
}
