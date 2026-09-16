import React from 'react';

export function ProfileTabs({
  activeTab,
  setActiveTab,
  tabPillRef,
  teamsBtnRef,
  projectsBtnRef,
  tabData = [],
  displayTeams = [],
  displayProjects = [],
  navigate,
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
      </div>

      <div id="tabContent">
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
      </div>
    </div>
  );
}

export default ProfileTabs;
