/**
 * React Bits — Star Border
 * A soft conic-gradient ring rotates continuously behind the wrapped
 * content's edge, read through a rounded mask — a slow-moving glow along
 * the border rather than a static outline.
 */
export default function StarBorder({ children, color = "#ff98a2", speed = "6s", radius = 20 }) {
  return (
    <div style={{ position: "relative", borderRadius: radius, padding: 1, overflow: "hidden" }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-40%",
          background: `conic-gradient(from 0deg, transparent, ${color}, transparent 30%)`,
          animation: `star-border-spin ${speed} linear infinite`,
        }}
      />
      <div style={{ position: "relative", borderRadius: radius - 1, overflow: "hidden" }}>
        {children}
      </div>
      <style>{`
        @keyframes star-border-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
