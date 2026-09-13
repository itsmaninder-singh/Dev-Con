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
            tabData.map((item) => (
              <div
                className="item-card"
                key={item.id}
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
            <div className="profile-panel empty-panel">
              <p className="bio-text">Nothing here yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileTabs;
