import React from 'react';
import './FormComponents.css';

// Safe input component with proper accessibility
export const SafeInput = ({ 
  id, 
  name, 
  type = 'text', 
  label, 
  value, 
  onChange, 
  autoComplete = 'off',
  required = false,
  placeholder,
  error,
  ...props 
}) => {
  const inputId = id || `input-${name}`;
  
  return (
    <div className="form-field">
      <label htmlFor={inputId} className="form-label">
        {label}
        {required && <span className="required-indicator" aria-label="required">*</span>}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`form-input ${error ? 'form-input--error' : ''}`}
        {...props}
      />
      {error && (
        <div id={`${inputId}-error`} className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

// Safe textarea component
export const SafeTextarea = ({ 
  id, 
  name, 
  label, 
  value, 
  onChange, 
  autoComplete = 'off',
  required = false,
  placeholder,
  error,
  rows = 4,
  ...props 
}) => {
  const textareaId = id || `textarea-${name}`;
  
  return (
    <div className="form-field">
      <label htmlFor={textareaId} className="form-label">
        {label}
        {required && <span className="required-indicator" aria-label="required">*</span>}
      </label>
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        className={`form-textarea ${error ? 'form-textarea--error' : ''}`}
        {...props}
      />
      {error && (
        <div id={`${textareaId}-error`} className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

// Safe select component
export const SafeSelect = ({ 
  id, 
  name, 
  label, 
  value, 
  onChange, 
  options = [],
  autoComplete = 'off',
  required = false,
  placeholder,
  error,
  ...props 
}) => {
  const selectId = id || `select-${name}`;
  
  return (
    <div className="form-field">
      <label htmlFor={selectId} className="form-label">
        {label}
        {required && <span className="required-indicator" aria-label="required">*</span>}
      </label>
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={`form-select ${error ? 'form-select--error' : ''}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div id={`${selectId}-error`} className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

// Safe checkbox component
export const SafeCheckbox = ({ 
  id, 
  name, 
  label, 
  checked, 
  onChange, 
  required = false,
  error,
  ...props 
}) => {
  const checkboxId = id || `checkbox-${name}`;
  
  return (
    <div className="form-field form-field--checkbox">
      <div className="checkbox-wrapper">
        <input
          type="checkbox"
          id={checkboxId}
          name={name}
          checked={checked}
          onChange={onChange}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${checkboxId}-error` : undefined}
          className={`form-checkbox ${error ? 'form-checkbox--error' : ''}`}
          {...props}
        />
        <label htmlFor={checkboxId} className="checkbox-label">
          {label}
          {required && <span className="required-indicator" aria-label="required">*</span>}
        </label>
      </div>
      {error && (
        <div id={`${checkboxId}-error`} className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};