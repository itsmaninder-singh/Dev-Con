import { useEffect, useRef, useState } from 'react';

const CIRC = 75.4;
const BURST_COLORS = ['#ff98a2', '#ffd58c', '#ffffff'];

export default function Card({ item, saved, onToggleSave, onJoin, onOpen }) {
  const cardRef = useRef(null);
  const [inView, setInView] = useState(true);
  const [scoreText, setScoreText] = useState('0%');
  const [ringOffset, setRingOffset] = useState(CIRC);
  const [joined, setJoined] = useState(false);
  const [particles, setParticles] = useState([]);
  const [bookmarkPop, setBookmarkPop] = useState(false);
  const [joinPop, setJoinPop] = useState(false);
  const [scoreParticles, setScoreParticles] = useState([]);

  const maxMembers = Math.max(1, Math.min(Number(item?.maxMembers) || 4, 12));
  const membersCount = Number(item?.membersCount) || 1;
  const full = membersCount >= maxMembers;
  const reduceMotion = !window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  const canHover = window.matchMedia('(hover:hover) and (prefers-reduced-motion: no-preference)').matches;

  // reveal-on-scroll, replays each time the card crosses into/out of view
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.05, rootMargin: '0px 0px 50px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [item?.id]);

  // count-up the match score + sweep the ring once the card is in view
  useEffect(() => {
    if (!inView || !item?.matchScore) return;
    let raf;
    const duration = 1000;
    const start = performance.now() + 250; // small delay to match original stagger feel
    function tick(now) {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - t, 3);
      const value = eased * (item.matchScore || 80);
      setScoreText(Math.round(value) + '%');
      setRingOffset(CIRC - (CIRC * value) / 100);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else if (item.matchScore >= 90 && !reduceMotion) {
        const next = Array.from({ length: 12 }, (_, i) => {
          const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
          const dist = 24 + Math.random() * 20;
          return {
            id: `score-${Date.now()}-${i}`,
            color: ['#ff98a2', '#ffd58c', '#8fd6ff', '#ffffff'][i % 4],
            dx: Math.cos(angle) * dist,
            dy: Math.sin(angle) * dist
          };
        });
        setScoreParticles(next);
        setTimeout(() => setScoreParticles([]), 650);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  // subtle mouse tilt + spotlight tracking
  function handleMouseMove(e) {
    if (!canHover || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const px = x / r.width - 0.5;
    const py = y / r.height - 0.5;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
    cardRef.current.style.transform = `translateY(-3px) scale(1.008) perspective(800px) rotateX(${py * -4}deg) rotateY(${px * 5}deg)`;
  }
  function handleMouseLeave() {
    if (!cardRef.current) return;
    cardRef.current.style.transform = '';
  }

  function spawnParticles(count) {
    if (reduceMotion) return;
    const next = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = 28 + Math.random() * 22;
      return {
        id: `${Date.now()}-${i}`,
        color: BURST_COLORS[i % BURST_COLORS.length],
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist
      };
    });
    setParticles(next);
    setTimeout(() => setParticles([]), 650);
  }

  function handleJoinClick(e) {
    e.stopPropagation();
    setJoinPop(true);
    setTimeout(() => setJoinPop(false), 450);
    spawnParticles(10);
    setJoined(true);
    onJoin(item);
  }

  function handleBookmarkClick(e) {
    e.stopPropagation();
    setBookmarkPop(true);
    setTimeout(() => setBookmarkPop(false), 450);
    onToggleSave(item);
  }

  const creatorName = item?.creator?.name || 'Developer';
  const creatorInitials = item?.creator?.initials || (creatorName ? creatorName.slice(0, 2).toUpperCase() : 'DV');

  return (
    <div
      className={`card ${inView ? 'in-view' : ''}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpen(item)}
    >
      <div className="card-top">
        <span className="type-badge">{String(item?.type || 'team').replace('-', ' ')}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {item?.matchScore != null && (
            <span className="match-score">
              <svg className="score-ring" viewBox="0 0 30 30">
                <circle className="track" cx="15" cy="15" r="12" />
                <circle className="fill" cx="15" cy="15" r="12" style={{ strokeDashoffset: ringOffset }} />
              </svg>
              <span className="score-text">{scoreText}</span>
              {scoreParticles.map(p => (
                <span
                  key={p.id}
                  className="burst-particle"
                  style={{ background: p.color, '--dx': `${p.dx}px`, '--dy': `${p.dy}px` }}
                />
              ))}
            </span>
          )}
          <button
            className={`bookmark-btn ${saved ? 'saved' : ''} ${bookmarkPop ? 'pop' : ''}`}
            aria-label="Save"
            onClick={handleBookmarkClick}
          >
            <svg viewBox="0 0 24 24">
              <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
            </svg>
          </button>
        </div>
      </div>

      <h3>{item?.name || 'Untitled'}</h3>
      <p className="desc">{item?.description || ''}</p>

      <div className="chip-row">
        {(item?.skillsNeeded || []).map(s => <span className="skill-chip" key={s}>{s}</span>)}
      </div>

      <div className="card-owner">
        <div className="avatar-sm">{creatorInitials}</div>
        <div className="owner-name">by <b>{creatorName}</b></div>
      </div>

      <div className="card-footer">
        <div className="seats-row">
          <div className="seat-dots">
            {Array.from({ length: maxMembers }, (_, i) => (
              <span key={i} className={`seat-dot ${i < membersCount ? 'filled' : ''}`} />
            ))}
          </div>
          <span className="seats-label">{membersCount}/{maxMembers}</span>
        </div>
        <button
          className={`join-btn ${joinPop ? 'pop' : ''}`}
          disabled={full || joined}
          onClick={handleJoinClick}
        >
          <span className="btn-label">
            {joined ? (
              <>
                <svg className="check-draw" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6" /></svg>
                Requested
              </>
            ) : (full ? 'Full' : 'Join')}
          </span>
          {particles.map(p => (
            <span
              key={p.id}
              className="burst-particle"
              style={{ background: p.color, '--dx': `${p.dx}px`, '--dy': `${p.dy}px` }}
            />
          ))}
        </button>
      </div>
    </div>
  );
}