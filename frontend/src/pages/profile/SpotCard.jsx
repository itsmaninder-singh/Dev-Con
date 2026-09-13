import { useRef } from 'react';

export default function SpotCard({ children, starBorder = false, style, className = '' }) {
  const ref = useRef(null);

  function handleMouseMove(e) {
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width) * 100 + '%');
    el.style.setProperty('--my', ((e.clientY - rect.top) / rect.height) * 100 + '%');
  }

  const card = (
    <div className={`spot-card ${className}`} style={style} ref={ref} onMouseMove={handleMouseMove}>
      <div className="spot-layer" />
      {children}
    </div>
  );

  if (!starBorder) return card;

  return (
    <div className="star-wrap">
      <div className="star-spin" />
      {card}
    </div>
  );
}