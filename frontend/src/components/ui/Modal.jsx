import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './ui.css';

/**
 * Shared Modal primitive
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '580px',
  className = ''
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div
      className="ui-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal'}
    >
      <div
        className={`ui-modal-dialog ${className}`}
        style={{ maxWidth }}
      >
        <div className="ui-modal-header">
          {title && <h3 className="ui-modal-title">{title}</h3>}
          <button
            type="button"
            className="ui-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="ui-modal-body">
          {children}
        </div>
        {footer && <div className="ui-modal-footer">{footer}</div>}
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}

export default Modal;
