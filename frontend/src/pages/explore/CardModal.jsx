import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIScoreRing from '../../components/ai/AIScoreRing.jsx';
import AILoadingShimmer from '../../components/ai/AILoadingShimmer.jsx';
import { scoreCandidateVsTeam } from '../ai/scoring.js';
import { Sparkles, Check, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import soundManager from '../../utils/soundManager.js';
import { aiApi } from '../../lib/api.js';
import { useProfile } from '../../context/ProfileContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChatUI } from '../../context/ChatUIContext.jsx';

const CIRC = 75.4;

export default function CardModal({ item, onClose, onJoin, showToast, onToast }) {
  const navigate = useNavigate();
  const { profile } = useProfile() || {};
  const { user } = useAuth() || {};
  const { openDirectChatWith } = useChatUI() || {};
  const [joined, setJoined] = useState(false);
  const [fitOpen, setFitOpen] = useState(false);
  const [fitLoading, setFitLoading] = useState(false);
  const [fitResult, setFitResult] = useState(null);
  const [isMessaging, setIsMessaging] = useState(false);

  useEffect(() => {
    if (item) {
      soundManager.playModalOpen();
    }
    setJoined(false);
    setFitOpen(false);
    setFitLoading(false);
    setFitResult(null);
    setIsMessaging(false);
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
  const maxMembers = Math.max(1, Math.min(Number(item?.maxMembers) || 4, 20));
  const membersCount = Number(item?.membersCount) || 1;
  const full = membersCount >= maxMembers;
  const openSpots = Math.max(0, maxMembers - membersCount);

  const creatorName = item?.creator?.name || (typeof item?.owner === 'object' && item?.owner?.name) || 'Developer';
  const creatorInitials = item?.creator?.initials || (creatorName ? creatorName.slice(0, 2).toUpperCase() : 'DV');
  const creatorUsername = item?.creator?.username || (typeof item?.owner === 'object' && item?.owner?.username) || (creatorName ? creatorName.toLowerCase().replace(/\s+/g, '') : 'builder');
  const creatorAvatar = item?.creator?.profilePicture || item?.creator?.avatarUrl || (typeof item?.owner === 'object' && (item?.owner?.profilePicture || item?.owner?.avatarUrl)) || '';

  const creatorId = String(
    item?.creator?._id ||
    item?.creator?.id ||
    (typeof item?.creator === 'string' ? item.creator : '') ||
    item?.owner?._id ||
    item?.owner?.id ||
    (typeof item?.owner === 'string' ? item.owner : '') ||
    ''
  ).trim();
  const creatorUsernameVal = String(item?.creator?.username || item?.owner?.username || creatorUsername || '').toLowerCase();
  const currentUserId = String(user?._id || user?.id || '');
  const currentUsername = String(user?.username || '').toLowerCase();

  const isOwner = Boolean(
    (currentUserId && creatorId && currentUserId === creatorId) ||
    (currentUsername && creatorUsernameVal && currentUsername === creatorUsernameVal)
  );

  const isMember = Boolean(
    item?.isJoined ||
    (Array.isArray(item?.members) && item.members.some((m) => {
      const u = m?.user || m;
      const mId = String(u?._id || u?.id || u || '');
      const mUsername = String(u?.username || '').toLowerCase();
      return (
        (currentUserId && mId && currentUserId === mId) ||
        (currentUsername && mUsername && currentUsername === mUsername)
      );
    })) ||
    (Array.isArray(item?.collaborators) && item.collaborators.some((c) => {
      const u = c?.user || c;
      const cId = String(u?._id || u?.id || u || '');
      const cUsername = String(u?.username || '').toLowerCase();
      return (
        (currentUserId && cId && currentUserId === cId) ||
        (currentUsername && cUsername && currentUsername === cUsername)
      );
    }))
  );

  async function handleCheckFit() {
    setFitOpen(true);
    setFitLoading(true);
    setFitResult(null);

    // User skills from profile or auth
    const userSkills = profile?.skills?.length ? profile.skills : (user?.skills || []);
    const teamSkills = item?.skillsNeeded || [];

    const isRealTeamId = item?._id && /^[0-9a-fA-F]{24}$/.test(item._id);
    if (isRealTeamId) {
      try {
        const aiData = await aiApi.analyzeTeamFit({ teamId: item._id, candidateUserId: user?._id || 'user_current' });
        if (aiData) {
          setFitResult({
            score: aiData.teamBalanceScore || (userSkills.length ? 85 : 50),
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
    if (isOwner || isMember || full) return;
    setJoined(true);
    onJoin(item);
  }

  const handleClose = () => {
    soundManager.playModalClose();
    onClose();
  };

  const displayToast = (msg) => {
    if (showToast) showToast(msg);
    else if (onToast) onToast(msg);
    else if (window.devconnectToast) window.devconnectToast(msg);
  };

  async function handleMessageOwner(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    console.log('[CardModal] Message button clicked for owner:', {
      item,
      creatorId,
      creatorName,
      creatorInitials,
      isOwner,
      currentUserId,
    });

    if (isOwner) {
      console.warn('[CardModal] Blocked: Current user is the owner, cannot message self.');
      displayToast("You cannot message yourself as you are the project owner.");
      return;
    }

    if (isMessaging) {
      console.log('[CardModal] Blocked: Message creation already in flight, ignoring duplicate click.');
      return;
    }

    if (!creatorId) {
      console.error('[CardModal] Error: No valid owner/creator ID found on item:', item);
      displayToast("Could not find the project owner's contact details.");
      return;
    }

    setIsMessaging(true);
    console.log('[CardModal] Initiating chat with owner ID:', creatorId);

    try {
      if (openDirectChatWith) {
        const chat = await openDirectChatWith(creatorId, {
          name: creatorName,
          initial: creatorInitials,
          avatarUrl: creatorAvatar,
          profilePicture: creatorAvatar,
          throwOnError: true,
        });
        console.log('[CardModal] Chat opened/created successfully:', chat);
      } else {
        console.log('[CardModal] Falling back to devconnect:open-chat custom event');
        window.dispatchEvent(
          new CustomEvent('devconnect:open-chat', {
            detail: {
              userId: creatorId,
              name: creatorName,
              initial: creatorInitials,
              avatarUrl: creatorAvatar,
              profilePicture: creatorAvatar,
            },
          })
        );
      }

      // Close project card modal so the user transitions into the active chat drawer
      handleClose();
    } catch (err) {
      console.error('[CardModal] Failed to open conversation with owner:', err);
      displayToast(err?.message || 'Failed to start conversation with owner. Please try again.');
    } finally {
      setIsMessaging(false);
    }
  }

  return (
    <div
      id="modalOverlay"
      className={visible ? 'visible' : ''}
      onClick={(e) => { if (e.target.id === 'modalOverlay') handleClose(); }}
    >
      <style>{`
        @keyframes cardModalSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {item && (
        <div className="modal-card">
          <button className="modal-close" aria-label="Close" onClick={handleClose}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="type-badge">{String(item.type || 'team').replace('-', ' ')}</span>
            {item.postedAgo && <span style={{ fontSize: '11.5px', color: 'var(--dim)' }}>Posted {item.postedAgo}</span>}
          </div>

          <h2>{item.name || 'Untitled'}</h2>

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
            <div
              className="card-owner"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (creatorUsername) navigate(`/profile/${creatorUsername}`);
              }}
              title="View creator profile"
            >
              <div className="avatar-sm">{creatorInitials}</div>
              <div className="owner-name">by <b>{creatorName}</b></div>
            </div>
          </div>

          <div className="modal-section-label">About</div>
          <p className="desc">{item.description || ''}</p>

          <div className="modal-section-label">What they're looking for</div>
          <div className="chip-row" style={{ marginBottom: '24px' }}>
            {(item.skillsNeeded || []).map(s => <span className="skill-chip" key={s}>{s}</span>)}
          </div>

          <div className="modal-section-label">Team</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '10px' }}>
            <div
              className="card-owner"
              style={{ cursor: 'pointer', marginBottom: 0 }}
              onClick={() => {
                if (creatorUsername) navigate(`/profile/${creatorUsername}`);
              }}
              title="View creator profile"
            >
              <div className="avatar-sm">{creatorInitials}</div>
              <div className="owner-name">
                <b>{creatorName}</b> (owner) + {
                  membersCount - 1 > 0
                    ? `${membersCount - 1} member${membersCount - 1 > 1 ? 's' : ''}`
                    : 'no members yet'
                }{openSpots > 0 ? ` · ${openSpots} open spot${openSpots > 1 ? 's' : ''}` : ' · full'}
              </div>
            </div>

            {!isOwner && isMember && (
              <button
                type="button"
                data-chat-trigger="true"
                disabled={isMessaging}
                onClick={handleMessageOwner}
                style={{
                  background: isMessaging ? 'rgba(255, 152, 162, 0.2)' : 'rgba(255, 152, 162, 0.12)',
                  border: '1px solid rgba(255, 152, 162, 0.3)',
                  color: 'var(--coral, #ff98a2)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isMessaging ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.18s ease',
                  opacity: isMessaging ? 0.75 : 1,
                }}
                title={isMessaging ? 'Opening conversation...' : `Message ${creatorName}`}
              >
                {isMessaging ? (
                  <>
                    <Loader2 size={13} style={{ animation: 'cardModalSpin 0.9s linear infinite' }} />
                    <span>Opening...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare size={13} />
                    <span>Message</span>
                  </>
                )}
              </button>
            )}
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

              {isOwner ? (
                <button
                  className="join-btn"
                  disabled
                  style={{
                    opacity: 0.85,
                    cursor: 'default',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    color: 'var(--muted)',
                  }}
                  title="You are the owner of this team/project"
                >
                  <span className="btn-label">You're the owner</span>
                </button>
              ) : isMember ? (
                <button
                  className="join-btn is-joined clickable"
                  type="button"
                  title={item.kind !== 'project' ? "You are a member. Click to view team workspace" : "You are already a member"}
                  onClick={() => {
                    const tid = item._id || item.id;
                    if (item.kind !== 'project' && tid) {
                      handleClose();
                      navigate(`/teams/${tid}`);
                    }
                  }}
                >
                  <Check size={14} />
                  <span className="btn-label">Joined</span>
                </button>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}