import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Code2, ChevronRight, Check, Flag, ShieldBan } from 'lucide-react';
import useUISound from '../../hooks/useUISound.js';
import { useProfile } from '../../context/ProfileContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { matchupApi, searchApi } from '../../lib/api.js';
import ReportUserModal from '../../components/ReportUserModal.jsx';

export default function SuggestedPeople() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth() || {};
  const [followed, setFollowed] = useState(() => new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [reportingUser, setReportingUser] = useState(null);
  const [dynamicPeople, setDynamicPeople] = useState([]);
  const { playClick } = useUISound();
  const { isUserBlocked, blockUser } = useProfile();

  useEffect(() => {
    let isCancelled = false;

    const loadRealUsers = async () => {
      try {
        const data = await matchupApi.getRecommendedUsers();
        const list = Array.isArray(data) ? data : data?.users || [];
        if (list.length > 0 && !isCancelled) {
          const mapped = list.map((m, idx) => {
            const u = m.user || m;
            const uName = u.name || 'Developer';
            const initials = uName.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'DV';
            return {
              id: u._id || `rec_${idx}`,
              name: uName,
              username: u.username || (u.name ? u.name.toLowerCase().replace(/\s+/g, '') : `user_${idx}`),
              initials,
              role: u.skills?.[0] ? `${u.skills[0]} Developer` : (u.college ? `Student @ ${u.college}` : 'Builder'),
              reason: m.matchPercentage ? `${m.matchPercentage}% match on skills` : (u.skills?.length ? `Skills: ${u.skills.slice(0, 3).join(', ')}` : 'DevConnect Builder'),
              matchScore: m.matchPercentage || Math.max(70, Math.min(98, Math.round(m.matchScore || m.score || 85))),
              skills: Array.isArray(u.skills) ? u.skills : [],
              highlight: u.bio || (u.college ? `Studying at ${u.college}` : 'Active builder on DevConnect'),
            };
          });
          setDynamicPeople(mapped);
          return;
        }
      } catch {
        // Fallback to general user search
      }

      try {
        const searchRes = await searchApi.searchUsers({ limit: 12 });
        const realUsers = searchRes?.results || (Array.isArray(searchRes) ? searchRes : []);
        if (realUsers.length > 0 && !isCancelled) {
          const mapped = realUsers.map((u, idx) => {
            const uName = u.name || 'Developer';
            const initials = uName.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'DV';
            return {
              id: u._id || `user_${idx}`,
              name: uName,
              username: u.username || (u.name ? u.name.toLowerCase().replace(/\s+/g, '') : `user_${idx}`),
              initials,
              role: u.skills?.[0] ? `${u.skills[0]} Developer` : (u.college ? `Student @ ${u.college}` : 'Builder'),
              reason: u.skills?.length ? `Stack: ${u.skills.slice(0, 3).join(', ')}` : (u.college || 'Verified Developer'),
              matchScore: Math.max(68, Math.min(96, Math.round((u.reputation?.score || 10) * 1.5 + 72))),
              skills: Array.isArray(u.skills) ? u.skills : [],
              highlight: u.bio || (u.college ? `From ${u.college}` : `Active developer on DevConnect`),
            };
          });
          setDynamicPeople(mapped);
        } else if (!isCancelled) {
          setDynamicPeople([]);
        }
      } catch (err) {
        console.warn('Could not fetch real users for Explore sidebar:', err);
        if (!isCancelled) setDynamicPeople([]);
      }
    };

    loadRealUsers();
    return () => { isCancelled = true; };
  }, []);

  const visiblePeople = dynamicPeople.filter((p) => {
    if (authUser?._id && (String(p.id) === String(authUser._id) || String(p._id) === String(authUser._id))) {
      return false;
    }
    if (authUser?.username && p.username && p.username.toLowerCase() === authUser.username.toLowerCase()) {
      return false;
    }
    return !isUserBlocked(p.id) && !isUserBlocked(p.name);
  });

  const toggleFollow = (id, e) => {
    e.stopPropagation();
    playClick();
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCardClick = (id) => {
    playClick();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <aside className="suggested-panel" aria-label="Suggested developers to connect with">
      <div className="suggested-head">
        <div className="suggested-title-wrap">
          <span>Recommended for you</span>
        </div>
        <span className="suggested-badge-count">{visiblePeople.length} builders</span>
      </div>

      {visiblePeople.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted, #888)' }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 500 }}>No recommendations yet.</p>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Add skills to your profile to match with builders sharing your stack.</p>
        </div>
      ) : (
        <ul className="suggested-list">
        {visiblePeople.map((item, idx) => {
          const isFollowed = followed.has(item.id);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={`suggested-item-card ${isExpanded ? 'expanded' : ''}`}
              style={{ animationDelay: `${idx * 40}ms` }}
              onClick={() => handleCardClick(item.id)}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const target = item.username || item._id || item.id || (item.name ? item.name.toLowerCase().replace(/\s+/g, '') : '');
                if (target) navigate(`/profile/${target}`);
              }}
              title="Double-click to view profile"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--card-mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--card-mouse-y', `${y}px`);
              }}
            >
              <div className="suggested-item-top">
                <div className="suggested-avatar-wrap">
                  <div className="suggested-avatar">{item.initials || 'DV'}</div>
                  {item.matchScore && (
                    <span className="suggested-score-badge" title={`${item.matchScore}% match`}>
                      {item.matchScore}%
                    </span>
                  )}
                </div>

                <div className="suggested-info">
                  <div className="suggested-name-row">
                    <span className="suggested-name">{item.name || 'Developer'}</span>
                    <span className="suggested-role-tag">{item.role || 'Builder'}</span>
                  </div>
                  <span className="suggested-reason">{item.reason || 'Active on DevConnect'}</span>
                </div>

                <button
                  type="button"
                  className={`suggested-action-btn ${isFollowed ? 'followed' : ''}`}
                  onClick={(e) => toggleFollow(item.id, e)}
                  title={isFollowed ? 'Connected' : 'Connect'}
                  aria-label={isFollowed ? `Connected to ${item.name}` : `Connect with ${item.name}`}
                >
                  {isFollowed ? (
                    <>
                      <Check size={12} style={{ verticalAlign: '-1px' }} />
                      <span>Linked</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={12} style={{ verticalAlign: '-1px' }} />
                      <span>Connect</span>
                    </>
                  )}
                </button>
              </div>

              {/* Skills Tags Strip */}
              <div className="suggested-skills-strip">
                {(item.skills || []).map((s) => (
                  <span key={s} className="suggested-skill-chip">
                    {s}
                  </span>
                ))}
              </div>

              {/* Contextual Highlight / Expanded Drawer */}
              {isExpanded && (
                <div className="suggested-drawer">
                  <div className="suggested-drawer-item">
                    <Code2 size={12} color="#ff98a2" />
                    <span>{item.highlight}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClick();
                          setReportingUser(item);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim, #8e8e93)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 4px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--coral, #ff98a2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim, #8e8e93)')}
                      >
                        <Flag size={11} /> Report
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClick();
                          blockUser(item);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim, #8e8e93)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 4px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ff7b7b')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim, #8e8e93)')}
                      >
                        <ShieldBan size={11} /> Block
                      </button>
                    </div>
                    <div className="suggested-drawer-footer" style={{ margin: 0, padding: 0 }}>
                      <span>Collapse</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      )}

      <ReportUserModal
        isOpen={!!reportingUser}
        onClose={() => setReportingUser(null)}
        targetUser={reportingUser}
      />
    </aside>
  );
}
