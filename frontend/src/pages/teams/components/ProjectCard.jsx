import React from 'react';
import { Rocket, Share2, Trash2, Check, Globe } from 'lucide-react';

function GithubIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.5 7.5 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function ProjectCard({
  project,
  isLead,
  copiedId,
  confirmDeleteProjectId,
  onShare,
  onDelete,
  setConfirmDeleteProjectId,
}) {
  const pid = project._id || project.id;
  const skills = project.skills || [];
  const collaborators = project.collaborators || [];
  const creator = collaborators[0] || {};
  const creatorName = creator.name || 'Maintainer';
  const creatorInitials = creator.initials || 'DEV';

  return (
    <div className="card in-view">
      <div className="card-top">
        <span className="type-badge">
          <Rocket size={11} style={{ marginRight: '4px' }} /> {project.category || 'PROJECT'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            className="type-badge"
            style={{
              color: '#34d399',
              borderColor: 'rgba(52, 211, 153, 0.3)',
              background: 'rgba(52, 211, 153, 0.1)',
            }}
          >
            {project.status || 'Active Dev'}
          </span>
          <button
            type="button"
            className="bookmark-btn"
            onClick={() => onShare(project, 'project')}
            title="Share project"
          >
            {copiedId === pid ? <Check size={13} color="#34d399" /> : <Share2 size={13} />}
          </button>

          {isLead && (
            confirmDeleteProjectId === pid ? (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className="join-btn"
                  style={{ padding: '3px 10px', fontSize: '10.5px', background: '#ff453a' }}
                  onClick={() => onDelete(pid)}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  style={{ padding: '3px 8px', fontSize: '10.5px' }}
                  onClick={() => setConfirmDeleteProjectId(null)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="bookmark-btn"
                onClick={() => setConfirmDeleteProjectId(pid)}
                title="Delete project"
              >
                <Trash2 size={13} />
              </button>
            )
          )}
        </div>
      </div>

      <h3>{project.name}</h3>

      <p className="desc">{project.description || project.tagline}</p>

      <div className="chip-row">
        {skills.length ? (
          skills.map((s) => (
            <span className="skill-chip" key={s}>
              {s}
            </span>
          ))
        ) : (
          <span className="skill-chip" style={{ opacity: 0.6 }}>
            General / Open
          </span>
        )}
      </div>

      <div className="card-owner">
        <div className="avatar-sm">{creatorInitials}</div>
        <div className="owner-name">
          by <b>{creatorName}</b> · <span style={{ color: '#f59e0b' }}>★ {project.starsCount || 0}</span>
        </div>
      </div>

      <div className="card-footer">
        <div className="seats-row">
          <span className="seats-label">
            {collaborators.length} devs · {project.openRolesCount || 1} open role
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="join-btn"
              title="Open GitHub repo"
              style={{ padding: '7px 15px', fontSize: '11.5px' }}
            >
              <GithubIcon size={12} /> Repo
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="chip-btn"
              title="Open demo"
              style={{ padding: '7px 14px', fontSize: '11.5px' }}
            >
              <Globe size={12} /> Demo
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;
