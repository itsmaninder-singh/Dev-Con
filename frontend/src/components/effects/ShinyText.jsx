/**
 * React Bits — Shiny Text
 * A metallic highlight sweeps across the text on a loop.
 */
export default function ShinyText({
  text,
  disabled = false,
  speed = 4,
  color = "var(--text)",
  shineColor = "rgba(255, 255, 255, 0.85)",
  as: Tag = "span",
  style,
}) {
  return (
    <Tag
      style={{
        color,
        backgroundImage: disabled
          ? undefined
          : `linear-gradient(110deg, ${color} 40%, ${shineColor} 50%, ${color} 60%)`,
        backgroundSize: "220% 100%",
        WebkitBackgroundClip: disabled ? undefined : "text",
        backgroundClip: disabled ? undefined : "text",
        WebkitTextFillColor: disabled ? undefined : "transparent",
        animation: disabled ? undefined : `shiny-sweep ${speed}s linear infinite`,
        ...style,
      }}
    >
      {text}
      {!disabled && (
        <style>{`
          @keyframes shiny-sweep {
            0% { background-position: 120% 0; }
            100% { background-position: -120% 0; }
          }
        `}</style>
      )}
    </Tag>
  );
}
