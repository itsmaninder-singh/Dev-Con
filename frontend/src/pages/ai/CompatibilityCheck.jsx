import { useState, useMemo } from 'react';
import { useProfile } from '../../context/ProfileContext.jsx';
import { useTeams } from '../../context/TeamsContext.jsx';
import { overlap, scorePair } from './scoring.js';

export default function CompatibilityCheck() {
  const { profile } = useProfile();
  const { teams } = useTeams() || {};

  const you = useMemo(
    () => ({
      id: 'you',
      name: profile?.name || 'You',
      initials: 'YO',
      skills: profile?.skills || [],
      availability: profile?.isAvailable ? 'Open now' : 'Not available',
      workStyle: profile?.preferredRole || 'Your profile',
    }),
    [profile]
  );

  const teamMembers = useMemo(() => {
    const map = new Map();
    (teams || []).forEach((t) => {
      (t.members || []).forEach((m) => {
        const u = m.user;
        if (u && (u._id || u.name) && u.name !== profile?.name) {
          const uid = u._id || u.name;
          if (!map.has(uid)) {
            map.set(uid, {
              id: uid,
              name: u.name || u.username || 'Teammate',
              initials: u.initials || 'TM',
              skills: u.skills || t.skillsNeeded || [],
              availability: 'Squad member',
              workStyle: m.role || 'Contributor',
            });
          }
        }
      });
    });
    return Array.from(map.values());
  }, [teams, profile]);

  const people = useMemo(() => [you, ...teamMembers], [you, teamMembers]);

  const [aId, setAId] = useState('you');
  const [bId, setBId] = useState(() => teamMembers[0]?.id || 'you');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const a = people.find((p) => p.id === aId);
  const b = people.find((p) => p.id === bId);

  function runCheck() {
    if (!a || !b || a.id === b.id) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const score = scorePair(a.skills, b.skills);
      const shared = overlap(a.skills, b.skills);
      setResult({ score, shared });
      setLoading(false);
    }, 600);
  }

  return (
    <div className="ai-feature">
      <div className="ai-feature-intro">
        <h2>Check 1:1 compatibility</h2>
        <p>Pick two builders to analyze synergy, skill overlap, and workstyle compatibility.</p>
      </div>

      {people.length < 2 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted, #888)' }}>
          <p style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-main, #fff)', fontWeight: 600 }}>
            No teammates in your squads yet
          </p>
          <p style={{ fontSize: '13px', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Assemble or join a team in Teams & Workspace to run 1:1 AI skill and workstyle compatibility checks.
          </p>
        </div>
      ) : (
        <>
          <div className="ai-pair-row">
            <select className="ai-select" value={aId} onChange={(e) => { setAId(e.target.value); setResult(null); }}>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span className="ai-pair-vs">vs</span>
            <select className="ai-select" value={bId} onChange={(e) => { setBId(e.target.value); setResult(null); }}>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="join-btn" onClick={runCheck} disabled={loading || !a || !b || a.id === b.id}>
              {loading ? 'Checking...' : 'Check compatibility'}
            </button>
          </div>
          {a && b && a.id === b.id && <p className="ai-hint">Pick two different people.</p>}
        </>
      )}

      {loading && <div className="ai-loading"><span className="ai-spinner" /> comparing skills and availability...</div>}

      {result && (
        <div className="ai-compat-result">
          <div className="ai-score-ring-wrap">
            <svg viewBox="0 0 100 100" className="ai-score-ring">
              <circle cx="50" cy="50" r="42" className="track" />
              <circle
                cx="50" cy="50" r="42" className="fill"
                style={{ strokeDasharray: 264, strokeDashoffset: 264 - (264 * result.score) / 100 }}
              />
            </svg>
            <span className="ai-score-num">{result.score}%</span>
          </div>

          <div className="ai-compat-breakdown">
            <div className="ai-compat-line"><b>{a.name}</b> &amp; <b>{b.name}</b></div>
            <div className="ai-compat-row">
              <span className="ai-compat-label">Shared skills</span>
              <div className="chip-row">
                {result.shared.length
                  ? result.shared.map((s) => (
                      <span className="type-badge" key={s} style={{ fontSize: '10.5px' }}>{s}</span>
                    ))
                  : <span className="skill-chip">none overlapping — fully complementary</span>}
              </div>
            </div>
            <div className="ai-compat-row">
              <span className="ai-compat-label">Availability</span>
              <span className="ai-compat-value">{a.availability} · {b.availability}</span>
            </div>
            <div className="ai-compat-row">
              <span className="ai-compat-label">Working style</span>
              <span className="ai-compat-value">{a.workStyle} · {b.workStyle}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}