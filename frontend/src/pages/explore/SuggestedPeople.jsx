import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Code2, ChevronRight, Check, Flag, ShieldBan, Search, X } from 'lucide-react';
import useUISound from '../../hooks/useUISound.js';
import { useProfile } from '../../context/ProfileContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { matchupApi, searchApi, userApi } from '../../lib/api.js';
import ReportUserModal from '../../components/ReportUserModal.jsx';

export default function SuggestedPeople({ searchTerm: externalSearch = '' }) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth() || {};
  const [followed, setFollowed] = useState(() => new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [reportingUser, setReportingUser] = useState(null);
  const [dynamicPeople, setDynamicPeople] = useState([]);
  const [searchedPeople, setSearchedPeople] = useState([]);
  const [internalQuery, setInternalQuery] = useState('');
  const [connectionsSet, setConnectionsSet] = useState(() => {
    const s = new Set();
    (authUser?.connections || []).forEach((c) => {
      const cid = String(c?._id || c?.id || c || '');
      const cUser = String(c?.username || '').toLowerCase();
      if (cid) s.add(cid);
      if (cUser) s.add(cUser);
    });
    return s;
  });
  const { playClick } = useUISound();
  const { isUserBlocked, blockUser } = useProfile();

  // Load current user's mutual connections from server
  useEffect(() => {
    if (!authUser?._id) return;
    let isCancelled = false;
    userApi
      .getUserConnections('me')
      .then((res) => {
        if (isCancelled) return;
        const list = res?.connections || (Array.isArray(res) ? res : []);
        setConnectionsSet((prev) => {
          const next = new Set(prev);
          list.forEach((c) => {
            const cid = String(c._id || c.id || c || '');
            const cUsername = String(c.username || '').toLowerCase();
            if (cid) next.add(cid);
            if (cUsername) next.add(cUsername);
          });
          return next;
        });
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [authUser?._id]);

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
              id: String(u._id || `rec_${idx}`),
              _id: String(u._id || `rec_${idx}`),
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
              id: String(u._id || `user_${idx}`),
              _id: String(u._id || `user_${idx}`),
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

  const activeQuery = (internalQuery || externalSearch || '').trim().toLowerCase();

  // Search API live query when typing
  useEffect(() => {
    if (!activeQuery || activeQuery.length < 2) {
      setSearchedPeople([]);
      return;
    }
    let isCancelled = false;
    const timeout = setTimeout(() => {
      searchApi.searchUsers({ q: activeQuery, limit: 10 })
        .then((res) => {
          if (isCancelled) return;
          const list = res?.results || (Array.isArray(res) ? res : []);
          const mapped = list.map((u, idx) => {
            const uName = u.name || 'Developer';
            const initials = uName.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'DV';
            return {
              id: String(u._id || `searched_${idx}`),
              _id: String(u._id || `searched_${idx}`),
              name: uName,
              username: u.username || '',
              initials,
              role: u.skills?.[0] ? `${u.skills[0]} Developer` : (u.college ? `Student @ ${u.college}` : 'Builder'),
              reason: u.skills?.length ? `Stack: ${u.skills.slice(0, 3).join(', ')}` : (u.college || 'Verified Developer'),
              matchScore: Math.max(68, Math.min(96, Math.round((u.reputation?.score || 10) * 1.5 + 72))),
              skills: Array.isArray(u.skills) ? u.skills : [],
              highlight: u.bio || (u.college ? `From ${u.college}` : `Active developer on DevConnect`),
              isConnected: Boolean(u.isConnected),
            };
          });
          setSearchedPeople(mapped);
        })
        .catch(() => {});
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [activeQuery]);

  const isPersonConnected = (p) => {
    const pid = String(p.id || p._id || '');
    const pUsername = String(p.username || '').toLowerCase();
    return Boolean(
      (pid && connectionsSet.has(pid)) ||
      (pUsername && connectionsSet.has(pUsername)) ||
      (pid && followed.has(pid)) ||
      p.isConnected
    );
  };

  const isMe = (p) => {
    const pid = String(p.id || p._id || '');
    const myId = String(authUser?._id || authUser?.id || '');
    const pUser = String(p.username || '').toLowerCase();
    const myUser = String(authUser?.username || '').toLowerCase();
    return (pid && myId && pid === myId) || (pUser && myUser && pUser === myUser);
  };

  const isBlocked = (p) => isUserBlocked(p.id) || isUserBlocked(p.name);

  // Combine dynamicPeople with searchedPeople
  const allCandidates = useMemo(() => {
    const map = new Map();
    dynamicPeople.forEach((p) => map.set(String(p.id || p._id), p));
    searchedPeople.forEach((p) => map.set(String(p.id || p._id), p));
    return Array.from(map.values());
  }, [dynamicPeople, searchedPeople]);

  const visiblePeople = useMemo(() => {
    if (!activeQuery) {
      // RECOMMENDED MODE: Hide self, blocked users, AND ANY ALREADY CONNECTED USERS
      return dynamicPeople.filter((p) => !isMe(p) && !isBlocked(p) && !isPersonConnected(p));
    }

    // SEARCH MODE: Show matching users, and indicate connection status
    return allCandidates.filter((p) => {
      if (isMe(p) || isBlocked(p)) return false;
      const q = activeQuery;
      const nameMatch = String(p.name || '').toLowerCase().includes(q);
      const userMatch = String(p.username || '').toLowerCase().includes(q);
      const skillMatch = (p.skills || []).some((s) => String(s).toLowerCase().includes(q));
      return nameMatch || userMatch || skillMatch;
    });
  }, [activeQuery, dynamicPeople, allCandidates, authUser, connectionsSet, followed, isUserBlocked]);

  const toggleFollow = (id, e) => {
    e.stopPropagation();
    playClick();
    const sid = String(id);
    setFollowed((prev) => {
      const next = new Set(prev);
      next.add(sid);
      return next;
    });
    setConnectionsSet((prev) => {
      const next = new Set(prev);
      next.add(sid);
      return next;
    });
    if (id && sid.length === 24) {
      userApi.sendConnectRequest(id).catch((err) => {
        console.warn('Connect request deferred:', err?.message || err);
      });
    }
  };

  const handleCardClick = (id) => {
    playClick();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <aside className="suggested-panel" aria-label="Suggested developers to connect with">
      <div className="suggested-head">
        <div className="suggested-title-wrap">
          <span>{activeQuery ? 'Search Results' : 'Recommended for you'}</span>
        </div>
        <span className="suggested-badge-count">{visiblePeople.length} builders</span>
      </div>

      {/* Quick Search Input within sidebar */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '6px 12px',
          transition: 'all 0.2s ease',
        }}>
          <Search size={13} color="var(--text-dim, #8e8e93)" />
          <input
            type="text"
            value={internalQuery}
            onChange={(e) => setInternalQuery(e.target.value)}
            placeholder="Search builders..."
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '12px',
              width: '100%',
            }}
          />
          {internalQuery && (
            <button
              type="button"
              onClick={() => setInternalQuery('')}
              style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer', padding: 0 }}
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {visiblePeople.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted, #888)' }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 500 }}>
            {activeQuery ? `No builders found matching "${activeQuery}"` : "You're all connected!"}
          </p>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
            {activeQuery
              ? 'Try searching by a different name, username, or skill.'
              : 'Add skills to your profile to match with more builders.'}
          </p>
        </div>
      ) : (
        <ul className="suggested-list">
          {visiblePeople.map((item, idx) => {
            const connected = isPersonConnected(item);
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
                      {connected && (
                        <span className="suggested-connected-badge" title="Already connected">
                          Connected
                        </span>
                      )}
                      <span className="suggested-role-tag">{item.role || 'Builder'}</span>
                    </div>
                    <span className="suggested-reason">{item.reason || 'Active on DevConnect'}</span>
                  </div>

                  {connected ? (
                    <button
                      type="button"
                      className="suggested-action-btn connected"
                      disabled
                      title="Connected with this user"
                      aria-label={`Connected with ${item.name}`}
                    >
                      <Check size={12} style={{ verticalAlign: '-1px' }} />
                      <span>Connected</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="suggested-action-btn"
                      onClick={(e) => toggleFollow(item.id, e)}
                      title="Connect"
                      aria-label={`Connect with ${item.name}`}
                    >
                      <UserPlus size={12} style={{ verticalAlign: '-1px' }} />
                      <span>Connect</span>
                    </button>
                  )}
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
