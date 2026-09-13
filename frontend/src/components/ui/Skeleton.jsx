import React from 'react';
import './ui.css';

/**
 * Shared Skeleton primitive
 */
export function Skeleton({
  width,
  height,
  borderRadius,
  className = '',
  style = {}
}) {
  return (
    <div
      className={`ui-skeleton ${className}`}
      style={{
        width: width !== undefined ? width : '100%',
        height: height !== undefined ? height : '20px',
        borderRadius: borderRadius !== undefined ? borderRadius : undefined,
        ...style
      }}
    />
  );
}

export default Skeleton;
