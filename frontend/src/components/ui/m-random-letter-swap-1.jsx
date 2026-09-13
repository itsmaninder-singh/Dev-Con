'use client';

import { RandomLetterSwap } from '@/components/ui/random-letter-swap';

const DEFAULT_LINKS = ['Home', 'Work', 'About', 'Blog', 'Contact'];

export default function RandomLetterSwapNav({ links = DEFAULT_LINKS, className = '' }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        minHeight: '50px',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
      }}
    >
      <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {links.map((link) => (
          <RandomLetterSwap
            className="cursor-pointer font-medium text-muted-foreground text-sm hover:text-foreground"
            key={typeof link === 'string' ? link : link.label || link.to}
            label={typeof link === 'string' ? link : link.label}
            staggerDuration={0.025}
            transition={{ duration: 0.6, type: 'spring' }}
          />
        ))}
      </nav>
    </div>
  );
}

export { RandomLetterSwapNav };
