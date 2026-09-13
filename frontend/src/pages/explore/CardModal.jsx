import { useEffect, useState } from 'react';
import AIScoreRing from '../../components/ai/AIScoreRing.jsx';
import AILoadingShimmer from '../../components/ai/AILoadingShimmer.jsx';
import { scoreCandidateVsTeam } from '../ai/scoring.js';
import { Sparkles, Check, AlertCircle } from 'lucide-react';
import soundManager from '../../utils/soundManager.js';
import { aiApi } from '../../lib/api.js';

const CIRC = 75.4;

export default function CardModal({ item, onClose, onJoin }) {
  const [joined, setJoined] = useState(false);
  const [fitOpen, setFitOpen] = useState(false);
  const [fitLoading, setFitLoading] = useState(false);
  const [fitResult, setFitResult] = useState(null);

  useEffect(() => {
    if (item) {
      soundManager.playModalOpen();
    }
    setJoined(false);
    setFitOpen(false);
    setFitLoading(false);
    setFitResult(null);
  }, [item]);

  useEffect(() => {
    function onKeydown(e) {
      if (e.key === 'Escape' && item) {
        soundManager.playModalClose();
        onClose();
      }
    }
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [item, onClose]);

  const visible = !!item;
  const full = item && item.membersCount >= item.maxMembers;
  const openSpots = item ? item.maxMembers - item.membersCount : 0;

  async function handleCheckFit() {
    setFitOpen(true);
    setFitLoading(true);
    setFitResult(null);

    // Baseline current user skills from profile
    const userSkills = ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Socket.io'];
    const teamSkills = item.skillsNeeded || [];

    const isRealTeamId = item._id && /^[0-9a-fA-F]{24}$/.test(item._id);
    if (isRealTeamId) {
      try {
        const aiData = await aiApi.analyzeTeamFit({ teamId: item._id, candidateUserId: 'user_current' });
        if (aiData) {
          setFitResult({
            score: aiData.teamBalanceScore || 88,
            missing: aiData.missingSkills || [],
            extra: userSkills.filter((s) => !teamSkills.includes(s)),
            role: aiData.suggestedRole,
          });
          setFitLoading(false);
          return;
        }
      } catch {
        // fallback
      }
    }

    setTimeout(() => {
      const res = scoreCandidateVsTeam(userSkills, teamSkills);
      setFitResult(res);
      setFitLoading(false);
    }, 700);
  }

  function handleJoin() {
    setJoined(true);
    onJoin(item);
  }

  const handleClose = () => {
    soundManager.playModalClose();
    onClose();
  };

  return (
    <div
      id="modalOverlay"
      className={visible ? 'visible' : ''}
      onClick={(e) => { if (e.target.id === 'modalOverlay') handleClose(); }}
    >
      {item && (
        <div className="modal-card">
          <button className="modal-close" aria-label="Close" onClick={handleClose}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="type-badge">{item.type.replace('-', ' ')}</span>
            {item.postedAgo && <span style={{ fontSize: '11.5px', color: 'var(--dim)' }}>Posted {item.postedAgo}</span>}
          </div>

          <h2>{item.name}</h2>

          <div className="modal-meta">
            {item.matchScore != null && (
              <span className="match-score">
                <svg className="score-ring" viewBox="0 0 30 30">
                  <circle className="track" cx="15" cy="15" r="12" />
                  <circle
                    className="fill"
                    cx="15" cy="15" r="12"
                    style={{ strokeDashoffset: CIRC - (CIRC * item.matchScore) / 100 }}
                  />
                </svg>
                <span className="score-text">{item.matchScore}%</span>
              </span>
            )}
            <div className="card-owner">
              <div className="avatar-sm">{item.creator.initials}</div>
              <div className="owner-name">by <b>{item.creator.name}</b></div>
            </div>
          </div>

          <div className="modal-section-label">About</div>
          <p className="desc">{item.description}</p>

          <div className="modal-section-label">What they're looking for</div>
          <div className="chip-row" style={{ marginBottom: '24px' }}>
            {item.skillsNeeded.map(s => <span className="skill-chip" key={s}>{s}</span>)}
          </div>

          <div className="modal-section-label">Team</div>
          <div className="card-owner" style={{ marginBottom: '22px' }}>
            <div className="avatar-sm">{item.creator.initials}</div>
            <div className="owner-name">
              <b>{item.creator.name}</b> (owner) + {
                item.membersCount - 1 > 0
                  ? `${item.membersCount - 1} member${item.membersCount - 1 > 1 ? 's' : ''}`
                  : 'no members yet'
              }{openSpots > 0 ? ` · ${openSpots} open spot${openSpots > 1 ? 's' : ''}` : ' · full'}
            </div>
          </div>

          {/* AI Tool 4a: Team Fit Check Inline Panel */}
          {fitOpen && (
            <div
              style={{
                background: 'rgba(255, 152, 162, 0.04)',
                border: '1px solid rgba(255, 152, 162, 0.25)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '20px',
                animation: 'aiFadeIn 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--coral, #ff98a2)' }}>
                  ✦ AI Team Fit Assessment
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim, #7a7d81)' }}>Simulated from your stack</span>
              </div>

              {fitLoading && (
                <AILoadingShimmer
                  line1={`Scanning requirements for ${item.name}...`}
                  line2="Matching your skill profile against open team seats..."
                />
              )}

              {!fitLoading && fitResult && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
                      <AIScoreRing score={fitResult.score} size={60} strokeWidth={5} />
                    </div>
                    <div style={{ flex: 1, fontSize: '13px', color: 'var(--muted, #c7c8ca)', lineHeight: 1.55 }}>
                      {fitResult.score >= 75
                        ? `Strong fit — you already cover most of what ${item.name} needs.`
                        : fitResult.score >= 50
                        ? `Partial fit — a couple of gaps worth mentioning in your request.`
                        : `Limited overlap right now with what ${item.name} is looking for.`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '14px' }}>
                    {item.skillsNeeded
                      .filter((s) => !fitResult.missing.includes(s))
                      .map((s) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--muted, #c7c8ca)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--coral, #ff98a2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          <span>Has <b style={{ color: 'var(--ink, #f2f1ed)' }}>{s}</b></span>
                        </div>
                      ))}
                    {fitResult.missing.map((s) => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--dim, #7a7d81)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 152, 162, 0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4M12 16h.01" />
                        </svg>
                        <span>Gap: <b>{s}</b></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card-footer">
            <div className="seats-row">
              <div className="seat-dots">
                {Array.from({ length: item.maxMembers }, (_, i) => (
                  <span key={i} className={`seat-dot ${i < item.membersCount ? 'filled' : ''}`} />
                ))}
              </div>
              <span className="seats-label">{item.membersCount}/{item.maxMembers} spots filled</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!fitOpen && (
                <button
                  type="button"
                  onClick={handleCheckFit}
                  style={{
                    background: 'rgba(255, 152, 162, 0.1)',
                    border: '1px solid rgba(255, 152, 162, 0.3)',
                    color: 'var(--coral, #ff98a2)',
                    padding: '8px 16px',
                    borderRadius: '30px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 152, 162, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 152, 162, 0.1)')}
                >
                  <Sparkles size={12} /> Check your fit
                </button>
              )}

              <button className="join-btn" disabled={full || joined} onClick={handleJoin}>
                <span className="btn-label">
                  {joined ? (
                    <>
                      <svg className="check-draw" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6" /></svg>
                      Requested
                    </>
                  ) : (full ? 'Full' : 'Join')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}