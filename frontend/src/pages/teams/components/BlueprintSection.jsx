import React from 'react';

export function BlueprintSection({ onUseBlueprint }) {
  return (
    <div className="workspace-templates-wrap">
      <div className="workspace-templates-header">
        <span className="templates-kicker">Starter Templates</span>
        <span className="templates-hint">Pre-configured blueprints to jumpstart a squad or project</span>
      </div>

      <div className="blueprint-grid">
        <div className="card in-view blueprint-card" onClick={() => onUseBlueprint('hackathon')}>
          <div className="card-top">
            <span className="type-badge">HACKATHON</span>
          </div>
          <h3>Quantum Sprint</h3>
          <p className="desc">
            Real-time incident response and telemetry dashboard with WebSockets for 48h hackathons.
          </p>
          <div className="card-footer">
            <span className="seats-label">Squad blueprint</span>
            <span className="join-btn" style={{ padding: '6px 14px', fontSize: '11.5px' }}>
              + Use Template
            </span>
          </div>
        </div>

        <div className="card in-view blueprint-card" onClick={() => onUseBlueprint('ai')}>
          <div className="card-top">
            <span className="type-badge">STARTUP</span>
          </div>
          <h3>Nexus Agent</h3>
          <p className="desc">
            Autonomous workflow coordinator using Python and LLM tool-calling for developer pipelines.
          </p>
          <div className="card-footer">
            <span className="seats-label">Startup project</span>
            <span className="join-btn" style={{ padding: '6px 14px', fontSize: '11.5px' }}>
              + Use Template
            </span>
          </div>
        </div>

        <div className="card in-view blueprint-card" onClick={() => onUseBlueprint('mesh')}>
          <div className="card-top">
            <span className="type-badge">OPEN SOURCE</span>
          </div>
          <h3>HyperMesh</h3>
          <p className="desc">
            Decentralized WebRTC peer-to-peer state synchronizer for collaborative frontend applications.
          </p>
          <div className="card-footer">
            <span className="seats-label">Open source repo</span>
            <span className="join-btn" style={{ padding: '6px 14px', fontSize: '11.5px' }}>
              + Use Template
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlueprintSection;
