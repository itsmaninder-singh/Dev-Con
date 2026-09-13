const SKILL_SUGGESTIONS = ['React', 'Node.js', 'MongoDB', 'Figma', 'Python', 'DevOps'];

export default function SkillsInput({ skills, onAdd, onRemove, onToggleSuggestion }) {
  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = e.target.value.trim();
      if (val && !skills.includes(val)) {
        onAdd(val);
      }
      e.target.value = '';
    } else if (e.key === 'Backspace' && !e.target.value) {
      onRemove(skills[skills.length - 1]);
    }
  }

  return (
    <>
      <div className="suggest-row">
        {SKILL_SUGGESTIONS.map(s => (
          <button
            key={s}
            type="button"
            className={`suggest-chip ${skills.includes(s) ? 'picked' : ''}`}
            onClick={() => onToggleSuggestion(s)}
          >
            + {s}
          </button>
        ))}
      </div>
      <div className="tag-box">
        {skills.map(val => (
          <span className="picked-chip" key={val}>
            {val}
            <button type="button" onClick={() => onRemove(val)}>&times;</button>
          </span>
        ))}
        <input type="text" placeholder="Type a skill and press Enter" onKeyDown={handleKeyDown} />
      </div>
    </>
  );
}