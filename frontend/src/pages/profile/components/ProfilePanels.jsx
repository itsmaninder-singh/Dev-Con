import React, { useState } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { userApi } from '../../../lib/api.js';
import { useProfile } from '../../../context/ProfileContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

function GithubMark({ size = 14, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.5 7.5 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function formatLastSynced(dateVal) {
  if (!dateVal) return null;
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return null;
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

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
  showToast,
}) {
  const { setGithubProfileData } = useProfile() || {};
  const { user, updateUser } = useAuth() || {};

  const [localProfile, setLocalProfile] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [githubInput, setGithubInput] = useState('');

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
  const ghBadges = localProfile?.badges?.github || profile?.badges?.github || 0;
  const communityRep = Math.max(0, repScore - devActivity);

  // Active GitHub details with local override on sync
  const linkedGithubUsername =
    localProfile?.githubUsername ||
    profile?.githubUsername ||
    (isOwnProfile ? user?.githubUsername : null);

  const activeGithubProfile =
    localProfile?.githubProfile ||
    profile?.githubProfile ||
    (isOwnProfile ? user?.githubProfile : null) ||
    {};

  const currentStreak = activeGithubProfile?.streak?.current ?? 0;
  const longestStreak = activeGithubProfile?.streak?.longest ?? 0;
  const repoCount = activeGithubProfile?.publicRepoCount ?? 0;
  const topRepos = Array.isArray(activeGithubProfile?.topRepos) ? activeGithubProfile.topRepos : [];
  const lastSyncedAt = activeGithubProfile?.lastSyncedAt || null;

  const handleConnectWithGithub = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanUsername = githubInput
      .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
      .replace(/\/$/, "")
      .trim();

    localStorage.setItem("oauth_auth_mode", "connect_github");
    if (cleanUsername) {
      localStorage.setItem("target_github_username", cleanUsername);
    } else {
      localStorage.removeItem("target_github_username");
    }

    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "Ov23liq00TtNTcEVdk4U";
    const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI || `${window.location.origin}/auth/github/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "read:user user:email",
    });
    if (cleanUsername) {
      params.set("login", cleanUsername);
    }

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  };

  const handleSync = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!linkedGithubUsername) {
      setShowConnectForm(true);
      return;
    }

    setSyncing(true);
    setSyncError(null);

    try {
      const res = await userApi.syncGithub({ githubUsername: linkedGithubUsername });
      if (res?.githubProfile) {
        setLocalProfile({
          githubProfile: res.githubProfile,
          badges: res.badges,
          githubUsername: res.githubUsername || linkedGithubUsername,
        });

        // Update context & local storage immediately
        if (setGithubProfileData) {
          setGithubProfileData({
            githubProfile: res.githubProfile,
            badges: res.badges,
            githubUsername: res.githubUsername || linkedGithubUsername,
          });
        }
        if (updateUser) {
          updateUser({
            githubProfile: res.githubProfile,
            badges: res.badges,
            githubUsername: res.githubUsername || linkedGithubUsername,
          });
        }

        setShowConnectForm(false);
        setGithubInput('');

        if (showToast) {
          showToast("GitHub profile synced successfully!");
        }
      }
    } catch (err) {
      const msg = err.message || "Failed to sync GitHub profile.";
      setSyncError(msg);
      if (showToast) {
        showToast(msg);
      }
      if (msg.toLowerCase().includes("connect your github") || msg.toLowerCase().includes("log in")) {
        setShowConnectForm(true);
      }
    } finally {
      setSyncing(false);
    }
  };

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
            <span className="metric-lbl">Status</span>
            <span className="metric-val status-val">
              <span className={`status-dot ${isAvailable ? 'available' : 'busy'}`} />
              {isAvailable ? 'Available for work' : 'Busy / Not looking'}
            </span>
          </div>
        </div>
      </div>

      {/* Reputation Panel */}
      <div className="profile-panel" id="panelRep">
        <div className="rep-row">
          <div className="rep-text-group">
            <h4>Reputation</h4>
            <div className="rep-level">{repLevel}</div>
            <div className="rep-score">
              <span ref={repScoreRef} data-count={repScore}>0</span> pts
            </div>
          </div>
          <div className="rep-ring-wrap">
            <div className="rep-ring" id="repRing">
              <svg viewBox="0 0 80 80">
                <circle className="bg" cx="40" cy="40" r="34" />
                <circle
                  className="fill"
                  id="repCircle"
                  ref={repFillRef}
                  cx="40"
                  cy="40"
                  r="34"
                  strokeDasharray="213.6"
                  strokeDashoffset="213.6"
                />
              </svg>
              <div className="rep-ring-label">Level</div>
            </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h4 style={{ margin: 0 }}>GitHub Highlights</h4>
            {linkedGithubUsername && (
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #8e8e93)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <a
                  href={`https://github.com/${linkedGithubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--text-secondary, #b0b0b8)', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  @{linkedGithubUsername}
                  <ExternalLink size={10} style={{ opacity: 0.6 }} />
                </a>
                {lastSyncedAt && (
                  <span>· Last synced {formatLastSynced(lastSyncedAt)}</span>
                )}
              </div>
            )}
          </div>

          {/* CRITICAL: ONLY SHOW SYNC BUTTON WHEN isOwnProfile === true */}
          {isOwnProfile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {linkedGithubUsername ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleSync(e)}
                    disabled={syncing}
                    className="github-sync-btn"
                    title="Refresh repositories and contribution streaks from GitHub"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 13px',
                      borderRadius: '20px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      background: syncing ? 'rgba(255, 152, 162, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: syncing ? 'var(--accent, #ff98a2)' : 'var(--text-primary, #fff)',
                      cursor: syncing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <RefreshCw size={12} className={syncing ? "spin-sync-icon" : ""} />
                    <span>{syncing ? "Syncing repos & streaks..." : "Sync with GitHub"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConnectForm((prev) => !prev)}
                    title="Switch or re-authenticate GitHub account"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted, #8e8e93)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: '2px 4px',
                    }}
                  >
                    {showConnectForm ? "Cancel" : "Switch"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConnectForm((prev) => !prev)}
                  className="github-sync-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 13px',
                    borderRadius: '20px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'var(--accent, #ff98a2)',
                    cursor: 'pointer',
                  }}
                >
                  <GithubMark size={12} />
                  <span>{showConnectForm ? "Cancel" : "Connect GitHub"}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Inline Connect Form when no GitHub username is linked or switching */}
        {isOwnProfile && (!linkedGithubUsername || showConnectForm) && (
          <div
            style={{
              marginBottom: '16px',
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              border: '1px dashed rgba(255, 255, 255, 0.16)',
            }}
          >
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #b0b0b8)', marginBottom: '10px', lineHeight: 1.4 }}>
              Enter your GitHub username below, then log into GitHub to authenticate and verify ownership:
            </div>
            <form
              onSubmit={handleConnectWithGithub}
              style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  flex: 1,
                  minWidth: '180px',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #71717a)', marginRight: '4px' }}>
                  github.com/
                </span>
                <input
                  type="text"
                  value={githubInput}
                  onChange={(e) => setGithubInput(e.target.value)}
                  placeholder="username"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    width: '100%',
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: '7px 15px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'var(--accent, #ff98a2)',
                  color: '#000000',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <GithubMark size={14} />
                <span>Log in to GitHub to Connect</span>
              </button>
            </form>
            {syncError && (
              <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '8px' }}>
                ⚠️ {syncError}
              </div>
            )}
          </div>
        )}

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
              {isOwnProfile
                ? 'Link your GitHub username above to showcase repositories & streaks.'
                : 'No repositories synced.'}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spinSync {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-sync-icon {
          animation: spinSync 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default ProfilePanels;
