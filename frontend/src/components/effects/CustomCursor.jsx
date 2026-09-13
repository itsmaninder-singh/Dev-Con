import { useEffect, useRef } from "react";

/**
 * React Bits — Cursor (dot + ring)
 * A glowing dot with a slower trailing ring; the ring grows on hover over
 * anything interactive. Disabled automatically on touch devices.
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const ringPos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    ring.style.translate = "0px 0px";
    ring.style.scale = "1";

    const handleMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
      dot.style.translate = `${e.clientX - 3}px ${e.clientY - 3}px`;
    };
    window.addEventListener("mousemove", handleMove);

    let raf;
    const tick = () => {
      ringPos.current.x += (target.current.x - ringPos.current.x) * 0.18;
      ringPos.current.y += (target.current.y - ringPos.current.y) * 0.18;
      ring.style.translate = `${ringPos.current.x - 17}px ${ringPos.current.y - 17}px`;
      raf = requestAnimationFrame(tick);
    };
    tick();

    const interactive = 'a, button, input, [role="button"]';
    const grow = () => (ring.style.scale = "1.8");
    const shrink = () => (ring.style.scale = "1");
    const attachHandlers = () => {
      document.querySelectorAll(interactive).forEach((el) => {
        el.addEventListener("mouseenter", grow);
        el.addEventListener("mouseleave", shrink);
      });
    };
    attachHandlers();

    // re-attach on DOM changes (route switches, form re-renders)
    const observer = new MutationObserver(attachHandlers);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={dotRef} style={styles.dot} aria-hidden="true" />
      <div ref={ringRef} style={styles.ring} aria-hidden="true" />
    </>
  );
}

const styles = {
  dot: {
    position: "fixed",
    top: 0,
    left: 0,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--coral)",
    pointerEvents: "none",
    zIndex: 150,
    willChange: "translate",
  },
  ring: {
    position: "fixed",
    top: 0,
    left: 0,
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "1px solid rgba(255, 152, 162, 0.5)",
    pointerEvents: "none",
    zIndex: 150,
    willChange: "translate, scale",
    transition: "scale 0.25s ease",
  },
};
