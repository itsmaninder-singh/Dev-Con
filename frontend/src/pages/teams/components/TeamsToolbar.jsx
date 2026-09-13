import React from 'react';

export function TeamsToolbar({
  entityView,
  setEntityView,
  activeTab,
  setActiveTab,
  myTeamsCount,
  myProjectsCount
}) {
  return (
    <div className="workspace-toolbar">
      <div className="workspace-tabs-group">
        <button
          type="button"
          className={`tab-btn ${entityView === 'all' ? 'active' : ''}`}
          onClick={() => setEntityView('all')}
        >
          <span>All Ventures</span>
          <span className="tab-badge">{myTeamsCount + myProjectsCount}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${entityView === 'teams' ? 'active' : ''}`}
          onClick={() => setEntityView('teams')}
        >
          <span>Teams & Squads</span>
          <span className="tab-badge">{myTeamsCount}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${entityView === 'projects' ? 'active' : ''}`}
          onClick={() => setEntityView('projects')}
        >
          <span>Projects & Repos</span>
          <span className="tab-badge">{myProjectsCount}</span>
        </button>
      </div>

      <div className="workspace-filter-group">
        <span className="workspace-filter-label">Filter:</span>
        <div className="workspace-segmented">
          <button
            type="button"
            className={`segment-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`segment-btn ${activeTab === 'created' ? 'active' : ''}`}
            onClick={() => setActiveTab('created')}
          >
            Created
          </button>
          <button
            type="button"
            className={`segment-btn ${activeTab === 'joined' ? 'active' : ''}`}
            onClick={() => setActiveTab('joined')}
          >
            Joined
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeamsToolbar;
