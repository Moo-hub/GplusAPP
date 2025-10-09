import React from 'react';

const Checkbox = ({
	id,
	label,
	name,
	checked = false,
	onChange = () => {},
	...props
}) => (
	<div className="checkbox-wrapper">
		<label htmlFor={id}>
			<input
				type="checkbox"
				id={id}
				name={name}
				checked={checked}
				onChange={onChange}
				{...props}
			/>
			{label}
		</label>
	</div>
);

export default Checkbox;
