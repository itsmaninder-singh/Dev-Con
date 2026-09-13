import { useState } from 'react';
import Grain from './profile/Grain.jsx';
import ParticleBackground from './profile/ParticleBackground.jsx';
import CursorFX from './profile/CursorFX.jsx';
import SpotCard from './profile/SpotCard.jsx';
import IdeaGenerator from './ai/IdeaGenerator.jsx';
import RoleAssignment from './ai/RoleAssignment.jsx';
import CompatibilityCheck from './ai/CompatibilityCheck.jsx';
import TeamFitCheck from './ai/TeamFitCheck.jsx';
import RoadmapKanban from './ai/RoadmapKanban.jsx';
import FoldText from '../components/FoldText';
import '../ProfileApp.css';
import '../AI.css';

const ICONS = {
  ideas: <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2Z" />,
  roles: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  compat: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.5l-1-.9a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />,
  fit: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  roadmap: <><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="9.5" y="4" width="5" height="10" rx="1" /><rect x="16" y="4" width="5" height="13" rx="1" /></>,
};

const TABS = [
  { id: 'ideas', label: 'Idea Generator' },
  { id: 'roles', label: 'Role Assignment' },
  { id: 'compat', label: 'Compatibility Check' },
  { id: 'fit', label: 'Team Fit Check' },
  { id: 'roadmap', label: 'Roadmap & Board' },
];

export default function AI() {
  const [tab, setTab] = useState('ideas');

  return (
    <div className="profile-app-root">
      <Grain />
      <ParticleBackground />
      <CursorFX />
      <div className="ai-glow" aria-hidden="true" />

      <div className="app-main ai-main">
        <div className="ai-head">
          <span className="ai-kicker">✦ DevConnect AI</span>
          <div style={{ margin: '6px 0 14px', display: 'block' }}>
            <FoldText
              text="Launch with clarity"
              splitBy="char"
              hinge="top"
              trigger="scroll"
              duration={0.65}
              stagger={0.04}
              ease="power3.out"
              perspective={700}
              creaseShading={0.55}
              fontSize="clamp(32px, 4.5vw, 46px)"
              fontWeight={800}
              color="#f7f2e8"
            />
          </div>
          <p>Mocked for now — every result below is simulated client-side, not a real model call. Swap in your actual API where noted in each file.</p>
        </div>

        <div className="ai-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`ai-tab chip-btn${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
              role="tab"
              aria-selected={tab === t.id}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[t.id]}
              </svg>
              {t.label}
            </button>
          ))}
        </div>

        <div className="card in-view ai-panel-card">
          <div key={tab} className="ai-panel">
            {tab === 'ideas' && <IdeaGenerator />}
            {tab === 'roles' && <RoleAssignment />}
            {tab === 'compat' && <CompatibilityCheck />}
            {tab === 'fit' && <TeamFitCheck />}
            {tab === 'roadmap' && <RoadmapKanban />}
          </div>
        </div>
      </div>
    </div>
  );
}