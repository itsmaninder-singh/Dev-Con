import { useRef, useState } from "react";

/**
 * SpotlightCard — cursor-tracking radial glow inside the card.
 * Wrap any card content with this.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string}  props.glowColor   - CSS color for the glow (default: coral)
 * @param {number}  props.glowSize    - Radius of the glow in px (default: 300)
 * @param {object}  props.style       - Extra styles on the outer wrapper
 * @param {string}  props.className
 */
export default function SpotlightCard({
  children,
  glowColor = "rgba(255, 152, 162, 0.18)",
  glowSize = 320,
  style = {},
  className = "",
  ...rest
}) {
  const cardRef = useRef(null);
  const [glow, setGlow] = useState({ x: "50%", y: "50%", opacity: 0 });

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setGlow({ x: `${x}px`, y: `${y}px`, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setGlow((g) => ({ ...g, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {/* Spotlight glow layer */}
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          zIndex: 0,
          transition: "opacity 0.25s ease",
          opacity: glow.opacity,
          background: `radial-gradient(${glowSize}px circle at ${glow.x} ${glow.y}, ${glowColor}, transparent 70%)`,
        }}
      />

      {/* Content sits above glow */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
