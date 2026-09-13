import React from 'react';
import './ui.css';

/**
 * Shared Button primitive
 * @param {'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'} variant
 * @param {'sm' | 'md' | 'lg'} size
 * @param {boolean} loading
 * @param {React.ReactNode} icon
 * @param {boolean} iconOnly
 */
export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconOnly = false,
  className = '',
  type = 'button',
  ...props
}) {
  const classNames = [
    'ui-btn',
    `ui-btn-${variant}`,
    `ui-btn-${size}`,
    iconOnly ? 'ui-btn-icon-only' : '',
    disabled || loading ? 'ui-btn-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="ui-btn-spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="ui-btn-icon">{icon}</span>
      ) : null}
      {!iconOnly && children}
    </button>
  );
}

export default Button;
