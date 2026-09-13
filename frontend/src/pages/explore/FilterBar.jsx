import { useEffect, useRef, useState } from 'react';

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'startup', label: 'Startup' },
  { value: 'open-source', label: 'Open Source' },
  { value: 'college-project', label: 'College Project' },
  { value: 'freelance', label: 'Freelance' }
];

export default function FilterBar({ searchTerm, onSearchChange, typeFilter, onTypeChange }) {
  const inputRef = useRef(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function onKeydown(e) {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, []);

  return (
    <div className={`filter-bar ${entered ? 'entrance-in' : ''}`}>
      <div className="search-wrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7c8ca" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search teams, tech, or skills"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <select
        className="chip-select"
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
      >
        {TYPE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}