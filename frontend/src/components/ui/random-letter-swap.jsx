'use client';

import { motion, useAnimate } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function RandomLetterSwap({
  label,
  reverse = true,
  transition = { duration: 0.6, type: 'spring' },
  staggerDuration = 0.025,
  className,
  onClick,
  ...props
}) {
  const [scope, animate] = useAnimate();
  const [blocked, setBlocked] = useState(false);
  const shuffledRef = useRef(
    Array.from({ length: label.length }, (_, i) => i).sort(
      () => Math.random() - 0.5
    )
  );

  const hoverStart = useCallback(() => {
    if (blocked || !scope.current) return;
    setBlocked(true);

    shuffledRef.current = Array.from({ length: label.length }, (_, i) => i).sort(
      () => Math.random() - 0.5
    );
    const shuffled = shuffledRef.current;

    for (let i = 0; i < label.length; i++) {
      const idx = shuffled[i];
      const mergedTransition = {
        ...transition,
        delay: i * staggerDuration,
      };

      animate(
        `.letter-${idx}`,
        { y: reverse ? '100%' : '-100%' },
        mergedTransition
      ).then(() => {
        if (scope.current) {
          animate(`.letter-${idx}`, { y: 0 }, { duration: 0 });
        }
      });

      animate(
        `.letter-secondary-${idx}`,
        { top: '0%' },
        mergedTransition
      )
        .then(() => {
          if (scope.current) {
            animate(
              `.letter-secondary-${idx}`,
              { top: reverse ? '-100%' : '100%' },
              { duration: 0 }
            );
          }
        })
        .then(() => {
          if (i === label.length - 1) setBlocked(false);
        });
    }
  }, [blocked, label, animate, transition, staggerDuration, reverse, scope]);

  return (
    <motion.span
      aria-label={label}
      className={cn('random-letter-swap-root', className)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={onClick}
      onHoverStart={hoverStart}
      ref={scope}
      {...props}
    >
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {label}
      </span>
      {label.split('').map((letter, i) => (
        <span
          aria-hidden="true"
          style={{
            position: 'relative',
            display: 'inline-flex',
            overflow: 'hidden',
            whiteSpace: 'pre',
            lineHeight: 1,
          }}
          key={i}
        >
          <motion.span
            className={`letter-${i}`}
            style={{
              position: 'relative',
              display: 'inline-block',
              top: 0,
              lineHeight: 'inherit',
            }}
          >
            {letter}
          </motion.span>
          <motion.span
            className={`letter-secondary-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              top: reverse ? '-100%' : '100%',
              display: 'inline-block',
              lineHeight: 'inherit',
            }}
          >
            {letter}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

export default RandomLetterSwap;
