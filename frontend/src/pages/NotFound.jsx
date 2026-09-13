/**
 * DevConnect 404 — Vite / React Router version
 * (adapted from DevConnect404.jsx, originally written for Next.js)
 *
 * Usage in App.jsx:
 *   import NotFound from './pages/NotFound';
 *   <Route path="*" element={<NotFound />} />
 *
 * Props (both optional):
 *   onBackToDashboard()   — defaults to navigate('/dashboard') via react-router
 *   onReportBrokenLink()  — defaults to a no-op
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

export default function NotFound({ onBackToDashboard, onReportBrokenLink }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const graphRef = useRef(null);
  const pingSourceRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const graph = graphRef.current;
    const pingSource = pingSourceRef.current;
    if (!root || !canvas) return;

    const cleanupFns = [];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- ambient particle network background ---- */
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];
    const mouse = { x: -9999, y: -9999 };
    let rafId = null;
    let active = true;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const count = Math.min(70, Math.floor((w * h) / 22000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.4 + 0.6,
      }));
    }
    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    resize();

    function tick() {
      if (!active) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 110) {
          const f = ((110 - dist) / 110) * 0.55;
          p.x += (dx / dist) * f; p.y += (dy / dist) * f;
        }
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(255,152,162,${0.12 * (1 - d / 130)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,152,162,0.45)';
        ctx.fill();
      }
      if (!reduceMotion) rafId = requestAnimationFrame(tick);
    }
    tick();

    cleanupFns.push(() => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    });

    /* ---- 3D tilt on pointer move ---- */
    if (wrap && !reduceMotion) {
      const onTiltMove = (e) => {
        const r = wrap.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        wrap.style.transform = `perspective(700px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg)`;
      };
      const onTiltLeave = () => { wrap.style.transform = ''; };
      wrap.addEventListener('mousemove', onTiltMove);
      wrap.addEventListener('mouseleave', onTiltLeave);
      cleanupFns.push(() => {
        wrap.removeEventListener('mousemove', onTiltMove);
        wrap.removeEventListener('mouseleave', onTiltLeave);
      });
    }

    /* ---- button ripple ---- */
    const rippleTimeouts = [];
    const btns = Array.from(root.querySelectorAll('.nf-btn'));
    const btnCleanups = [];
    btns.forEach((btn) => {
      const onClick = (e) => {
        const r = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(r.width, r.height) * 1.6;
        ripple.className = 'nf-ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
        btn.appendChild(ripple);
        rippleTimeouts.push(setTimeout(() => ripple.remove(), 600));
      };
      btn.addEventListener('click', onClick);
      btnCleanups.push(() => btn.removeEventListener('click', onClick));
    });
    cleanupFns.push(() => {
      btnCleanups.forEach((fn) => fn());
      rippleTimeouts.forEach((id) => clearTimeout(id));
    });

    /* ---- click the left node to send a retry ping across the broken link ---- */
    const pingTimeouts = [];
    if (pingSource && graph) {
      const onPing = () => {
        for (let i = 0; i < 3; i++) {
          pingTimeouts.push(setTimeout(() => {
            const dot = document.createElement('div');
            dot.style.cssText = `position:absolute;left:20px;top:32px;width:6px;height:6px;margin:-3px 0 0 -3px;
              border-radius:50%;background:#ff98a2;box-shadow:0 0 8px 1px rgba(255,152,162,.8);pointer-events:none;`;
            graph.appendChild(dot);
            dot.animate([
              { transform: 'translateX(0px)', opacity: 1 },
              { transform: 'translateX(88px)', opacity: 1, offset: 0.85 },
              { transform: 'translateX(100px)', opacity: 0 },
            ], { duration: 700, easing: 'ease-in' }).onfinish = () => dot.remove();
          }, i * 140));
        }
      };
      pingSource.addEventListener('click', onPing);
      cleanupFns.push(() => pingSource.removeEventListener('click', onPing));
    }
    cleanupFns.push(() => pingTimeouts.forEach((id) => clearTimeout(id)));

    return () => cleanupFns.forEach((fn) => fn());
  }, []);

  const handleBackToDashboard = () => {
    if (onBackToDashboard) onBackToDashboard();
    else navigate('/workspace');
  };

  const handleReportBrokenLink = () => {
    if (onReportBrokenLink) onReportBrokenLink();
    else navigate('/explore');
  };

  return (
    <div className="nf-root" ref={rootRef}>
      <canvas className="nf-bg-canvas" ref={canvasRef} />

      <section className="nf-page">
        <div className="nf-wrap nf-tilt" ref={wrapRef}>
          <div className="nf-eyebrow">.git/HEAD → unreachable</div>

          <div className="nf-graph" ref={graphRef}>
            <svg viewBox="0 0 280 64" fill="none">
              <line x1="20" y1="32" x2="120" y2="32" stroke="#3a3a40" strokeWidth="2" strokeDasharray="5 5" />
              <line x1="160" y1="32" x2="260" y2="32" stroke="#3a3a40" strokeWidth="2" strokeDasharray="5 5" />
              <circle cx="20" cy="32" r="7" fill="#18181c" stroke="var(--accent, #ff98a2)" strokeWidth="1.5" style={{ cursor: 'pointer' }} ref={pingSourceRef} />
              <circle cx="260" cy="32" r="7" fill="#18181c" stroke="#3a3a40" strokeWidth="1.5" />
            </svg>
            <div className="nf-spark" />
          </div>

          <h1 className="nf-num-404">
            <span className="nf-digit">4</span>
            <span className="nf-digit nf-glitch">0</span>
            <span className="nf-digit">4</span>
            <span className="nf-cursor">_</span>
          </h1>

          <div className="nf-title-404">This connection doesn&apos;t exist</div>
          <p className="nf-desc-404">
            The profile, project or page you followed got dropped from the graph.
            Double check the link, or return to the workspace.
          </p>

          <div className="nf-btn-row" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="join-btn" onClick={handleBackToDashboard}>Back to workspace</button>
            <button className="chip-btn" onClick={handleReportBrokenLink}>Explore DevConnect</button>
          </div>
        </div>
      </section>
    </div>
  );
}