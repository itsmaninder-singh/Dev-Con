import { useRef } from "react";

/**
 * React Bits — Magnet
 * Wraps any element (typically a button) and pulls it toward the cursor
 * while the pointer is within `strength`-scaled range, springing back on
 * mouse leave — same feel as the landing page's magnetic CTA buttons.
 */
export default function Magnet({ children, pull = 0.35, style }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    el.style.transition = "translate 0.3s ease-out";
    el.style.translate = `${relX * pull}px ${relY * pull}px`;
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "translate 0.5s cubic-bezier(0.2, 1.4, 0.4, 1)";
    el.style.translate = "0px 0px";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ display: "inline-block", width: "100%", ...style }}
    >
      {children}
    </div>
  );
}
