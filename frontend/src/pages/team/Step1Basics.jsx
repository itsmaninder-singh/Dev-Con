import { useEffect, useRef } from 'react';

export default function Step1Basics({ name, onNameChange, invalid, desc, onDescChange }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (invalid) inputRef.current?.focus();
  }, [invalid]);

  return (
    <div className="step-panel" key="step-1">
      <div className="field">
        <label>Team name</label>
        <input
          ref={inputRef}
          type="text"
          maxLength={40}
          placeholder="e.g. Nightowls"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          style={invalid ? { borderColor: 'var(--danger)' } : undefined}
        />
        <span className="char-count">{name.length}/40</span>
      </div>
      <div className="field">
        <label>Description</label>
        <textarea
          maxLength={300}
          rows={4}
          placeholder="What are you building, and what's the vibe?"
          value={desc}
          onChange={(e) => onDescChange(e.target.value)}
        />
        <span className="char-count">{desc.length}/300</span>
      </div>
    </div>
  );
}