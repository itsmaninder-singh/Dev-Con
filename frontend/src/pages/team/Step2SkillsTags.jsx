import TagInput from './TagInput.jsx';

const SKILL_SUGGESTIONS = ['React', 'Node.js', 'UI/UX', 'MongoDB', 'Python', 'DevOps'];
const TAG_SUGGESTIONS = ['hackathon', 'open-source', 'college-project', 'startup'];

export default function Step2SkillsTags({ skills, onAddSkill, onRemoveSkill, onToggleSkill, tags, onAddTag, onRemoveTag, onToggleTag }) {
  return (
    <div className="step-panel" key="step-2">
      <div className="field">
        <label>Skills needed</label>
        <TagInput
          suggestions={SKILL_SUGGESTIONS}
          values={skills}
          onAdd={onAddSkill}
          onRemove={onRemoveSkill}
          onToggleSuggestion={onToggleSkill}
          placeholder="Type a skill and press Enter"
        />
      </div>
      <div className="field">
        <label>Tags</label>
        <TagInput
          suggestions={TAG_SUGGESTIONS}
          values={tags}
          onAdd={onAddTag}
          onRemove={onRemoveTag}
          onToggleSuggestion={onToggleTag}
          placeholder="Type a tag and press Enter"
        />
      </div>
    </div>
  );
}