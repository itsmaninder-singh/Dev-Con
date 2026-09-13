import React from 'react';

/**
 * Shared AIScoreRing component for displaying circular fit/compatibility scores.
 * Reuses the existing visual design system:
 * Green (>=75%), Amber (50-74%), Red (<50%).
 */
export default function AIScoreRing({
  score = 0,
  size = 56,
  strokeWidth = 4.5,
  showLabel = true,
  labelStyle = {},
  className = '',
  color = '#ff98a2',
}) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const offset = circumference - (circumference * safeScore) / 100;

  const ringColor = color;

  return (
    <div
      className={`ai-score-ring-container ${className}`}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s ease',
            filter: 'drop-shadow(0 0 8px rgba(255, 152, 162, 0.45))',
          }}
        />
      </svg>
      {showLabel && (
        <span
          style={{
            position: 'absolute',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            fontSize: size * 0.28,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text, #f2f1ed)',
            ...labelStyle,
          }}
        >
          {safeScore}%
        </span>
      )}
    </div>
  );
}
