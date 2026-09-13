/**
 * React Bits — Noise
 * Full-screen animated film-grain overlay, matching the reference landing
 * page's #filmGrain layer. Purely decorative; sits above everything, never
 * blocks pointer events.
 */
export default function Noise({ opacity = 0.05 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: "-50%",
        width: "200%",
        height: "200%",
        zIndex: 120,
        pointerEvents: "none",
        opacity,
        mixBlendMode: "overlay",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        animation: "grain-shift 0.4s steps(2) infinite",
      }}
    />
  );
}
