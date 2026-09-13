import { useEffect, useRef, useState } from "react";

/**
 * AnimatedNumber — spring-physics count-up animation when element enters viewport.
 *
 * @param {number} value    - Target number to count up to
 * @param {string} suffix   - Text after number, e.g. "+" or "%"
 * @param {string} prefix   - Text before number, e.g. "$"
 * @param {number} duration - Animation duration in ms (default: 1600)
 */
export default function AnimatedNumber({
  value = 0,
  suffix = "",
  prefix = "",
  duration = 1600,
  style = {},
  className = "",
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const rafRef = useRef(null);
  const hasPlayed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed.current) {
          hasPlayed.current = true;
          const start = performance.now();

          const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) {
              rafRef.current = requestAnimationFrame(tick);
            }
          };

          rafRef.current = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span ref={ref} style={style} className={className}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}
