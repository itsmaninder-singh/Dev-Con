import ChoiceChips from './ChoiceChips.jsx';
import Switch from './Switch.jsx';

const OPEN_OPTIONS = ['Hackathon', 'Open source contribution', 'College project', 'Startup', 'Freelance'];

export default function Step3Availability({ openTo, onToggleOpenTo, isAvailable, onToggleAvailability }) {
  return (
    <div className="step-panel" key="step-3">
      <div className="field">
        <label>Open to</label>
        <ChoiceChips
          options={OPEN_OPTIONS}
          isPicked={(o) => openTo.includes(o)}
          onToggle={onToggleOpenTo}
        />
      </div>
      <div className="toggle-row">
        <div>
          <div className="label-text">{isAvailable ? 'Marked as available' : 'Marked as unavailable'}</div>
          <div className="sub-text">Show up in matches and searches for new teams</div>
        </div>
        <Switch on={isAvailable} onToggle={onToggleAvailability} />
      </div>
    </div>
  );
}