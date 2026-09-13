import { useRef } from "react";
import soundManager from "../../utils/soundManager.js";

/**
 * React Bits — ClickSpark
 * High-performance, lightweight canvas spark burst on interactive clicks.
 * Automatically synchronizes with the tactile click sound from soundManager.
 * Uses intelligent element filtering to prevent spark spam on plain background clicks or text selection.
 */
export default function ClickSpark({
  children,
  sparkColor = "#ff98a2",
  sparkSize = 8,
  sparkRadius = 16,
  sparkCount = 7,
  duration = 350,
  easing = "ease-out",
  extraScale = 1,
  playSound = true,
  style,
  className = "",
}) {
  const wrapRef = useRef(null);

  const handleClick = (e) => {
    // 1. Accessibility: Check for prefers-reduced-motion
    if (typeof window !== "undefined") {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        // Still play subtle click sound if sound is on
        if (playSound) soundManager.playClick();
        return;
      }
    }

    const wrap = wrapRef.current;
    if (!wrap) return;

    // 2. Intelligent filtering: ensure click originated from or within a meaningful interactive element
    const target = e.target;
    if (target) {
      // Ignore clicks on plain text selections or inputs where typing/caret movement occurs
      const isInput = target.matches && target.matches('input, textarea, [contenteditable="true"]');
      if (isInput) return;

      const interactive = target.closest && target.closest(
        'button, a, [role="button"], [role="tab"], .card, .ui-card-interactive, .tab-btn, .chip-select, .bookmark-btn, .join-btn, .chip-btn, .vis-btn, .modal-cat-pill, .primary-action, .secondary-action, .sn-brand, .sn-links a, .sn-avatar, .ai-tab, select'
      );

      // If wrapped at high-level, only spark if user tapped an interactive component
      if (!interactive && target === wrap) return;
    }

    // 3. Synchronized audio trigger
    if (playSound) {
      soundManager.playClick();
    }

    // 4. Calculate local coordinates relative to the wrapper
    const rect = wrap.getBoundingClientRect();
    const originX = e.clientX - rect.left;
    const originY = e.clientY - rect.top;

    const canvas = document.createElement("canvas");
    canvas.width = rect.width;
    canvas.height = rect.height;
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      pointerEvents: "none",
      zIndex: "999",
    });
    wrap.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      return;
    }

    const count = sparkCount || 7;
    const size = (sparkSize || 8) * (extraScale || 1);
    const maxRadius = (sparkRadius || 16) * (extraScale || 1);
    const animDuration = duration || 350;

    const sparks = Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = (maxRadius / (animDuration / 16.67)) * (0.8 + Math.random() * 0.5);
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: size * (0.7 + Math.random() * 0.6),
        progress: 0,
      };
    });

    const startTime = performance.now();
    let raf;

    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / animDuration);

      // Easing calculation (ease-out cubic / standard)
      const ease = easing === "ease-out" ? 1 - Math.pow(1 - t, 3) : t;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      sparks.forEach((s) => {
        if (t >= 1) return;
        alive = true;

        const currentX = originX + s.vx * (elapsed / 16.67);
        const currentY = originY + s.vy * (elapsed / 16.67);
        const alpha = Math.max(0, 1 - ease);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(currentX, currentY);
        // Draw outward line tail
        const tailX = currentX - s.vx * (s.len / 4);
        const tailY = currentY - s.vy * (s.len / 4);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.restore();
      });

      if (alive && t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        canvas.remove();
      }
    };

    raf = requestAnimationFrame(tick);
    setTimeout(() => {
      cancelAnimationFrame(raf);
      if (canvas.parentNode) canvas.remove();
    }, animDuration + 100);
  };

  return (
    <div
      ref={wrapRef}
      className={className}
      onClickCapture={handleClick}
      style={{ position: "relative", ...style }}
    >
      {children}
    </div>
  );
}

