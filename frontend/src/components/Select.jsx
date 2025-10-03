import React from 'react';

export default function Select({ id, label, name, options = [], ...rest }) {
  return (
    <div className="select">
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} name={name} {...rest}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
