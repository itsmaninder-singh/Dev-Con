import React from 'react';
import './ui.css';

/**
 * Shared Badge primitive
 * @param {'accent' | 'dim' | 'success' | 'danger'} variant
 */
export function Badge({
  children,
  variant = 'dim',
  className = '',
  icon = null,
  ...props
}) {
  return (
    <span
      className={`ui-badge ui-badge-${variant} ${className}`}
      {...props}
    >
      {icon && <span className="ui-badge-icon">{icon}</span>}
      {children}
    </span>
  );
}

export default Badge;
