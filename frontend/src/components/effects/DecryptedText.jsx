import { useEffect, useRef, useState } from "react";

const CHARS = "!<>-_\\/[]{}—=+*^?#________";

/**
 * React Bits — Decrypted Text
 * Scrambles through random characters before settling into the real text,
 * left to right. Runs once on mount.
 */
export default function DecryptedText({
  text,
  speed = 35,
  as: Tag = "span",
  style,
  className,
}) {
  const [display, setDisplay] = useState(text.replace(/[^\s]/g, " "));
  const frame = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplay(text);
      return;
    }

    let cancelled = false;
    const totalFrames = text.length * 3;

    const step = () => {
      if (cancelled) return;
      frame.current += 1;
      const revealCount = Math.floor((frame.current / totalFrames) * text.length);

      const next = text
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          if (i < revealCount) return ch;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");

      setDisplay(next);

      if (revealCount < text.length) {
        rafRef.current = setTimeout(step, speed);
      } else {
        setDisplay(text);
      }
    };

    rafRef.current = setTimeout(step, speed);

    return () => {
      cancelled = true;
      clearTimeout(rafRef.current);
    };
  }, [text, speed]);

  return (
    <Tag className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {display}
    </Tag>
  );
}
