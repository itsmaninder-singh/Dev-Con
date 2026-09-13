export default function TagInput({ suggestions = [], values, onAdd, onRemove, onToggleSuggestion, placeholder }) {
  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = e.target.value.trim();
      if (val && !values.includes(val)) onAdd(val);
      e.target.value = '';
    } else if (e.key === 'Backspace' && !e.target.value) {
      if (values.length) onRemove(values[values.length - 1]);
    }
  }

  return (
    <>
      {suggestions.length > 0 && (
        <div className="suggest-row">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              className={`suggest-chip ${values.includes(s) ? 'picked' : ''}`}
              onClick={() => onToggleSuggestion(s)}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
      <div className="tag-box">
        {values.map(val => (
          <span className="picked-chip" key={val}>
            {val}
            <button type="button" onClick={() => onRemove(val)}>&times;</button>
          </span>
        ))}
        <input type="text" placeholder={placeholder} onKeyDown={handleKeyDown} />
      </div>
    </>
  );
}