import React from 'react';
import { ListTodo, Sparkles } from 'lucide-react';
import AILoadingShimmer from '../../../components/ai/AILoadingShimmer.jsx';

export function TeamKanban({
  roadmapExists,
  generatingRoadmap,
  teamName,
  skills,
  tasks,
  dragId,
  setDragId,
  onGenerateRoadmap,
  onDrop,
  kanbanColumns,
  members
}) {
  return (
    <div>
      {!roadmapExists && !generatingRoadmap ? (
        <div
          style={{
            textAlign: 'center',
            padding: '70px 24px',
            borderRadius: '20px',
            border: '1px dashed var(--border)',
            background: 'rgba(18, 18, 22, 0.65)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 152, 162, 0.1)',
              border: '1px solid rgba(255, 152, 162, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <ListTodo size={28} color="var(--coral, #ff98a2)" />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>No roadmap tasks initialized</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Synthesize your tech requirements into a phased Kanban board covering setup, modules, testing, and reviews.
          </p>
          <button
            type="button"
            onClick={onGenerateRoadmap}
            style={{
              background: 'linear-gradient(135deg, var(--coral, #ff98a2), #ff98a2dd)',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '24px',
              padding: '11px 24px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px -4px rgba(255, 152, 162, 0.5)',
            }}
          >
            <Sparkles size={15} /> Generate roadmap with AI
          </button>
        </div>
      ) : null}

      {generatingRoadmap && (
        <AILoadingShimmer
          line1={`Synthesizing ${teamName} tech stack (${skills.join(', ')})...`}
          line2="Breaking project into Backlog, Todo, In Progress, Review, and Done milestones..."
        />
      )}

      {/* Kanban Board Component */}
      {roadmapExists && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            overflowX: 'auto',
            paddingBottom: '20px',
          }}
        >
          {kanbanColumns.map((col) => {
            const colTasks = tasks.filter((t) => t.column === col.id);
            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(col.id)}
                style={{
                  background: 'rgba(18, 18, 22, 0.75)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '420px',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {col.label}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text-dim)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 7px',
                      borderRadius: '10px',
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {colTasks.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                      style={{
                        background: 'rgba(28, 28, 34, 0.85)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'grab',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        opacity: dragId === t.id ? 0.35 : 1,
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = 'rgba(255, 152, 162, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: 'var(--coral, #ff98a2)',
                            background: 'rgba(255, 152, 162, 0.12)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                          }}
                        >
                          {t.tag}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            color: t.priority === 'high' ? '#f87171' : t.priority === 'medium' ? '#fbbf24' : '#34d399',
                          }}
                        >
                          {t.priority}
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.4 }}>
                        {t.title}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #2a2a2e, #1a1a1c)',
                              border: '1px solid rgba(255, 152, 162, 0.3)',
                              color: 'var(--coral, #ff98a2)',
                              fontSize: '9px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={`Assignee: ${t.assignee || 'Squad Member'}`}
                          >
                            {t.assigneeInitials || (members[0]?.user?.initials || 'AR')}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                            {t.assignee || (members[0]?.user?.name?.split(' ')[0] || 'Member')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        color: 'var(--text-dim)',
                        fontSize: '11px',
                        minHeight: '80px',
                      }}
                    >
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TeamKanban;
