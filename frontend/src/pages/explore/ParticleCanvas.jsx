import { useEffect, useRef } from 'react';

/* AMBIENT PARTICLE FIELD — faint dots drifting slowly upward behind
   everything. Low count, capped device-pixel-ratio, pauses on tab blur,
   respects reduced-motion. */
export default function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w, h, dots, running = true, rafId;
    const COUNT = 46;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    function seed() {
      dots = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.4,
        speed: Math.random() * 0.25 + 0.05,
        drift: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.35 + 0.08
      }));
    }
    resize();
    seed();

    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    const onVisibility = () => { running = !document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);

    function tick() {
      if (running) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#ffe4e7';
        dots.forEach(d => {
          d.y -= d.speed;
          d.x += d.drift;
          if (d.y < -5) { d.y = h + 5; d.x = Math.random() * w; }
          ctx.globalAlpha = d.alpha;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
      rafId = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return null;
  return <canvas id="bgCanvas" ref={canvasRef} />;
}