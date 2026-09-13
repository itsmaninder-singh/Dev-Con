import { useEffect, useRef } from 'react';

export default function CursorFX() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    let target = { x: 0, y: 0 };
    let ringPos = { x: 0, y: 0 };
    let rafId;

    function onMove(e) {
      target = { x: e.clientX, y: e.clientY };
      dot.style.translate = (e.clientX - 3) + 'px ' + (e.clientY - 3) + 'px';
    }
    function tick() {
      ringPos.x += (target.x - ringPos.x) * 0.18;
      ringPos.y += (target.y - ringPos.y) * 0.18;
      ring.style.translate = (ringPos.x - 17) + 'px ' + (ringPos.y - 17) + 'px';
      rafId = requestAnimationFrame(tick);
    }
    tick();
    window.addEventListener('mousemove', onMove);

    function onOver(e) {
      if (e.target.closest('a, button, input, select, textarea')) ring.style.scale = '1.8';
    }
    function onOut(e) {
      if (e.target.closest('a, button, input, select, textarea')) ring.style.scale = '1';
    }
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dotRef} />
      <div className="cursor-ring" ref={ringRef} />
    </>
  );
}