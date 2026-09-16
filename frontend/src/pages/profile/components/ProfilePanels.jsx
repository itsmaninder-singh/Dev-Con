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
    (isOwnProfile
      ? 'No bio added yet. Click "Edit profile" to introduce yourself.'
      : 'No bio provided.');
  const userCollege = college || profile?.college || 'Not specified';
  const experience = profile?.experience || profile?.experienceLevel || 'Fresher';
  const isAvailable = profile?.isAvailable !== false;

  const displaySkills =
    skills && skills.length > 0
      ? skills
      : (profile?.skills && profile.skills.length > 0 ? profile.skills : []);

  const displayOpenTo =
    openTo && openTo.length > 0
      ? openTo
      : (profile?.availableFor && profile.availableFor.length > 0
          ? profile.availableFor
          : (profile?.openTo && profile.openTo.length > 0 ? profile.openTo : []));

  const reputation = profile?.reputation || {};
  const repScore = reputation.score ?? 0;
  const rawLevel = reputation.level || 'newcomer';
  const repLevel = `${rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1)} Tier`;

  const devActivity = profile?.badges?.devconnectActivity || repScore;
  const ghBadges = profile?.badges?.github || 0;
  const communityRep = Math.max(0, repScore - devActivity);

  const githubProfile = profile?.githubProfile || {};
  const currentStreak = githubProfile?.streak?.current ?? 0;
  const longestStreak = githubProfile?.streak?.longest ?? 0;
  const repoCount = githubProfile?.publicRepoCount ?? 0;
  const topRepos = Array.isArray(githubProfile?.topRepos) ? githubProfile.topRepos : [];

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
            <div className="rep-level">{repLevel}</div>
            <div className="rep-score" ref={repScoreRef}>{repScore} / 1000</div>
          </div>
          <div className="rep-tooltip">
            <div className="rep-tooltip-title">Score breakdown</div>
            <div className="rep-tooltip-row"><span>DevConnect Activity</span><b>{devActivity}</b></div>
            <div className="rep-tooltip-row"><span>GitHub Badges</span><b>{ghBadges}</b></div>
            <div className="rep-tooltip-row"><span>Community Rep</span><b>{communityRep}</b></div>
          </div>
        </div>
        <div className="rep-breakdown-row">
          <div className="rep-stat-item"><span>DevConnect</span><b>{devActivity}</b></div>
          <div className="rep-stat-item"><span>GitHub</span><b>{ghBadges}</b></div>
          <div className="rep-stat-item"><span>Community</span><b>{communityRep}</b></div>
        </div>
      </div>

      {/* Available For Panel */}
      <div className="profile-panel" id="panelAvail">
        <h4>Available for</h4>
        {displayOpenTo.length > 0 ? (
          <div className="chip-row">
            {displayOpenTo.map((c) => (
              <span className="avail-chip" data-chip key={c}>{c}</span>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted, #888)', fontSize: '13px', margin: '6px 0 0 0' }}>
            {isOwnProfile ? 'None selected. Add in profile edit.' : 'Not specified'}
          </p>
        )}
      </div>

      {/* Skills Panel */}
      <div className="profile-panel" id="panelSkills">
        <h4>Skills & Tech Stack</h4>
        {displaySkills.length > 0 ? (
          <div className="chip-row">
            {displaySkills.map((s) => (
              <span className="skill-chip" data-chip key={s}>{s}</span>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted, #888)', fontSize: '13px', margin: '6px 0 0 0' }}>
            {isOwnProfile ? 'No skills added yet. Add in profile edit.' : 'No skills listed'}
          </p>
        )}
      </div>

      {/* GitHub Panel */}
      <div className="profile-panel" id="panelGithub">
        <h4>GitHub Highlights</h4>
        <div className="streak-row">
          <div className="streak-stat">
            <div className="num" data-count={currentStreak}>{currentStreak}</div>
            <div className="lbl">Current streak</div>
          </div>
          <div className="streak-stat">
            <div className="num" data-count={longestStreak}>{longestStreak}</div>
            <div className="lbl">Longest streak</div>
          </div>
          <div className="streak-stat">
            <div className="num" data-count={repoCount}>{repoCount}</div>
            <div className="lbl">Public repos</div>
          </div>
        </div>
        <div style={{ marginTop: '18px' }}>
          {topRepos.length > 0 ? (
            topRepos.map((repo, idx) => (
              <div className="repo-item" key={repo.url || repo.name || idx}>
                <a href={repo.url || '#'} target="_blank" rel="noopener noreferrer">
                  {repo.name}
                </a>
                {repo.description && <p>{repo.description}</p>}
                <div className="repo-meta">
                  <span>★ <b className="star-count" data-count={repo.stars || 0}>{repo.stars || 0}</b></span>
                  {repo.language && <span>{repo.language}</span>}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted, #888)', fontSize: '13px', margin: '8px 0 0 0' }}>
              {isOwnProfile ? 'Connect your GitHub in Settings to showcase repositories & streaks.' : 'No repositories synced.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePanels;
