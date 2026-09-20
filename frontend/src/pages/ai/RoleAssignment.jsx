import { useState } from 'react';
import { useTeams } from '../../context/TeamsContext.jsx';
import { aiApi } from '../../lib/api.js';

export default function RoleAssignment() {
  const { teams = [] } = useTeams() || {};
  const [teamId, setTeamId] = useState(teams[0]?._id || teams[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState(null);
  const [error, setError] = useState('');

  const team = teams.find((t) => t._id === teamId || t.id === teamId) || teams[0];

  async function assign() {
    if (!team) return;
    setLoading(true);
    setAssignments(null);
    setError('');

    const realTeamId = team._id || team.id;

    try {
      const result = await aiApi.assignRoles({ targetType: 'team', targetId: realTeamId });
      if (result?.assignments?.length) {
        setAssignments(
          result.assignments.map((a) => ({
            id: a.userId,
            name: a.name,
            initials: a.name
              ? a.name
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'TM',
            role: a.role,
            reason: a.reason || '',
            skills: [],
          }))
        );
      } else {
        setError('AI returned no role assignments.');
      }
    } catch (err) {
      console.error('AI role assignment failed:', err.message);
      setError(err.message || 'AI role assignment failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
              setError('');
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

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: '13px', marginTop: '12px' }}>
          {error}
        </div>
      )}

      {assignments && (
        <div className="ai-role-list">
          {assignments.map((p) => (
            <div className="ai-role-row" key={p.id}>
              <div className="avatar-sm" style={{ width: '36px', height: '36px', fontSize: '11px' }}>{p.initials}</div>
              <div className="ai-role-info">
                <span className="ai-role-name">{p.name}</span>
                {p.reason && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted, #888)', margin: '4px 0 0', lineHeight: 1.3 }}>
                    {p.reason}
                  </p>
                )}
              </div>
              <span className="type-badge" style={{ fontSize: '10.5px', padding: '5px 12px' }}>{p.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}