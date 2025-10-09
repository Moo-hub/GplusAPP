import React from 'react';

const Select = ({
	id,
	label,
	name,
	value = '',
	onChange = () => {},
	options = [],
	required = false,
	...props
}) => (
	<div className="select-wrapper">
		{label && (
			<label htmlFor={id}>
				{label} {required ? <span aria-label="required">*</span> : null}
			</label>
		)}
		<select
			id={id}
			name={name}
			value={value}
			onChange={onChange}
			required={required}
			{...props}
		>
			{options.map(opt => (
				<option
					key={opt.value || opt.id}
					value={opt.value || opt.id}
					disabled={!!opt.disabled}
				>
					{opt.label || opt.name}
				</option>
			))}
		</select>
	</div>
);

export default Select;
