import SkillsInput from './SkillsInput.jsx';
import ChoiceChips from './ChoiceChips.jsx';

const EXP_OPTIONS = ['Fresher', '1-2 years', '2-5 years', '5+ years'];

export default function Step2Details({
  college, onCollegeChange,
  phone, onPhoneChange,
  skills, onAddSkill, onRemoveSkill, onToggleSkill,
  experience, onSetExperience
}) {
  return (
    <div className="step-panel" key="step-2">
      <div className="field">
        <label>College</label>
        <input type="text" value={college} onChange={(e) => onCollegeChange(e.target.value)} />
      </div>
      <div className="field">
        <label>Phone (optional)</label>
        <input
          type="tel"
          placeholder="+91 98765 43210"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Skills</label>
        <SkillsInput
          skills={skills}
          onAdd={onAddSkill}
          onRemove={onRemoveSkill}
          onToggleSuggestion={onToggleSkill}
        />
      </div>
      <div className="field">
        <label>Experience</label>
        <ChoiceChips
          options={EXP_OPTIONS}
          isPicked={(o) => experience === o}
          onToggle={onSetExperience}
        />
      </div>
    </div>
  );
}