import { useState } from 'react';
import { useProfile } from '../../context/ProfileContext.jsx';
import { useTeams } from '../../context/TeamsContext.jsx';
import { ROSTER } from './mockPeople.js';
import { scoreCandidateVsTeam } from './scoring.js';
import { aiApi } from '../../lib/api.js';

export default function TeamFitCheck() {
  const { profile } = useProfile();
  const { teams } = useTeams();
  const you = { id: 'you', name: profile.name || 'You', initials: 'YO', skills: profile.skills || [] };
  const people = [you, ...ROSTER];

  const [personId, setPersonId] = useState('you');
  const [teamId, setTeamId] = useState(teams[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [aiAnalysisSource, setAiAnalysisSource] = useState(null); // 'api' | 'local'

  const person = people.find((p) => p.id === personId);
  const team = teams.find((t) => t.id === teamId || t._id === teamId);

  async function runCheck() {
    if (!person || !team) return;
    setLoading(true);
    setResult(null);
    setAiAnalysisSource(null);

    const teamSkills = team.skillsNeeded?.length ? team.skillsNeeded : team.skills || [];
    const personSkills = person.skills || [];

    // Attempt backend AI API call if real IDs exist
    const isRealTeamId = team._id && /^[0-9a-fA-F]{24}$/.test(team._id);
    const isRealUserId = person._id && /^[0-9a-fA-F]{24}$/.test(person._id);

    if (isRealTeamId && isRealUserId) {
      try {
        const aiData = await aiApi.analyzeTeamFit({
          teamId: team._id,
          candidateUserId: person._id,
        });
        if (aiData) {
          setResult({
            score: aiData.teamBalanceScore || 85,
            missing: aiData.missingSkills || [],
            extra: personSkills.filter((s) => !teamSkills.includes(s)),
            suggestedRole: aiData.suggestedRole,
            reasons: aiData.reasons || [],
          });
          setAiAnalysisSource('api');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Backend AI team fit unavailable, falling back to local scoring:', err.message);
      }
    }

    // Seamless Local Scoring fallback
    setTimeout(() => {
      const localScoring = scoreCandidateVsTeam(personSkills, teamSkills);
      setResult({
        ...localScoring,
        reasons: [
          `Covers ${personSkills.filter((s) => teamSkills.includes(s)).length} critical skills for the squad`,
          personSkills.length > 3 ? 'Deep technical versatility' : 'Focused core contributor',
        ],
      });
      setAiAnalysisSource('local');
      setLoading(false);
    }, 700);
  }

  return (
    <div className="ai-feature">
      <div className="ai-feature-intro">
        <h2>Check candidate-to-team fit</h2>
        <p>How well would this person cover what the team is missing?</p>
      </div>

      <div className="ai-pair-row">
        <select className="ai-select" value={personId} onChange={(e) => { setPersonId(e.target.value); setResult(null); }}>
          {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="ai-pair-vs">→</span>
        <select className="ai-select" value={teamId} onChange={(e) => { setTeamId(e.target.value); setResult(null); }}>
          {teams.length === 0 && <option value="">No teams yet</option>}
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className="join-btn" onClick={runCheck} disabled={loading || !person || !team}>
          {loading ? 'Checking...' : 'Check fit'}
        </button>
      </div>

      {loading && <div className="ai-loading"><span className="ai-spinner" /> comparing against team needs...</div>}

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
            <div className="ai-compat-line"><b>{person.name}</b> for <b>{team.name}</b></div>
            <div className="ai-compat-row">
              <span className="ai-compat-label">Covers</span>
              <div className="chip-row">
                {team.skills?.filter((s) => !result.missing.includes(s)).length
                  ? team.skills.filter((s) => !result.missing.includes(s)).map((s) => (
                      <span className="type-badge" key={s} style={{ fontSize: '10.5px' }}>{s}</span>
                    ))
                  : <span className="skill-chip">nothing the team already needs</span>}
              </div>
            </div>
            <div className="ai-compat-row">
              <span className="ai-compat-label">Still missing</span>
              <div className="chip-row">
                {result.missing.length
                  ? result.missing.map((s) => <span className="skill-chip" key={s}>{s}</span>)
                  : <span className="skill-chip">nothing — full coverage</span>}
              </div>
            </div>
            <div className="ai-compat-row">
              <span className="ai-compat-label">Brings extra</span>
              <div className="chip-row">
                {result.extra.length
                  ? result.extra.map((s) => <span className="skill-chip" key={s}>{s}</span>)
                  : <span className="skill-chip">none</span>}
              </div>
            </div>
            {result.suggestedRole && (
              <div className="ai-compat-row">
                <span className="ai-compat-label">Suggested Role</span>
                <span className="type-badge" style={{ fontSize: '11px' }}>{result.suggestedRole}</span>
              </div>
            )}
            {result.reasons && result.reasons.length > 0 && (
              <div className="ai-compat-row" style={{ alignItems: 'flex-start' }}>
                <span className="ai-compat-label">Key Factors</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {result.reasons.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--coral, #ff98a2)' }}>•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}