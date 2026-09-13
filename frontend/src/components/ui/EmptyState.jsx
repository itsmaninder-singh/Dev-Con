import React from 'react';
import './ui.css';

/**
 * Shared EmptyState primitive
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = ''
}) {
  return (
    <div className={`ui-empty-state ${className}`}>
      {icon && <div className="ui-empty-state-icon">{icon}</div>}
      {title && <h4 className="ui-empty-state-title">{title}</h4>}
      {description && <p className="ui-empty-state-desc">{description}</p>}
      {action && <div className="ui-empty-state-action">{action}</div>}
    </div>
  );
}

export default EmptyState;
