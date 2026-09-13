import { useEffect, useRef } from "react";

/**
 * PLACEHOLDER — replace this file with your real Antigravity component.
 * Prop shape matches what you shared so the Login/Register pages don't
 * need to change when you drop the real implementation in.
 */
export default function Antigravity({
  count = 200,
  magnetRadius = 6,
  ringRadius = 7,
  waveSpeed = 0.4,
  waveAmplitude = 1,
  particleSize = 1.5,
  lerpSpeed = 0.05,
  color = "#FF9FFC",
  autoAnimate = true,
  particleVariance = 1,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width, height;
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: count }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseX: 0,
      baseY: 0,
      vx: 0,
      vy: 0,
      variance: 1 + (Math.random() - 0.5) * particleVariance,
    }));
    particles.forEach((p) => {
      p.baseX = p.x;
      p.baseY = p.y;
    });

    const handleMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", handleMove);

    let t = 0;
    const tick = () => {
      t += waveSpeed * 0.02;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;

      particles.forEach((p) => {
        const wave = Math.sin(t + p.baseX * 0.01) * waveAmplitude;
        let targetX = p.baseX;
        let targetY = p.baseY + wave * 4;

        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const magnetPx = magnetRadius * 20;
        if (dist < magnetPx && dist > 0) {
          const force = (1 - dist / magnetPx) * ringRadius;
          targetX -= (dx / dist) * force * 4;
          targetY -= (dy / dist) * force * 4;
        }

        p.vx = (targetX - p.x) * lerpSpeed;
        p.vy = (targetY - p.y) * lerpSpeed;
        p.x += p.vx;
        p.y += p.vy;

        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(p.x, p.y, particleSize * p.variance, 0, Math.PI * 2);
        ctx.fill();
      });

      if (autoAnimate && !prefersReducedMotion) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [count, magnetRadius, ringRadius, waveSpeed, waveAmplitude, particleSize, lerpSpeed, color, autoAnimate, particleVariance]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    />
  );
}
