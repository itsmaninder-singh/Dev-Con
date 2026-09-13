import { useRef, useState } from "react";

/**
 * PLACEHOLDER — replace this file with your real SpecularButton component.
 * Prop shape matches what you shared so the Login/Register pages don't
 * need to change when you drop the real implementation in.
 */
export default function SpecularButton({
  size = "lg",
  radius = 18,
  tint = "#ffffff",
  tintOpacity = 0,
  blur = 0,
  textColor = "#f5f5f5",
  lineColor = "#ffffff",
  baseColor = "#525252",
  intensity = 1,
  shineSize = 10,
  shineFade = 40,
  thickness = 1,
  speed = 0.35,
  followMouse = true,
  proximity = 250,
  autoAnimate = false,
  onClick,
  disabled = false,
  type = "button",
  children,
}) {
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const sizeStyles = {
    sm: { padding: "8px 16px", fontSize: 14 },
    md: { padding: "11px 22px", fontSize: 15 },
    lg: { padding: "14px 28px", fontSize: 16 },
  }[size] || { padding: "14px 28px", fontSize: 16 };

  const handleMove = (e) => {
    if (!followMouse || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  };

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMove}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        borderRadius: radius,
        border: `${thickness}px solid ${lineColor}33`,
        background: `linear-gradient(135deg, ${baseColor}, ${baseColor}dd)`,
        color: textColor,
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        letterSpacing: 0.2,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: `transform ${speed}s ease, box-shadow ${speed}s ease`,
        ...sizeStyles,
        backgroundImage: followMouse || autoAnimate
          ? `radial-gradient(${shineSize * 12}px circle at ${pos.x}% ${pos.y}%, ${tint}${Math.round(
              (0.18 + intensity * 0.12) * 255
            )
              .toString(16)
              .padStart(2, "0")}, transparent ${shineFade}%), linear-gradient(135deg, ${baseColor}, ${baseColor}dd)`
          : undefined,
        filter: blur ? `blur(${blur}px)` : undefined,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = `0 8px 24px ${lineColor}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {children}
    </button>
  );
}
