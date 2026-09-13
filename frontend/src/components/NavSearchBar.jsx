import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Rocket, User, Sparkles, Command } from 'lucide-react';
import { TEAMS, PROJECTS } from '../pages/explore/data.js';
import { ROSTER } from '../pages/ai/mockPeople.js';
import useUISound from '../hooks/useUISound.js';

export default function NavSearchBar() {
  const [open, setOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { playClick } = useUISound();

  // Aggregate frontend entities into a searchable dataset
  const searchDataset = useMemo(() => {
    const items = [];

    // Teams
    (TEAMS || []).forEach((t) => {
      items.push({
        id: `team-${t.id}`,
        title: t.name,
        subtitle: `${t.type} • ${t.skillsNeeded?.join(', ')}`,
        category: 'Teams',
        icon: Users,
        badge: t.type,
        path: '/explore',
        state: { selectedId: t.id, kind: 'team' },
      });
    });

    // Projects
    (PROJECTS || []).forEach((p) => {
      items.push({
        id: `project-${p.id}`,
        title: p.name,
        subtitle: `${p.type} • ${p.skillsNeeded?.join(', ')}`,
        category: 'Projects',
        icon: Rocket,
        badge: p.type,
        path: '/explore',
        state: { selectedId: p.id, kind: 'project' },
      });
    });

    // People
    (ROSTER || []).forEach((u) => {
      items.push({
        id: `person-${u.id}`,
        title: u.name,
        subtitle: `${u.skills?.join(' • ')}`,
        category: 'People',
        icon: User,
        badge: u.initials,
        path: '/explore',
        state: { filterUser: u.name },
      });
    });

    // Unique skills
    const skillsSet = new Set();
    [...TEAMS, ...PROJECTS].forEach((item) => {
      item.skillsNeeded?.forEach((s) => skillsSet.add(s));
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
  }, []);

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
                        <div className="sn-search-item-title">{item.title}</div>
                        <div className="sn-search-item-sub">{item.subtitle}</div>
                      </div>
                      {item.badge && (
                        <span className="sn-search-badge">{item.badge}</span>
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
