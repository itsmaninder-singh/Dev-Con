import { useState } from 'react';
import { useTeams } from '../../context/TeamsContext.jsx';

function assignRole(person, teamSkills = []) {
  const pSkills = person.skills || [];
  const match = teamSkills.find((s) => pSkills.some((ps) => ps.toLowerCase() === s.toLowerCase()));
  if (match) return `${match} lead`;
  if (pSkills.some((s) => /figma|tailwind|design|ui/i.test(s))) return 'Design support';
  if (pSkills.some((s) => /node|express|mongo|sql|backend/i.test(s))) return 'Backend Architect';
  return 'Core Contributor';
}

export default function RoleAssignment() {
  const { teams = [] } = useTeams() || {};
  const [teamId, setTeamId] = useState(teams[0]?._id || teams[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState(null);

  const team = teams.find((t) => t._id === teamId || t.id === teamId) || teams[0];

  function assign() {
    if (!team) return;
    setLoading(true);
    setAssignments(null);
    setTimeout(() => {
      const skillsNeeded = team.skillsNeeded?.length ? team.skillsNeeded : team.skills || [];
      const rawMembers = team.members?.length
        ? team.members
        : team.creator
        ? [{ user: team.creator, role: 'Creator' }]
        : [];

      const members = rawMembers.map((m, idx) => {
        const u = m.user || m || {};
        const name = u.name || u.username || `Member ${idx + 1}`;
        const initials =
          u.initials ||
          name
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
        const skills = u.skills?.length ? u.skills : skillsNeeded.slice(idx, idx + 2);
        return {
          id: u._id || u.id || `m_${idx}`,
          name,
          initials,
          skills: skills.length ? skills : ['Generalist'],
          role: assignRole({ name, skills }, skillsNeeded),
        };
      });
      setAssignments(members);
      setLoading(false);
    }, 600);
  }

  return (
    <div className="ai-feature">
      <div className="ai-feature-intro">
        <h2>Assign roles across a team</h2>
        <p>Pick one of your teams — AI suggests optimal responsibility distribution based on member skills.</p>
      </div>

      {teams.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted, #888)' }}>
          <p style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-main, #fff)', fontWeight: 600 }}>
            No teams created yet
          </p>
          <p style={{ fontSize: '13px', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Create a squad in Teams & Workspace to automatically assign and optimize member roles.
          </p>
        </div>
      ) : (
        <div className="ai-input-row">
          <select
            className="ai-select"
            value={team?._id || team?.id || ''}
            onChange={(e) => {
              setTeamId(e.target.value);
              setAssignments(null);
            }}
          >
            {teams.map((t) => (
              <option key={t._id || t.id} value={t._id || t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button className="join-btn" onClick={assign} disabled={loading || !team}>
            {loading ? 'Assigning...' : 'Assign roles'}
          </button>
        </div>
      )}

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