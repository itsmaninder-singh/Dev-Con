import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderGit2, Compass } from 'lucide-react';
import FoldText from '../../../components/FoldText';

export function TeamsHeader({ onOpenProjectModal }) {
  return (
    <div className="teams-header-hero">
      <div className="teams-header-meta">
        <div
          className="eyebrow"
          style={{
            letterSpacing: '3px',
            fontSize: '11px',
            color: 'var(--coral, #ff98a2)',
            textTransform: 'uppercase',
            marginBottom: '8px',
            fontWeight: 600,
          }}
        >
          YOUR SQUADS & PROJECTS
        </div>
        <h1 className="teams-title">
          <FoldText
            text="Workspace"
            splitBy="char"
            hinge="top"
            trigger="scroll"
            duration={0.65}
            stagger={0.045}
            ease="power3.out"
            perspective={700}
            creaseShading={0.55}
            fontSize="clamp(30px, 4.5vw, 42px)"
            fontWeight={800}
            color="#ffffff"
          />
        </h1>
        <p className="teams-subtitle">
          Squads you lead, teams you've joined, and shipping projects. Looking to partner with builders?{' '}
          <Link to="/explore" className="teams-sublink">
            Discover on Explore <Compass size={13} style={{ display: 'inline', verticalAlign: '-1px' }} />
          </Link>
        </p>
      </div>

      <div className="teams-header-actions">
        <Link to="/teams/create" className="join-btn">
          <Plus size={15} />
          <span>Create Team</span>
        </Link>
        <button
          type="button"
          onClick={onOpenProjectModal}
          className="chip-btn"
        >
          <FolderGit2 size={14} />
          <span>New Project</span>
        </button>
      </div>
    </div>
  );
}

export default TeamsHeader;
