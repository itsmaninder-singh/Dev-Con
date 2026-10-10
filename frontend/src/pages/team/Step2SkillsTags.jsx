import TagInput from './TagInput.jsx';

export const PREDEFINED_SKILLS = [
  'React',
  'Node.js',
  'TypeScript',
  'JavaScript',
  'Python',
  'UI/UX',
  'MongoDB',
  'PostgreSQL',
  'Next.js',
  'Tailwind CSS',
  'Docker',
  'Kubernetes',
  'GraphQL',
  'WebSockets',
  'Socket.io',
  'FastAPI',
  'Express',
  'Go',
  'Rust',
  'C++',
  'Java',
  'Spring Boot',
  'Flutter',
  'React Native',
  'AWS',
  'GCP',
  'Azure',
  'DevOps',
  'CI/CD',
  'Redis',
  'Prisma',
  'Solidity',
  'Web3',
  'Figma',
  'AI/LLM',
  'Machine Learning',
  'Data Science',
  'TensorFlow',
  'PyTorch',
  'Firebase',
  'SQL',
  'C#',
  'Django',
  'Flask',
  'Git',
  'Linux',
  'Vue.js',
  'Angular',
];

export const SKILL_ALIASES = {
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  mongo: 'MongoDB',
  mongodb: 'MongoDB',
  tailwind: 'Tailwind CSS',
  tailwindcss: 'Tailwind CSS',
  node: 'Node.js',
  nodejs: 'Node.js',
  react: 'React',
  reactjs: 'React',
  vue: 'Vue.js',
  vuejs: 'Vue.js',
  next: 'Next.js',
  nextjs: 'Next.js',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  js: 'JavaScript',
  javascript: 'JavaScript',
  py: 'Python',
  python: 'Python',
  socketio: 'Socket.io',
  sockets: 'WebSockets',
  websocket: 'WebSockets',
  websockets: 'WebSockets',
  ai: 'AI/LLM',
  llm: 'AI/LLM',
  'ai/llm': 'AI/LLM',
  ml: 'Machine Learning',
  cpp: 'C++',
  'c++': 'C++',
  golang: 'Go',
  go: 'Go',
};

export function resolveValidSkill(input) {
  if (!input || typeof input !== 'string') return null;
  const clean = input.trim().toLowerCase();
  if (SKILL_ALIASES[clean]) return SKILL_ALIASES[clean];
  const exact = PREDEFINED_SKILLS.find((s) => s.toLowerCase() === clean);
  if (exact) return exact;
  return null;
}

const SKILL_SUGGESTIONS = [
  'React',
  'Node.js',
  'TypeScript',
  'Python',
  'UI/UX',
  'MongoDB',
  'Tailwind CSS',
  'Docker',
  'AI/LLM',
  'DevOps',
];

const TAG_SUGGESTIONS = ['hackathon', 'open-source', 'college-project', 'startup'];

export default function Step2SkillsTags({
  skills,
  skillsInvalid = false,
  onAddSkill,
  onRemoveSkill,
  onToggleSkill,
  tags,
  onAddTag,
  onRemoveTag,
  onToggleTag,
}) {
  return (
    <div className="step-panel" key="step-2">
      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ margin: 0 }}>Skills needed <span style={{ color: '#ff98a2', fontSize: '11px' }}>* (Required)</span></label>
          <span style={{ fontSize: '11px', color: skills.length > 0 ? '#81c784' : 'var(--muted)' }}>
            {skills.length} selected
          </span>
        </div>
        <TagInput
          suggestions={SKILL_SUGGESTIONS}
          values={skills}
          onAdd={onAddSkill}
          onRemove={onRemoveSkill}
          onToggleSuggestion={onToggleSkill}
          allowedList={PREDEFINED_SKILLS}
          aliases={SKILL_ALIASES}
          allowCustom={true}
          placeholder="Search and select a skill (e.g. React, Python)…"
        />
        {skillsInvalid && skills.length === 0 && (
          <div
            style={{
              background: 'rgba(255, 107, 107, 0.12)',
              border: '1px solid rgba(255, 107, 107, 0.35)',
              color: '#ff8585',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: '12.5px',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <span>⚠️</span> Please select at least one valid skill needed for your team before proceeding.
          </div>
        )}
      </div>
      <div className="field" style={{ marginTop: '18px' }}>
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