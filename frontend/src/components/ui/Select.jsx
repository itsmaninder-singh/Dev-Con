import React, { forwardRef } from 'react';
import './ui.css';

/**
 * Shared Select primitive
 */
export const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    required = false,
    options = [],
    className = '',
    id,
    children,
    ...props
  },
  ref
) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="ui-form-field">
      {label && (
        <label htmlFor={selectId} className={`ui-form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`ui-select ${error ? 'ui-input-error' : ''} ${className}`}
        {...props}
      >
        {options.length > 0
          ? options.map((opt) => {
              const val = typeof opt === 'object' ? opt.value : opt;
              const lbl = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={val} value={val} style={{ background: '#121216', color: '#f4f4f6' }}>
                  {lbl}
                </option>
              );
            })
          : children}
      </select>
      {error && <p className="ui-form-error">{error}</p>}
      {!error && hint && <p className="ui-form-hint">{hint}</p>}
    </div>
  );
});

export default Select;
