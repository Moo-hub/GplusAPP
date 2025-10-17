import React from 'react';

const TextField = ({
	id,
	label,
	name,
	value = '',
	onChange = () => {},
	error = '',
	required = false,
	...props
}) => (
	<div className="textfield-wrapper">
		{label && (
			<label htmlFor={id}>
				{label} {required ? <span aria-label="required">*</span> : null}
			</label>
		)}
		<input
			id={id}
			name={name}
			value={value}
			onChange={onChange}
			aria-invalid={!!error}
			aria-describedby={error ? `${id}-error` : undefined}
			required={required}
			{...props}
		/>
		{error && (
			<span id={`${id}-error`} role="alert">
				{error}
			</span>
		)}
	</div>
);

export default TextField;
