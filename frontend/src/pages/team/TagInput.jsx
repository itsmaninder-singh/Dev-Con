import { useState, useRef, useEffect } from 'react';

export default function TagInput({
  suggestions = [],
  values,
  onAdd,
  onRemove,
  onToggleSuggestion,
  placeholder,
  allowedList = null,
  aliases = {},
  allowCustom = true,
  validationErrorMsg = 'Please select a valid skill from the list',
}) {
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAllowed = allowedList
    ? allowedList
        .filter((item) => {
          if (values.includes(item)) return false;
          const q = inputVal.trim().toLowerCase();
          if (!q) return true;
          const lower = item.toLowerCase();
          if (lower.startsWith(q)) return true;
          if (aliases[q] === item) return true;
          if (item.split(/[\s/]/).some((w) => w.toLowerCase().startsWith(q))) return true;
          if (q.length >= 2 && lower.includes(q)) return true;
          return Object.keys(aliases).some((al) => al.startsWith(q) && aliases[al] === item);
        })
        .sort((a, b) => {
          const q = inputVal.trim().toLowerCase();
          if (!q) return 0;
          const aLower = a.toLowerCase();
          const bLower = b.toLowerCase();
          if (aLower === q) return -1;
          if (bLower === q) return 1;
          const aStarts = aLower.startsWith(q);
          const bStarts = bLower.startsWith(q);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return 0;
        })
    : [];

  function tryAdd(val) {
    const trimmed = (val || '').trim();
    if (!trimmed) return;

    if (allowedList && !allowCustom) {
      const lower = trimmed.toLowerCase();
      // Check aliases first (e.g. 'postgres' -> 'PostgreSQL')
      const aliasTarget = aliases[lower];
      let match = null;

      if (aliasTarget && allowedList.includes(aliasTarget)) {
        match = aliasTarget;
      } else {
        match = allowedList.find((item) => item.toLowerCase() === lower);
      }

      if (!match) {
        setError(`"${trimmed}" is not a recognized skill. Please choose from verified skills.`);
        setTimeout(() => setError(''), 4000);
        return;
      }

      if (!values.includes(match)) {
        onAdd(match);
      }
    } else {
      if (!values.includes(trimmed)) {
        onAdd(trimmed);
      }
    }
    setInputVal('');
    setError('');
    setDropdownOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = inputVal.trim();
      if (!trimmed) return;

      const lower = trimmed.toLowerCase();
      // If there is an exact or alias match, prefer that
      const exactMatch = (allowedList || []).find(
        (item) => item.toLowerCase() === lower || aliases[lower] === item
      );
      if (exactMatch) {
        tryAdd(exactMatch);
      } else if (
        filteredAllowed.length > 0 &&
        lower.length >= 3 &&
        filteredAllowed[0].toLowerCase().startsWith(lower)
      ) {
        // Strong prefix match only if user typed at least 3 letters
        tryAdd(filteredAllowed[0]);
      } else {
        tryAdd(trimmed);
      }
    } else if (e.key === 'Backspace' && !inputVal) {
      if (values.length) onRemove(values[values.length - 1]);
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {suggestions.length > 0 && (
        <div className="suggest-row">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className={`suggest-chip ${values.includes(s) ? 'picked' : ''}`}
              onClick={() => {
                if (onToggleSuggestion) {
                  onToggleSuggestion(s);
                } else if (values.includes(s)) {
                  onRemove(s);
                } else {
                  onAdd(s);
                }
              }}
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      <div className="tag-box" style={{ flexWrap: 'wrap', minHeight: '44px' }}>
        {values.map((val) => (
          <span className="picked-chip" key={val}>
            {val}
            <button type="button" onClick={() => onRemove(val)}>
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            setError('');
            if (allowedList) setDropdownOpen(true);
          }}
          onFocus={() => {
            if (allowedList) setDropdownOpen(true);
          }}
          placeholder={values.length === 0 ? placeholder : 'Add more…'}
          onKeyDown={handleKeyDown}
          style={{ flex: 1, minWidth: '120px' }}
        />
      </div>

      {dropdownOpen && allowedList && filteredAllowed.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '180px',
            overflowY: 'auto',
            background: 'rgba(18, 18, 22, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
            zIndex: 100,
            padding: '4px',
          }}
        >
          {filteredAllowed.slice(0, 8).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => tryAdd(item)}
              style={{
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: '#f2f1ed',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 152, 162, 0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span>{item}</span>
              <span style={{ fontSize: '11px', color: '#ff98a2' }}>+ Add</span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--coral, #ff98a2)', fontSize: '11.5px', marginTop: '6px', fontWeight: 500 }}>
          {error}
        </div>
      )}
    </div>
  );
}