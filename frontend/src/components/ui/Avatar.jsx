import React from 'react';
import './ui.css';

/**
 * Shared Avatar primitive
 * @param {'sm' | 'md' | 'lg'} size
 */
export function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = ''
}) {
  const getInitials = (n) => {
    if (!n) return '?';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={`ui-avatar ui-avatar-${size} ${className}`} aria-label={alt || name || 'Avatar'}>
      {src ? (
        <img src={src} alt={alt || name} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

export default Avatar;
