import { useState } from 'react';
import { useTeams } from '../../context/TeamsContext.jsx';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

const VERB_TEMPLATES = [
  { verb: 'Set up {skill} boilerplate', col: 'done' },
  { verb: 'Design the {skill} data model', col: 'done' },
  { verb: 'Build core {skill} module', col: 'inprogress' },
  { verb: 'Wire {skill} to the rest of the app', col: 'inprogress' },
  { verb: 'Write tests for {skill} logic', col: 'todo' },
  { verb: 'Handle edge cases in {skill} flow', col: 'todo' },
  { verb: 'Polish {skill} UI states', col: 'todo' },
  { verb: 'Code review: {skill} module', col: 'review' },
  { verb: 'Document {skill} setup', col: 'backlog' },
  { verb: 'Explore {skill} performance options', col: 'backlog' },
  { verb: 'Add {skill} error monitoring', col: 'backlog' },
];

let idCounter = 0;

/* Real integration: replace generate() with a call to your API — pass the
   team's description/skills and get back a real task breakdown in this
   shape: [{ id, title, column, tag }]. */
function generateTasks(team) {
  const skills = team.skills?.length ? team.skills : ['core'];
  return VERB_TEMPLATES.map((t) => {
    const skill = skills[Math.floor(Math.random() * skills.length)];
    return {
      id: `task-${++idCounter}`,
      title: t.verb.replace('{skill}', skill),
      column: t.col,
      tag: skill,
    };
  });
}

export default function RoadmapKanban() {
  const { teams } = useTeams();
  const [teamId, setTeamId] = useState(teams[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState(null);
  const [dragId, setDragId] = useState(null);

  const team = teams.find((t) => t.id === teamId);

  function generate() {
    if (!team) return;
    setLoading(true);
    setTasks(null);
    setTimeout(() => {
      setTasks(generateTasks(team));
      setLoading(false);
    }, 1100);
  }

  function onDrop(columnId) {
    if (!dragId) return;
    setTasks((prev) => prev.map((t) => (t.id === dragId ? { ...t, column: columnId } : t)));
    setDragId(null);
  }

  return (
    <div className="ai-feature">
      <div className="ai-feature-intro">
        <h2>Generate a roadmap</h2>
        <p>Pick a team — it'll break the work into a starter Kanban board. Drag cards between columns as work moves.</p>
      </div>

      <div className="ai-input-row">
        <select className="ai-select" value={teamId} onChange={(e) => { setTeamId(e.target.value); setTasks(null); }}>
          {teams.length === 0 && <option value="">No teams yet</option>}
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className="join-btn" onClick={generate} disabled={loading || !team}>
          {loading ? 'Generating...' : tasks ? 'Regenerate' : 'Generate roadmap'}
        </button>
      </div>

      {loading && <div className="ai-loading"><span className="ai-spinner" /> breaking the work into tasks...</div>}

      {tasks && (
        <div className="ai-kanban">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.column === col.id);
            return (
              <div
                className="ai-kanban-col"
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(col.id)}
              >
                <div className="ai-kanban-col-head">
                  <span>{col.label}</span>
                  <span className="ai-kanban-count">{colTasks.length}</span>
                </div>
                <div className="ai-kanban-col-body">
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`ai-kanban-card${dragId === t.id ? ' dragging' : ''}`}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                    >
                      <span className="skill-chip" style={{ fontSize: '10px', padding: '2px 8px', color: 'var(--accent, #ff98a2)', borderColor: 'rgba(255,152,162,0.3)' }}>{t.tag}</span>
                      <p>{t.title}</p>
                    </div>
                  ))}
                  {colTasks.length === 0 && <div className="ai-kanban-empty">Drop here</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}