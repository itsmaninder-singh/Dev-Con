export default function ChoiceChips({ options, isPicked, onToggle }) {
  return (
    <div className="choice-row">
      {options.map(o => (
        <button
          key={o}
          type="button"
          className={`choice-chip ${isPicked(o) ? 'picked' : ''}`}
          onClick={() => onToggle(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}