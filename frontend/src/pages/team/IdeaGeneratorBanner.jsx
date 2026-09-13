import React, { useState } from 'react';
import AILoadingShimmer from '../../components/ai/AILoadingShimmer.jsx';
import { Sparkles } from 'lucide-react';

const IDEA_TEMPLATES = [
  {
    title: 'Peer Review Queue',
    desc: 'A lightweight tool that routes team submissions to the right reviewer automatically, with SLA tracking and feedback loops.',
    stack: ['React', 'Node.js', 'PostgreSQL'],
    tags: ['developer-tools', 'workflow'],
    difficulty: 'Medium',
  },
  {
    title: 'Live Incident Room',
    desc: 'Real-time collaborative dashboard showing active job telemetry, incident logs, and audio/chat rooms with WebSocket heartbeat.',
    stack: ['React', 'WebSockets', 'Redis', 'Socket.io'],
    tags: ['hackathon', 'realtime'],
    difficulty: 'Easy',
  },
  {
    title: 'AI Smart Matcher',
    desc: 'Matches students or hackathon builders based on complementary skills, timezone availability, and working styles via vector embeddings.',
    stack: ['Node.js', 'Postgres', 'Vector Search', 'LLM APIs'],
    tags: ['ai', 'startup'],
    difficulty: 'Hard',
  },
];

export default function IdeaGeneratorBanner({ onApplyIdea }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState(null);

  function handleGenerateClick() {
    setOpen(true);
    setLoading(true);
    setIdeas(null);

    setTimeout(() => {
      // Simulate light shuffling / personalization
      const shuffled = [...IDEA_TEMPLATES].sort(() => 0.5 - Math.random());
      setIdeas(shuffled);
      setLoading(false);
    }, 900);
  }

  function handleSelectIdea(idea) {
    onApplyIdea(idea);
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Dashed-border trigger row above the form */}
      <div
        style={{
          border: '1.5px dashed rgba(255, 152, 162, 0.35)',
          borderRadius: '14px',
          padding: '12px 16px',
          background: 'rgba(255, 152, 162, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--coral, #ff98a2)" />
          <span
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontSize: '13px',
              color: 'var(--text-muted, #c7c8ca)',
            }}
          >
            Not sure what to build?
          </span>
        </div>

        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={loading}
          className="chip-btn"
          style={{ padding: '6px 16px', fontSize: '12px' }}
        >
          <Sparkles size={13} color="var(--accent, #ff98a2)" />
          <span>{loading ? 'Thinking...' : 'Generate an idea'}</span>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <AILoadingShimmer
          line1="Reading hackathon trends & domain demands..."
          line2="Synthesizing 3 project architectures with difficulty scores..."
        />
      )}

      {/* 3 Idea Cards */}
      {open && ideas && !loading && (
        <div
          style={{
            marginTop: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            animation: 'aiFadeIn 0.3s ease',
          }}
        >
          {ideas.map((idea, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectIdea(idea)}
              className="card in-view"
              style={{ cursor: 'pointer', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div className="card-top" style={{ marginBottom: '8px' }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--ink, #f2f1ed)',
                    }}
                  >
                    {idea.title}
                  </h4>
                  <span className="type-badge" style={{ fontSize: '9.5px', padding: '3px 8px' }}>
                    {idea.difficulty}
                  </span>
                </div>
                <p className="desc" style={{ fontSize: '12.5px', lineHeight: 1.5, marginBottom: '12px' }}>
                  {idea.desc}
                </p>
              </div>

              <div>
                <div className="chip-row" style={{ marginBottom: '12px' }}>
                  {idea.stack.map((st) => (
                    <span key={st} className="skill-chip" style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {st}
                    </span>
                  ))}
                </div>
                <div className="card-footer" style={{ marginTop: '0', paddingTop: '8px', borderTop: '1px solid var(--glass-border, rgba(255,255,255,0.06))' }}>
                  <span className="seats-label">Click to apply</span>
                  <span
                    className="join-btn"
                    style={{
                      padding: '5px 12px',
                      fontSize: '11px',
                    }}
                  >
                    Apply →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
