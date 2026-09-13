import { useEffect, useMemo, useRef, useState } from 'react';
import soundManager from '../../utils/soundManager.js';
import './Sketchbook.css';

function PageContent({ page }) {
  if (!page) return null;
  return (
    <div className="sk-content">
      {page.kicker && <span className="sk-kicker">{page.kicker}</span>}
      <h3 className="sk-title">{page.title}</h3>
      <p className="sk-body">{page.body}</p>
    </div>
  );
}

export default function Sketchbook({ pages }) {
  const spreads = useMemo(() => {
    const out = [];
    for (let i = 0; i < pages.length; i += 2) out.push([pages[i], pages[i + 1] || null]);
    return out;
  }, [pages]);
  const totalSpreads = spreads.length;

  const [spreadIdx, setSpreadIdx] = useState(0);
  const [flip, setFlip] = useState(null); // { dir: 'next' | 'prev' } | null
  const bookRef = useRef(null);

  const [curLeft, curRight] = spreads[spreadIdx] || [null, null];
  const [nextLeft, nextRight] = spreads[spreadIdx + 1] || [null, null];
  const [prevLeft, prevRight] = spreads[spreadIdx - 1] || [null, null];

  function goNext() {
    if (flip || spreadIdx >= totalSpreads - 1) return;
    soundManager.playPageFlip();
    setFlip({ dir: 'next' });
  }
  function goPrev() {
    if (flip || spreadIdx <= 0) return;
    soundManager.playPageFlip();
    setFlip({ dir: 'prev' });
  }

  useEffect(() => {
    if (!flip) return;
    const t = setTimeout(() => {
      setSpreadIdx((i) => (flip.dir === 'next' ? i + 1 : i - 1));
      setFlip(null);
    }, 700);
    return () => clearTimeout(t);
  }, [flip]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flip, spreadIdx]);

  const baseLeft = flip?.dir === 'prev' ? prevLeft : curLeft;
  const baseRight = flip?.dir === 'next' ? nextRight : curRight;

  // Follows the cursor like a page resting on a trackpad — a subtle tilt,
  // not a drag; it eases back flat once the pointer leaves.
  function handleMouseMove(e) {
    const el = bookRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 10).toFixed(2)}deg)`;
  }
  function handleMouseLeave() {
    const el = bookRef.current;
    if (el) el.style.transform = 'rotateX(0deg) rotateY(0deg)';
  }

  return (
    <div className="sk-wrap">
      <div
        className="sk-book"
        ref={bookRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="sk-stack s3" aria-hidden="true" />
        <div className="sk-stack s2" aria-hidden="true" />
        <div className="sk-stack s1" aria-hidden="true" />

        <div className="sk-half sk-left" onClick={goPrev} role="button" tabIndex={-1} aria-label="Previous page">
          <PageContent page={baseLeft} />
        </div>
        <div className="sk-half sk-right" onClick={goNext} role="button" tabIndex={-1} aria-label="Next page">
          <PageContent page={baseRight} />
        </div>
        <div className="sk-spine" aria-hidden="true" />

        {flip?.dir === 'next' && (
          <div className="sk-leaf leaf-next">
            <div className="sk-face front"><PageContent page={curRight} /></div>
            <div className="sk-face back"><PageContent page={nextLeft} /></div>
          </div>
        )}
        {flip?.dir === 'prev' && (
          <div className="sk-leaf leaf-prev">
            <div className="sk-face front"><PageContent page={curLeft} /></div>
            <div className="sk-face back"><PageContent page={prevRight} /></div>
          </div>
        )}
      </div>
    </div>
  );
}