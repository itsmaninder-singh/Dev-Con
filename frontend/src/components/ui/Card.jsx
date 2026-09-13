import React from 'react';
import './ui.css';

/**
 * Shared Card primitive
 * @param {boolean} interactive
 */
export function Card({
  children,
  interactive = false,
  className = '',
  onClick,
  ...props
}) {
  const cardRef = React.useRef(null);

  const handleMouseMove = (e) => {
    if (!interactive || !cardRef.current) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);

    const px = (x / rect.width - 0.5) * 4.5;
    const py = (y / rect.height - 0.5) * -4.5;
    cardRef.current.style.setProperty('--tilt-x', `${py}deg`);
    cardRef.current.style.setProperty('--tilt-y', `${px}deg`);
  };

  const handleMouseLeave = () => {
    if (!interactive || !cardRef.current) return;
    cardRef.current.style.removeProperty('--tilt-x');
    cardRef.current.style.removeProperty('--tilt-y');
  };

  const classNames = [
    'ui-card',
    interactive ? 'ui-card-interactive' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={cardRef}
      className={classNames}
      onClick={onClick}
      onMouseMove={interactive ? handleMouseMove : undefined}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
