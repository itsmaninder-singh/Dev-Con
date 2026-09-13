import { useRef, useState } from "react";

/**
 * PLACEHOLDER — replace this file with your real MagicBento component.
 * Prop shape matches what you shared. Used here as the panel that wraps
 * the auth form (spotlight + border glow + tilt on the card).
 */
export default function MagicBento({
  children,
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = true,
  enableMagnetism = true,
  clickEffect = true,
  spotlightRadius = 300,
  particleCount = 12,
  glowColor = "132, 0, 255",
}) {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({});
  const [spot, setSpot] = useState({ x: 50, y: 50, active: false });

  const handleMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    if (enableSpotlight) setSpot({ x: px, y: py, active: true });

    if (enableTilt || enableMagnetism) {
      const rotX = enableTilt ? (py - 50) / 18 : 0;
      const rotY = enableTilt ? (50 - px) / 18 : 0;
      const shiftX = enableMagnetism ? (px - 50) / 40 : 0;
      const shiftY = enableMagnetism ? (py - 50) / 40 : 0;
      setStyle({
        transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translate(${shiftX}px, ${shiftY}px)`,
      });
    }
  };

  const handleLeave = () => {
    setSpot((s) => ({ ...s, active: false }));
    setStyle({ transform: "perspective(900px) rotateX(0) rotateY(0)" });
  };

  const stars = enableStars
    ? Array.from({ length: particleCount }).map((_, i) => ({
        id: i,
        top: `${(i * 37) % 100}%`,
        left: `${(i * 53) % 100}%`,
        delay: `${(i % 5) * 0.4}s`,
      }))
    : [];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onMouseDown={(e) => {
        if (!clickEffect || !cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setSpot({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
          active: true,
        });
      }}
      style={{
        position: "relative",
        borderRadius: 20,
        border: `1px solid rgba(${glowColor}, ${enableBorderGlow ? 0.4 : 0.15})`,
        background: "var(--surface)",
        boxShadow: enableBorderGlow ? `0 0 40px -10px rgba(${glowColor}, 0.35)` : "none",
        overflow: "hidden",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        textOverflow: textAutoHide ? "ellipsis" : "clip",
        ...style,
      }}
    >
      {enableSpotlight && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: spot.active ? 1 : 0,
            transition: "opacity 0.3s ease",
            background: `radial-gradient(${spotlightRadius}px circle at ${spot.x}% ${spot.y}%, rgba(${glowColor}, 0.15), transparent 70%)`,
          }}
        />
      )}
      {enableStars &&
        stars.map((s) => (
          <span
            key={s.id}
            aria-hidden="true"
            style={{
              position: "absolute",
              top: s.top,
              left: s.left,
              width: 2,
              height: 2,
              borderRadius: "50%",
              background: `rgba(${glowColor}, 0.8)`,
              animation: `bento-twinkle 2.4s ease-in-out ${s.delay} infinite`,
            }}
          />
        ))}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      <style>{`
        @keyframes bento-twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
