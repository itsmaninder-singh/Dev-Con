import { useState } from 'react';
import { useTeams } from '../../context/TeamsContext.jsx';
import { ROSTER } from './mockPeople.js';

function assignRole(person, teamSkills) {
  const match = teamSkills.find((s) => person.skills.some((ps) => ps.toLowerCase() === s.toLowerCase()));
  if (match) return `${match} lead`;
  if (person.skills.some((s) => /figma|tailwind/i.test(s))) return 'Design support';
  return 'Contributor';
}

/* Real integration: replace this with a call to your API, passing the
   team's actual member list (not the mock ROSTER) and skill requirements. */
export default function RoleAssignment() {
  const { teams } = useTeams();
  const [teamId, setTeamId] = useState(teams[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState(null);

  const team = teams.find((t) => t.id === teamId);

  function assign() {
    if (!team) return;
    setLoading(true);
    setAssignments(null);
    setTimeout(() => {
      const members = ROSTER.slice(0, Math.max(2, Math.min(team.membersCount, ROSTER.length)));
      setAssignments(members.map((p) => ({ ...p, role: assignRole(p, team.skills || []) })));
      setLoading(false);
    }, 900);
  }

  return (
    <div className="ai-feature">
      <div className="ai-feature-intro">
        <h2>Assign roles across a team</h2>
        <p>Pick one of your teams — it'll suggest who's best suited for which part of the work, based on skill match.</p>
      </div>

      <div className="ai-input-row">
        <select className="ai-select" value={teamId} onChange={(e) => { setTeamId(e.target.value); setAssignments(null); }}>
          {teams.length === 0 && <option value="">No teams yet</option>}
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className="join-btn" onClick={assign} disabled={loading || !team}>
          {loading ? 'Assigning...' : 'Assign roles'}
        </button>
      </div>

      {loading && <div className="ai-loading"><span className="ai-spinner" /> matching skills to roles...</div>}

      {assignments && (
        <div className="ai-role-list">
          {assignments.map((p) => (
            <div className="ai-role-row" key={p.id}>
              <div className="avatar-sm" style={{ width: '36px', height: '36px', fontSize: '11px' }}>{p.initials}</div>
              <div className="ai-role-info">
                <span className="ai-role-name">{p.name}</span>
                <div className="chip-row" style={{ marginTop: '4px' }}>
                  {p.skills.map((s) => (
                    <span className="skill-chip" key={s} style={{ fontSize: '10px', padding: '2px 8px' }}>{s}</span>
                  ))}
                </div>
              </div>
              <span className="type-badge" style={{ fontSize: '10.5px', padding: '5px 12px' }}>{p.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}