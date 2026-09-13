import React from 'react';

/**
 * Shared AILoadingShimmer component.
 * Requirement: "Every AI action shows a lightweight loading state first (2-line 'Reading X... Scoring Y...' shimmer),
 * never an instant result — keeps the AI feel honest about doing work."
 */
export default function AILoadingShimmer({
  line1 = 'Reading inputs & requirements...',
  line2 = 'Generating AI recommendations...',
  className = '',
}) {
  return (
    <div
      className={`ai-loading-shimmer-wrap ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px 20px',
        background: 'rgba(255, 152, 162, 0.04)',
        border: '1px solid rgba(255, 152, 162, 0.18)',
        borderRadius: '14px',
        margin: '12px 0',
        animation: 'aiShimmerPulse 2s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes aiShimmerPulse {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.005); }
        }
        @keyframes aiDotBounce {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            display: 'inline-flex',
            gap: '3px',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#ff98a2',
              animation: 'aiDotBounce 1.2s infinite ease-in-out',
            }}
          />
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#ff98a2',
              animation: 'aiDotBounce 1.2s infinite ease-in-out 0.2s',
            }}
          />
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#ff98a2',
              animation: 'aiDotBounce 1.2s infinite ease-in-out 0.4s',
            }}
          />
        </span>
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--coral, #ff98a2)',
            letterSpacing: '-0.01em',
          }}
        >
          {line1}
        </span>
      </div>
      <div
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontSize: '12px',
          color: 'var(--text-dim, #7a7d81)',
          paddingLeft: '18px',
        }}
      >
        {line2}
      </div>
    </div>
  );
}
