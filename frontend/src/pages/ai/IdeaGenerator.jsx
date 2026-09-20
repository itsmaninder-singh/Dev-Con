import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiApi } from '../../lib/api.js';

export default function IdeaGenerator() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState(null);
  const [error, setError] = useState('');

  async function generate() {
    if (!domain.trim()) return;
    setLoading(true);
    setIdeas(null);
    setError('');
    try {
      const result = await aiApi.generateIdeas(domain.trim());
      // Backend returns { domain, allIdeas, topFeasible }
      if (result?.topFeasible?.length) {
        setIdeas(result.topFeasible);
      } else {
        setError('AI returned no ideas. Try a different domain.');
      }
    } catch (err) {
      console.error('AI idea generation failed:', err.message);
      setError(err.message || 'AI idea generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleUseIdea(idea) {
    navigate('/teams/create', {
      state: {
        idea: {
          title: idea.title,
          desc: idea.description || idea.pitch || '',
          stack: idea.techStack || [],
          tags: ['ai-generated']
        }
      }
    });
  }

  return (
    <div className="ai-feature">
      <div className="ai-feature-intro">
        <h2>What are you building for?</h2>
        <p>Give it a domain or interest — hackathons, campus tools, fintech, whatever — and it'll suggest a few project directions.</p>
      </div>

      <div className="ai-input-row">
        <input
          type="text"
          placeholder="e.g. campus food delivery, open-source dev tools, climate data..."
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generate()}
        />
        <button className="join-btn" onClick={generate} disabled={loading || !domain.trim()}>
          {loading ? 'Generating...' : 'Generate ideas'}
        </button>
      </div>

      {loading && (
        <div className="ai-loading">
          <span className="ai-spinner" /> thinking through a few directions...
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: '13px', marginTop: '12px' }}>
          {error}
        </div>
      )}

      {ideas && (
        <div className="ai-idea-grid">
          {ideas.map((idea, i) => (
            <div className="card in-view" key={i}>
              <div className="card-top">
                <span className="type-badge">AI Blueprint</span>
                {idea.timeline && <span className="seats-label">{idea.timeline}</span>}
              </div>
              <h3>{idea.title}</h3>
              <p className="desc">{idea.description || idea.pitch}</p>
              {idea.techStack?.length > 0 && (
                <div className="chip-row">
                  {idea.techStack.map((s) => <span className="skill-chip" key={s}>{s}</span>)}
                </div>
              )}
              {idea.monetization && (
                <p className="desc" style={{ fontSize: '11px', marginTop: '8px', opacity: 0.7 }}>
                  💰 {idea.monetization}
                </p>
              )}
              <div className="card-footer">
                <div className="card-owner">
                  <div className="avatar-sm">AI</div>
                  <span className="owner-name">Idea <b>#{i + 1}</b></span>
                </div>
                <button
                  type="button"
                  className="join-btn"
                  onClick={() => handleUseIdea(idea)}
                  style={{ padding: '8px 16px', fontSize: '11.5px' }}
                >
                  Use Idea →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}