import React from 'react';

export default function Checkbox({ id, label, name, ...rest }) {
  return (
    <div className="checkbox">
      <input id={id} name={name} type="checkbox" role="checkbox" {...rest} />
      <label htmlFor={id}>
        {label}
      </label>
    </div>
  );
}
