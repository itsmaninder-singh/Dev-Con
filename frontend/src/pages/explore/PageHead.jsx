import { useEffect, useRef, useState } from 'react';
import FoldText from '../../components/FoldText.jsx';

const TABS = [
  { id: 'foryou', label: 'For You' },
  { id: 'teams', label: 'Teams' },
  { id: 'projects', label: 'Projects' },
];

export default function PageHead({ totalCount, activeTab, onTabChange }) {
  const headRef = useRef(null);
  const [spotlightOn, setSpotlightOn] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!window.matchMedia('(hover:hover) and (prefers-reduced-motion: no-preference)').matches) return;
    const hero = headRef.current;
    function onMove(e) {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      hero.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      setSpotlightOn(true);
    }
    function onLeave() { setSpotlightOn(false); }
    hero.addEventListener('mousemove', onMove);
    hero.addEventListener('mouseleave', onLeave);
    return () => {
      hero.removeEventListener('mousemove', onMove);
      hero.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <>
      <section
        className={`page-head ${spotlightOn ? 'spotlight-on' : ''} ${entered ? 'entrance-in' : ''}`}
        ref={headRef}
      >
        <div className="eyebrow">{totalCount} open right now</div>
        <h1 className="display">
          <FoldText
            text="Teams are hiring."
            splitBy="char"
            hinge="top"
            trigger="scroll"
            duration={0.65}
            stagger={0.03}
            ease="power3.out"
            perspective={700}
            creaseShading={0.55}
            fontSize="clamp(34px, 5.5vw, 56px)"
            fontWeight={800}
            color="#ffffff"
          />
          <br />
          <FoldText
            text="So are projects."
            splitBy="char"
            hinge="top"
            trigger="scroll"
            duration={0.65}
            stagger={0.03}
            ease="power3.out"
            perspective={700}
            creaseShading={0.55}
            fontSize="clamp(34px, 5.5vw, 56px)"
            fontWeight={800}
            color="#ffffff"
          />
        </h1>
        <p>Everything below is actively looking for someone. Ranked by how well you fit.</p>

        <div className="tab-row">
          {TABS.map(tab => (
            <div
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              style={{ position: 'relative' }}
            >
              {tab.label}
              {tab.badge && (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ff7a7a',
                    marginLeft: '4px',
                    display: 'inline-block',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}