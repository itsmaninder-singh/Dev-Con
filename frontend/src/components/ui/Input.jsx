import React, { forwardRef } from 'react';
import './ui.css';

/**
 * Shared Input primitive
 */
export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    required = false,
    className = '',
    id,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="ui-form-field">
      {label && (
        <label htmlFor={inputId} className={`ui-form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`ui-input ${error ? 'ui-input-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="ui-form-error">{error}</p>}
      {!error && hint && <p className="ui-form-hint">{hint}</p>}
    </div>
  );
});

/**
 * Shared Textarea primitive
 */
export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    hint,
    required = false,
    className = '',
    id,
    rows = 3,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="ui-form-field">
      {label && (
        <label htmlFor={inputId} className={`ui-form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`ui-textarea ${error ? 'ui-input-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="ui-form-error">{error}</p>}
      {!error && hint && <p className="ui-form-hint">{hint}</p>}
    </div>
  );
});

export default Input;
