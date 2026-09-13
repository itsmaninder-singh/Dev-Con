import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TEMPLATES = [
  { title: 'Peer review queue', stack: ['React', 'Node.js', 'PostgreSQL'], difficulty: 'Medium', blurb: 'A lightweight tool that routes {domain} submissions to the right reviewer automatically, with SLA tracking.' },
  { title: 'Live status tracker', stack: ['React', 'WebSockets', 'Redis'], difficulty: 'Easy', blurb: 'Real-time dashboard showing the current state of every active {domain} job, with alerts on stalls.' },
  { title: 'Smart matcher', stack: ['Node.js', 'Vector search', 'Postgres'], difficulty: 'Hard', blurb: 'Matches people or resources in {domain} using embeddings instead of manual tagging.' },
  { title: 'Weekly digest bot', stack: ['Node.js', 'Cron', 'Email API'], difficulty: 'Easy', blurb: 'Summarizes the week\u2019s {domain} activity into a short digest, sent automatically every Monday.' },
];

export default function IdeaGenerator() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState(null);

  function generate() {
    if (!domain.trim()) return;
    setLoading(true);
    setIdeas(null);
    setTimeout(() => {
      const d = domain.trim().toLowerCase();
      setIdeas(TEMPLATES.map((t) => ({ ...t, blurb: t.blurb.replaceAll('{domain}', d) })));
      setLoading(false);
    }, 900);
  }

  function handleUseIdea(idea) {
    navigate('/teams/create', {
      state: {
        idea: {
          title: idea.title,
          desc: idea.blurb,
          stack: idea.stack,
          tags: [idea.difficulty.toLowerCase(), 'ai-generated']
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

      {ideas && (
        <div className="ai-idea-grid">
          {ideas.map((idea, i) => (
            <div className="card in-view" key={i}>
              <div className="card-top">
                <span className="type-badge">{idea.difficulty}</span>
                <span className="seats-label">AI Blueprint</span>
              </div>
              <h3>{idea.title}</h3>
              <p className="desc">{idea.blurb}</p>
              <div className="chip-row">
                {idea.stack.map((s) => <span className="skill-chip" key={s}>{s}</span>)}
              </div>
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