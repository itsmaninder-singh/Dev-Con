import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Rocket, User, Sparkles, Command } from 'lucide-react';
import { useTeams } from '../context/TeamsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { searchApi, userApi } from '../lib/api.js';
import useUISound from '../hooks/useUISound.js';

export default function NavSearchBar() {
  const { teams = [], projects = [] } = useTeams() || {};
  const { user } = useAuth() || {};
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [liveUsers, setLiveUsers] = useState([]);
  const [connectionsSet, setConnectionsSet] = useState(() => {
    const s = new Set();
    (user?.connections || []).forEach((c) => {
      const cid = String(c?._id || c?.id || c || '');
      const cUser = String(c?.username || '').toLowerCase();
      if (cid) s.add(cid);
      if (cUser) s.add(cUser);
    });
    return s;
  });
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { playClick } = useUISound();

  // Load user connections to identify connected status
  useEffect(() => {
    if (!user?._id) return;
    let active = true;
    userApi
      .getUserConnections('me')
      .then((res) => {
        if (!active) return;
        const list = res?.connections || (Array.isArray(res) ? res : []);
        setConnectionsSet((prev) => {
          const next = new Set(prev);
          list.forEach((c) => {
            const cid = String(c?._id || c?.id || c || '');
            const cUser = String(c?.username || '').toLowerCase();
            if (cid) next.add(cid);
            if (cUser) next.add(cUser);
          });
          return next;
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [user?._id]);

  // Live search users from backend when query is entered
  useEffect(() => {
    const q = query.trim();
    if (!q || q.length < 2) {
      setLiveUsers([]);
      return;
    }
    let active = true;
    const t = setTimeout(() => {
      searchApi
        .searchUsers({ q, limit: 6 })
        .then((res) => {
          if (!active) return;
          const list = res?.results || (Array.isArray(res) ? res : []);
          setLiveUsers(list);
        })
        .catch(() => {});
    }, 200);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  // Aggregate frontend entities into a searchable dataset
  const searchDataset = useMemo(() => {
    const items = [];

    // Teams
    (teams || []).forEach((t) => {
      const tid = t._id || t.id;
      const tskills = t.skillsNeeded || t.skills || [];
      items.push({
        id: `team-${tid}`,
        title: t.name,
        subtitle: `${t.type || 'team'} • ${tskills.join(', ')}`,
        category: 'Teams',
        icon: Users,
        badge: t.type || 'team',
        path: '/explore',
        state: { selectedId: tid, kind: 'team' },
      });
    });

    // Projects
    (projects || []).forEach((p) => {
      const pid = p._id || p.id;
      const pskills = p.skills || p.skillsNeeded || [];
      items.push({
        id: `project-${pid}`,
        title: p.name,
        subtitle: `${p.category || p.type || 'project'} • ${pskills.join(', ')}`,
        category: 'Projects',
        icon: Rocket,
        badge: p.category || p.type || 'project',
        path: '/explore',
        state: { selectedId: pid, kind: 'project' },
      });
    });

    // People from teams, projects, and live backend search
    const peopleMap = new Map();

    const addPerson = (u, defaultRole = 'Developer', forceConnected = false) => {
      if (!u) return;
      const uid = String(u._id || u.id || u.name || '');
      if (!uid || peopleMap.has(uid)) return;
      const uUsername = String(u.username || '').toLowerCase();
      // Don't show current logged in user
      if (user?._id && String(user._id) === uid) return;
      if (user?.username && user.username.toLowerCase() === uUsername) return;

      const isConnected = Boolean(
        forceConnected ||
        u.isConnected ||
        (uid && connectionsSet.has(uid)) ||
        (uUsername && connectionsSet.has(uUsername))
      );

      peopleMap.set(uid, {
        id: `person-${uid}`,
        title: u.name || u.username || 'Developer',
        subtitle: isConnected
          ? `${defaultRole} • Connected`
          : (u.skills?.length ? `Skills: ${u.skills.slice(0, 3).join(', ')}` : defaultRole),
        category: 'People',
        icon: User,
        badge: isConnected ? 'Connected' : (u.initials || 'DV'),
        isConnected,
        path: u.username ? `/profile/${u.username}` : '/explore',
        state: { filterUser: u.name },
      });
    };

    (teams || []).forEach((t) => {
      (t.members || []).forEach((m) => {
        addPerson(m.user, m.role || 'Team Member');
      });
    });

    (liveUsers || []).forEach((u) => {
      addPerson(
        u,
        u.skills?.[0] ? `${u.skills[0]} Developer` : (u.college ? `Student @ ${u.college}` : 'Developer'),
        u.isConnected
      );
    });

    peopleMap.forEach((person) => items.push(person));

    // Unique skills
    const skillsSet = new Set();
    (teams || []).forEach((item) => {
      (item.skillsNeeded || item.skills || []).forEach((s) => skillsSet.add(s));
    });
    (projects || []).forEach((item) => {
      (item.skills || item.skillsNeeded || []).forEach((s) => skillsSet.add(s));
    });
    skillsSet.forEach((skill) => {
      items.push({
        id: `skill-${skill}`,
        title: skill,
        subtitle: 'Explore matching teams and builders',
        category: 'Skills',
        icon: Sparkles,
        badge: 'Skill',
        path: '/explore',
        state: { searchSkill: skill },
      });
    });

    return items;
  }, [teams, projects, liveUsers, connectionsSet, user]);

  // Filter items matching query
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return searchDataset
      .filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [query, searchDataset]);

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups = {};
    results.forEach((r) => {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    });
    return groups;
  }, [results]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
        setMobileExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation within results
  const handleKeyDown = (e) => {
    if (!open && e.key === 'ArrowDown') {
      setOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        selectResult(results[selectedIndex]);
      } else if (query.trim()) {
        playClick();
        navigate('/explore', { state: { search: query.trim() } });
        setOpen(false);
        setMobileExpanded(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setMobileExpanded(false);
      inputRef.current?.blur();
    }
  };

  const selectResult = (item) => {
    playClick();
    setOpen(false);
    setMobileExpanded(false);
    setQuery('');
    navigate(item.path, { state: item.state });
  };

  const clearQuery = () => {
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`sn-search-wrapper ${mobileExpanded ? 'sn-search-mobile-active' : ''}`}>
      {/* Mobile Trigger Button */}
      <button
        type="button"
        className="sn-search-mobile-btn"
        onClick={() => {
          setMobileExpanded(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        aria-label="Open search"
      >
        <Search size={16} />
      </button>

      {/* Main Search Input Container */}
      <div className={`sn-search-bar ${open ? 'sn-search-bar-active' : ''}`}>
        <Search size={14} className="sn-search-icon" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search teams, people, skills..."
          aria-label="Search teams, people, projects and skills"
          aria-expanded={open && results.length > 0}
          aria-autocomplete="list"
          className="sn-search-input"
        />

        {query ? (
          <button
            type="button"
            className="sn-search-clear-btn"
            onClick={clearQuery}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        ) : (
          <div className="sn-search-kbd-hint">
            <Command size={10} style={{ verticalAlign: '-1px' }} />
            <span>K</span>
          </div>
        )}

        {/* Mobile close button when expanded */}
        {mobileExpanded && (
          <button
            type="button"
            className="sn-search-mobile-close"
            onClick={() => setMobileExpanded(false)}
            aria-label="Close search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {open && query.trim().length > 0 && (
        <div ref={dropdownRef} className="sn-search-dropdown" role="listbox">
          {results.length > 0 ? (
            Object.entries(groupedResults).map(([category, items]) => (
              <div key={category} className="sn-search-group">
                <div className="sn-search-group-title">{category}</div>
                {items.map((item) => {
                  const globalIdx = results.findIndex((r) => r.id === item.id);
                  const isSelected = selectedIndex === globalIdx;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      className={`sn-search-item ${isSelected ? 'selected' : ''}`}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      onClick={() => selectResult(item)}
                    >
                      <div className="sn-search-item-icon">
                        <Icon size={14} />
                      </div>
                      <div className="sn-search-item-body">
                        <div className="sn-search-item-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{item.title}</span>
                          {item.category === 'People' && item.isConnected && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#34d399',
                                background: 'rgba(52, 211, 153, 0.15)',
                                border: '1px solid rgba(52, 211, 153, 0.35)',
                                borderRadius: '8px',
                                padding: '1px 5px',
                                letterSpacing: '0.3px',
                              }}
                            >
                              Connected
                            </span>
                          )}
                        </div>
                        <div className="sn-search-item-sub">{item.subtitle}</div>
                      </div>
                      {item.badge && (
                        <span
                          className={`sn-search-badge ${item.isConnected ? 'sn-badge-connected' : ''}`}
                          style={
                            item.isConnected
                              ? {
                                  color: '#34d399',
                                  borderColor: 'rgba(52, 211, 153, 0.35)',
                                  background: 'rgba(52, 211, 153, 0.12)',
                                  fontWeight: 600,
                                }
                              : {}
                          }
                        >
                          {item.isConnected ? '✓ Connected' : item.badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="sn-search-empty">
              <p>No results found for &ldquo;{query}&rdquo;</p>
              <span>Press Enter to explore all teams matching this keyword</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
