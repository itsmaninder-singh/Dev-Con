import { useState } from 'react';
import { UserPlus, Code2, ChevronRight, Check, Flag, ShieldBan } from 'lucide-react';
import useUISound from '../../hooks/useUISound.js';
import { useProfile } from '../../context/ProfileContext.jsx';
import ReportUserModal from '../../components/ReportUserModal.jsx';

const PEOPLE_DATA = [
  {
    id: 'u1',
    name: 'Yusuf Sheikh',
    initials: 'YS',
    role: 'Full-Stack Developer',
    reason: 'Works with your stack',
    matchScore: 94,
    skills: ['React', 'Node.js', 'Socket.io'],
    highlight: 'Active in 2 hackathons this month',
  },
  {
    id: 'u2',
    name: 'Meera Pillai',
    initials: 'MP',
    role: 'UI Designer & Frontend',
    reason: 'Design & Creative Lead',
    matchScore: 89,
    skills: ['React', 'WebGL', 'Figma'],
    highlight: 'Top designer in Web3 Track',
  },
  {
    id: 'u3',
    name: 'Kabir Mehta',
    initials: 'KM',
    role: 'Fintech Specialist',
    reason: 'Backend-leaning generalist',
    matchScore: 82,
    skills: ['Express', 'MongoDB', 'Razorpay'],
    highlight: 'Building Ledger Loop',
  },
  {
    id: 'u4',
    name: 'Rohan Iyer',
    initials: 'RI',
    role: 'Mobile & Cloud Hacker',
    reason: 'Active hackathon builder',
    matchScore: 80,
    skills: ['React Native', 'Firebase', 'Go'],
    highlight: 'Shipped 3 production prototypes',
  },
  {
    id: 'u5',
    name: 'Simran Kaur',
    initials: 'SK',
    role: 'Systems Engineer',
    reason: 'Matches your performance criteria',
    matchScore: 78,
    skills: ['TypeScript', 'Vite', 'Testing'],
    highlight: 'Weekly release maintainer',
  },
  {
    id: 'u6',
    name: 'Dev Malhotra',
    initials: 'DM',
    role: 'Product Designer',
    reason: 'Visual thinker & fast prototyper',
    matchScore: 75,
    skills: ['Figma', 'Tailwind', 'Design Systems'],
    highlight: 'Design lead at PixelForge',
  },
];

export default function SuggestedPeople() {
  const [followed, setFollowed] = useState(() => new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [reportingUser, setReportingUser] = useState(null);
  const { playClick } = useUISound();
  const { isUserBlocked, blockUser } = useProfile();

  const visiblePeople = PEOPLE_DATA.filter((p) => !isUserBlocked(p.id) && !isUserBlocked(p.name));

  const toggleFollow = (id, e) => {
    e.stopPropagation();
    playClick();
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCardClick = (id) => {
    playClick();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <aside className="suggested-panel" aria-label="Suggested developers to connect with">
      <div className="suggested-head">
        <div className="suggested-title-wrap">
          <span>Recommended for you</span>
        </div>
        <span className="suggested-badge-count">{visiblePeople.length} builders</span>
      </div>

      {/* Suggested People Cards */}
      <ul className="suggested-list">
        {visiblePeople.map((item, idx) => {
          const isFollowed = followed.has(item.id);
          const isExpanded = expandedId === item.id;

          return (
            <li
              key={item.id}
              className={`suggested-item-card ${isExpanded ? 'expanded' : ''}`}
              style={{ animationDelay: `${idx * 40}ms` }}
              onClick={() => handleCardClick(item.id)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty('--card-mouse-x', `${x}px`);
                e.currentTarget.style.setProperty('--card-mouse-y', `${y}px`);
              }}
            >
              <div className="suggested-item-top">
                <div className="suggested-avatar-wrap">
                  <div className="suggested-avatar">{item.initials}</div>
                  {item.matchScore && (
                    <span className="suggested-score-badge" title={`${item.matchScore}% match`}>
                      {item.matchScore}%
                    </span>
                  )}
                </div>

                <div className="suggested-info">
                  <div className="suggested-name-row">
                    <span className="suggested-name">{item.name}</span>
                    <span className="suggested-role-tag">{item.role}</span>
                  </div>
                  <span className="suggested-reason">{item.reason}</span>
                </div>

                <button
                  type="button"
                  className={`suggested-action-btn ${isFollowed ? 'followed' : ''}`}
                  onClick={(e) => toggleFollow(item.id, e)}
                  title={isFollowed ? 'Connected' : 'Connect'}
                  aria-label={isFollowed ? `Connected to ${item.name}` : `Connect with ${item.name}`}
                >
                  {isFollowed ? (
                    <>
                      <Check size={12} style={{ verticalAlign: '-1px' }} />
                      <span>Linked</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={12} style={{ verticalAlign: '-1px' }} />
                      <span>Connect</span>
                    </>
                  )}
                </button>
              </div>

              {/* Skills Tags Strip */}
              <div className="suggested-skills-strip">
                {item.skills.map((s) => (
                  <span key={s} className="suggested-skill-chip">
                    {s}
                  </span>
                ))}
              </div>

              {/* Contextual Highlight / Expanded Drawer */}
              {isExpanded && (
                <div className="suggested-drawer">
                  <div className="suggested-drawer-item">
                    <Code2 size={12} color="#ff98a2" />
                    <span>{item.highlight}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClick();
                          setReportingUser(item);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim, #8e8e93)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 4px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--coral, #ff98a2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim, #8e8e93)')}
                      >
                        <Flag size={11} /> Report
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClick();
                          blockUser(item);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim, #8e8e93)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 4px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ff7b7b')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim, #8e8e93)')}
                      >
                        <ShieldBan size={11} /> Block
                      </button>
                    </div>
                    <div className="suggested-drawer-footer" style={{ margin: 0, padding: 0 }}>
                      <span>Collapse</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ReportUserModal
        isOpen={!!reportingUser}
        onClose={() => setReportingUser(null)}
        targetUser={reportingUser}
      />
    </aside>
  );
}
