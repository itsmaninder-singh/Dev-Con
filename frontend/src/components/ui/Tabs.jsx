import React from 'react';
import './ui.css';

/**
 * Shared Tabs primitive
 */
export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = ''
}) {
  return (
    <div className={`ui-tabs ${className}`} role="tablist">
      {tabs.map((tab) => {
        const id = typeof tab === 'object' ? tab.id : tab;
        const label = typeof tab === 'object' ? tab.label : tab;
        const count = typeof tab === 'object' ? tab.count : undefined;
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`ui-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onChange(id)}
          >
            {label}
            {typeof count === 'number' && (
              <span
                style={{
                  marginLeft: '6px',
                  padding: '1px 6px',
                  fontSize: '10px',
                  borderRadius: '9999px',
                  background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#000' : 'var(--text-dim, #71717a)'
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
