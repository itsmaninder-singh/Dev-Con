import React from 'react';

export function ProfilePanels({
  profile = {},
  bio,
  college,
  openTo = [],
  skills = [],
  repFillRef,
  repScoreRef,
  navigate,
  isOwnProfile = false,
}) {
  const userBio =
    bio ||
    profile?.bio ||
    'Full-stack dev who likes shipping fast and breaking things in staging, not prod. Currently focused on building high-performance web applications and open to hackathons.';
  const userCollege = college || profile?.college || 'Lovely Professional University';
  const experience = profile?.experience || '2-5 years';
  const isAvailable = profile?.isAvailable !== false;

  const displaySkills =
    skills && skills.length > 0
      ? skills
      : ['TypeScript', 'React', 'Node.js', 'Vite', 'Tailwind', 'PostgreSQL'];

  const displayOpenTo =
    openTo && openTo.length > 0
      ? openTo
      : ['Hackathons', 'Open Source', 'Freelance'];

  return (
    <div className="left-col">
      {/* About Panel */}
      <div className="profile-panel" id="panelAbout">
        <div className="panel-title-row">
          <h4>About</h4>
          {isOwnProfile && navigate && (
            <button
              type="button"
              className="mini-edit-btn"
              onClick={() => navigate('/profile/edit')}
            >
              Edit profile ✎
            </button>
          )}
        </div>
        <p className="bio-text">{userBio}</p>
        <div className="about-metrics-grid">
          <div className="about-metric-cell">
            <span className="metric-lbl">Institution</span>
            <span className="metric-val">{userCollege}</span>
          </div>
          <div className="about-metric-cell">
            <span className="metric-lbl">Experience</span>
            <span className="metric-val">{experience}</span>
          </div>
          <div className="about-metric-cell">
            <span className="metric-lbl">Availability</span>
            <span className="metric-val status-val">
              {isAvailable ? 'Open to Collaborations' : 'Unavailable'}
            </span>
          </div>
        </div>
      </div>

      {/* Reputation Panel */}
      <div className="profile-panel" id="panelRep">
        <h4>Developer Reputation</h4>
        <div className="rep-ring-wrap">
          <div className="rep-ring">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle className="track" cx="32" cy="32" r="27"></circle>
              <circle className="fill" cx="32" cy="32" r="27" ref={repFillRef} id="repFillCircle"></circle>
            </svg>
          </div>
          <div>
            <div className="rep-level">Builder Tier</div>
            <div className="rep-score" ref={repScoreRef}>640 / 1000</div>
          </div>
          <div className="rep-tooltip">
            <div className="rep-tooltip-title">Score breakdown</div>
            <div className="rep-tooltip-row"><span>Commits</span><b>240</b></div>
            <div className="rep-tooltip-row"><span>Code reviews</span><b>180</b></div>
            <div className="rep-tooltip-row"><span>Community help</span><b>220</b></div>
          </div>
        </div>
        <div className="rep-breakdown-row">
          <div className="rep-stat-item"><span>Commits</span><b>240</b></div>
          <div className="rep-stat-item"><span>Code reviews</span><b>180</b></div>
          <div className="rep-stat-item"><span>Community</span><b>220</b></div>
        </div>
      </div>

      {/* Available For Panel */}
      <div className="profile-panel" id="panelAvail">
        <h4>Available for</h4>
        <div className="chip-row">
          {displayOpenTo.map((c) => (
            <span className="avail-chip" data-chip key={c}>{c}</span>
          ))}
        </div>
      </div>

      {/* Skills Panel */}
      <div className="profile-panel" id="panelSkills">
        <h4>Skills & Tech Stack</h4>
        <div className="chip-row">
          {displaySkills.map((s) => (
            <span className="skill-chip" data-chip key={s}>{s}</span>
          ))}
        </div>
      </div>

      {/* GitHub Panel */}
      <div className="profile-panel" id="panelGithub">
        <h4>GitHub Highlights</h4>
        <div className="streak-row">
          <div className="streak-stat">
            <div className="num" data-count="37">37</div>
            <div className="lbl">Current streak</div>
          </div>
          <div className="streak-stat">
            <div className="num" data-count="112">112</div>
            <div className="lbl">Longest streak</div>
          </div>
          <div className="streak-stat">
            <div className="num" data-count="48">48</div>
            <div className="lbl">Public repos</div>
          </div>
        </div>
        <div style={{ marginTop: '18px' }}>
          <div className="repo-item">
            <a href="#formless" onClick={(e) => e.preventDefault()}>formless</a>
            <p>Headless, framework-agnostic form builder with a tiny runtime.</p>
            <div className="repo-meta">
              <span>★ <b className="star-count" data-count="312">312</b></span>
              <span>TypeScript</span>
            </div>
          </div>
          <div className="repo-item">
            <a href="#querylite" onClick={(e) => e.preventDefault()}>query-lite</a>
            <p>A 2kb data-fetching hook, no cache invalidation ceremony.</p>
            <div className="repo-meta">
              <span>★ <b className="star-count" data-count="94">94</b></span>
              <span>TypeScript</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePanels;
