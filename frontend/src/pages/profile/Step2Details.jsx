import SkillsInput from './SkillsInput.jsx';
import ChoiceChips from './ChoiceChips.jsx';

const EXP_OPTIONS = ['Fresher', '1-2 years', '2-5 years', '5+ years'];

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'US / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
];

export default function Step2Details({
  college, onCollegeChange,
  phone, onPhoneChange,
  skills, onAddSkill, onRemoveSkill, onToggleSkill,
  experience, onSetExperience
}) {
  const currentPhone = typeof phone === 'object' && phone !== null
    ? { countryCode: phone.countryCode || '+91', number: phone.number || '' }
    : (typeof phone === 'string' && phone ? { countryCode: '+91', number: phone.replace(/\D/g, '') } : { countryCode: '+91', number: '' });

  return (
    <div className="step-panel" key="step-2">
      <div className="field">
        <label>College</label>
        <input type="text" value={college} onChange={(e) => onCollegeChange(e.target.value)} />
      </div>
      <div className="field">
        <label>Phone (optional)</label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={currentPhone.countryCode}
            onChange={(e) =>
              onPhoneChange({ countryCode: e.target.value, number: currentPhone.number })
            }
            style={{
              width: '140px',
              flexShrink: 0,
              cursor: 'pointer',
            }}
            title="Country / Calling code"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code + c.country} value={c.code}>
                {c.flag} {c.code} ({c.country})
              </option>
            ))}
          </select>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Enter phone number"
            value={currentPhone.number}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              onPhoneChange({ countryCode: currentPhone.countryCode, number: digits });
            }}
            style={{ flex: 1 }}
          />
        </div>
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