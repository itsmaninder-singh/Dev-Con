export default function Step3Settings({ maxMembers, onMaxMembersChange, visibility, onVisibilityChange }) {
  return (
    <div className="step-panel" key="step-3">
      <div className="field">
        <label>Max members</label>
        <div className="slider-row">
          <input
            type="range"
            min={1}
            max={12}
            value={maxMembers}
            className="slider"
            onChange={(e) => onMaxMembersChange(Number(e.target.value))}
          />
          <span className="slider-bubble">{maxMembers}</span>
        </div>
      </div>
      <div className="field">
        <label>Visibility</label>
        <div className="vis-grid">
          <button
            type="button"
            className={`vis-btn ${visibility === 'public' ? 'active' : ''}`}
            onClick={() => onVisibilityChange('public')}
          >
            <strong>Public</strong>
            <span>Anyone browsing can find and request to join</span>
          </button>
          <button
            type="button"
            className={`vis-btn ${visibility === 'private' ? 'active' : ''}`}
            onClick={() => onVisibilityChange('private')}
          >
            <strong>Private</strong>
            <span>Only people you invite can join</span>
          </button>
        </div>
      </div>
    </div>
  );
}