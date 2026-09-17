import React from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';

export function ProfileTabs({
  activeTab,
  setActiveTab,
  tabPillRef,
  teamsBtnRef,
  projectsBtnRef,
  connectionsBtnRef,
  tabData = [],
  displayTeams = [],
  displayProjects = [],
  displayConnections = [],
  onMessageConnection,
  navigate,
  isOwnProfile = false,
}) {
  return (
    <div className="right-col">
      <div className="tab-row">
        <div className="tab-pill" ref={tabPillRef} id="tabPill"></div>
        <div
          className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
          ref={teamsBtnRef}
          onClick={() => setActiveTab('teams')}
        >
          Teams {displayTeams.length > 0 && <span className="tab-badge">{displayTeams.length}</span>}
        </div>
        <div
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          ref={projectsBtnRef}
          onClick={() => setActiveTab('projects')}
        >
          Projects {displayProjects.length > 0 && <span className="tab-badge">{displayProjects.length}</span>}
        </div>
        <div
          className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
          ref={connectionsBtnRef}
          onClick={() => setActiveTab('connections')}
        >
          Connections {displayConnections.length > 0 && <span className="tab-badge">{displayConnections.length}</span>}
        </div>
      </div>

      <div id="tabContent">
        {activeTab === 'connections' ? (
          <div className="connections-list">
            {displayConnections.length > 0 ? (
              displayConnections.map((conn, idx) => {
                const connId = conn._id || conn.id || idx;
                const connName = conn.name || 'Developer';
                const connHandle = conn.username || 'user';
                const connInitials = connName
                  .split(' ')
                  .filter(Boolean)
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'DV';
                const connAvatar = conn.profilePicture || conn.avatarUrl;
                const isOnline = conn.isAvailable !== false;

                return (
                  <div
                    className="connection-card"
                    key={connId}
                    style={{
                      background: 'var(--glass)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      marginBottom: '12px',
                      transition: 'border-color 0.25s ease, transform 0.25s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        cursor: 'pointer',
                        minWidth: 0,
                        flex: 1,
                      }}
                      onClick={() => navigate(`/profile/${connHandle}`)}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '46px',
                          height: '46px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, #232326, #141416)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent, #ff98a2)',
                          fontWeight: 700,
                          fontSize: '16px',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {connAvatar ? (
                          <img
                            src={connAvatar}
                            alt={connName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          connInitials
                        )}
                        {isOnline && (
                          <span
                            title="Online / Available"
                            style={{
                              position: 'absolute',
                              bottom: '2px',
                              right: '2px',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: '#4ade80',
                              boxShadow: '0 0 0 2px #0b0b0d',
                            }}
                          />
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: '15px',
                              fontWeight: 600,
                              color: 'var(--ink)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {connName}
                          </h4>
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'var(--dim)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            @{connHandle}
                          </span>
                        </div>
                        {conn.college && (
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: 'var(--dim)',
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {conn.college}
                          </div>
                        )}
                        {Array.isArray(conn.skills) && conn.skills.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              marginTop: '6px',
                              flexWrap: 'wrap',
                            }}
                          >
                            {conn.skills.slice(0, 3).map((s, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 7px',
                                  borderRadius: '12px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  color: 'var(--muted)',
                                }}
                              >
                                {s}
                              </span>
                            ))}
                            {conn.skills.length > 3 && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '12px',
                                  color: 'var(--dim)',
                                }}
                              >
                                +{conn.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onMessageConnection) onMessageConnection(conn);
                        }}
                        style={{
                          background: 'rgba(255, 152, 162, 0.1)',
                          border: '1px solid rgba(255, 152, 162, 0.28)',
                          color: 'var(--accent, #ff98a2)',
                          padding: '7px 14px',
                          borderRadius: '20px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                        }}
                        title={`Send direct message to ${connName}`}
                      >
                        <MessageSquare size={13} />
                        <span>Message</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${connHandle}`)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'var(--muted)',
                          padding: '7px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                        }}
                        title="View Profile"
                      >
                        <span>Profile</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="profile-panel empty-panel" style={{ textAlign: 'center', padding: '36px 16px' }}>
                <p className="bio-text" style={{ marginBottom: '14px', color: 'var(--text-muted, #888)' }}>
                  {isOwnProfile
                    ? 'No connections yet. Connect with fellow developers to collaborate!'
                    : 'This user has not established any connections yet.'}
                </p>
                {navigate && (
                  <button
                    type="button"
                    className="mini-edit-btn"
                    onClick={() => navigate('/explore')}
                    style={{ cursor: 'pointer' }}
                  >
                    + Explore Developers
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="items-list">
            {tabData.length > 0 ? (
              tabData.map((item, idx) => (
                <div
                  className="item-card"
                  key={item.id || item._id || item.name || idx}
                  onClick={() => navigate(activeTab === 'teams' ? `/teams` : '/explore')}
                >
                  <div>
                    <span className="type-badge">{item.type.replace('-', ' ')}</span>
                    <h4>{item.name}</h4>
                    <div className="role">{item.role}</div>
                  </div>
                  <div className="arrow">→</div>
                </div>
              ))
            ) : (
              <div className="profile-panel empty-panel" style={{ textAlign: 'center', padding: '36px 16px' }}>
                <p className="bio-text" style={{ marginBottom: '14px', color: 'var(--text-muted, #888)' }}>
                  {activeTab === 'teams'
                    ? 'No squads or teams joined yet.'
                    : 'No projects or repositories showcased yet.'}
                </p>
                {navigate && (
                  <button
                    type="button"
                    className="mini-edit-btn"
                    onClick={() => navigate(activeTab === 'teams' ? '/teams' : '/teams')}
                    style={{ cursor: 'pointer' }}
                  >
                    {activeTab === 'teams' ? '+ Find or Create Squad' : '+ Create Project'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileTabs;
