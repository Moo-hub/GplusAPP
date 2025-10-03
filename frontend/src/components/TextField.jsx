import React from 'react';

export default function TextField({ id, label, name, error, required, ...rest }) {
  return (
    <div className="text-field">
      {label && (
        <label htmlFor={id} aria-required={required ? 'true' : 'false'}>
          {label} {required ? '*' : ''}
        </label>
      )}
      <input id={id} name={name} required={required} aria-required={required ? 'true' : 'false'} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} {...rest} />
      {error ? <div id={`${id}-error`} role="alert">{error}</div> : null}
    </div>
  );
}
