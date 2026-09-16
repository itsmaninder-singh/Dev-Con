import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { authApi, userApi } from '../lib/api.js';
import '../Settings.css';

const MoonIcon = (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" /></svg>;
const SunIcon = (p) => <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;

// Same option strings as Step3Availability, so "Available for" here and in
// the profile wizard/view always mean exactly the same thing.
const OPEN_OPTIONS = [
  ['hackathon', 'Hackathon'],
  ['open-source', 'Open source contribution'],
  ['college-project', 'College project'],
  ['startup', 'Startup'],
  ['freelance', 'Freelance'],
];

export default function Settings() {
  const navigate = useNavigate();
  const { profile, updateProfile, blockedUsers, unblockUser } = useProfile();
  const { user, logout } = useAuth() || {};
  const { theme, setTheme } = useTheme();
  const [toasts, setToasts] = useState([]);
  const [savingKey, setSavingKey] = useState(null);
  const [savedMsgKey, setSavedMsgKey] = useState(null);

  // Authenticated user credentials
  const [username, setUsername] = useState(user?.username || profile?.username || '');
  const [email, setEmail] = useState(user?.email || profile?.email || '');

  useEffect(() => {
    if (user?.username) setUsername(user.username);
    if (user?.email) setEmail(user.email);
  }, [user]);

  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [pwError, setPwError] = useState('');
  const nameRef = useRef(null);

  function showToast(msg) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2650);
  }

  function flashSave(key, msg) {
    setSavingKey(key);
    setTimeout(() => {
      setSavingKey(null);
      setSavedMsgKey(key);
      showToast(msg);
      setTimeout(() => setSavedMsgKey(null), 2000);
    }, 500);
  }

  function handleThemeSwitch(mode) {
    setTheme(mode);
    showToast(mode === 'dark' ? 'Switched to dark mode' : 'Switched to light mode');
  }

  async function handleSaveAccount() {
    setSavingKey('account');
    try {
      await userApi.updateProfile({
        name: profile.name,
        college: profile.college,
        bio: profile.bio,
        experience: profile.experience,
      });
      setSavedMsgKey('account');
      showToast('Account details saved');
      setTimeout(() => setSavedMsgKey(null), 2000);
    } catch (err) {
      showToast(err.message || 'Failed to update account details');
    } finally {
      setSavingKey(null);
    }
  }

  async function handleSavePassword() {
    if (!currentPw) {
      setPwError('Please enter your current password');
      return;
    }
    if (newPw.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('Passwords do not match');
      return;
    }
    setPwError('');
    setSavingKey('password');
    try {
      await authApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setSavedMsgKey('password');
      showToast('Password updated successfully');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setSavedMsgKey(null), 2500);
    } catch (err) {
      const msg = err.message || 'Failed to update password';
      setPwError(msg);
      showToast(msg);
    } finally {
      setSavingKey(null);
    }
  }

  function toggleOpenChip(label) {
    const has = profile.openTo.includes(label);
    updateProfile({ openTo: has ? profile.openTo.filter((o) => o !== label) : [...profile.openTo, label] });
  }

  function handleDeactivate() {
    if (window.confirm('Are you sure you want to deactivate your account? This will hide your profile and log you out.')) {
      if (logout) logout();
      navigate('/login');
    }
  }

  return (
    <div className="st-root" data-theme={theme}>
      <div className="grain-overlay" />
      <div className="aurora-field">
        <div className="aurora-blob a1" /><div className="aurora-blob a2" /><div className="aurora-blob a3" />
      </div>

      <div className="page-wrap">
        <div className="page-head">
          <h1>Settings</h1>
          <p>Manage your profile, security, and how DevConnect looks.</p>
          <div className="settings-nav">
            <a href="#account">Account</a>
            <a href="#ai-profile">AI Matching</a>
            <a href="#password">Password</a>
            <a href="#availability">Availability</a>
            <a href="#appearance">Appearance</a>
            <a href="#blocked">Blocked Users</a>
          </div>
        </div>

        {/* ACCOUNT */}
        <div className="panel" id="account">
          <div className="panel-title">Account details</div>
          <div className="panel-sub">This is what other developers see on your public profile.</div>
          <div className="field-row">
            <div className="field-group">
              <label>Full name</label>
              <input
                ref={nameRef}
                type="text"
                value={profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>
          <div className="field-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="field-hint">Used for login and notifications — not shown publicly.</div>
          </div>
          <div className="field-row">
            <div className="field-group">
              <label>College</label>
              <input
                type="text"
                value={profile.college}
                onChange={(e) => updateProfile({ college: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label>Experience</label>
              <select
                className="chip-select"
                value={profile.experience}
                onChange={(e) => updateProfile({ experience: e.target.value })}
              >
                <option>Student / Learning</option>
                <option>1-2 years</option>
                <option>2-4 years</option>
                <option value="2-5 years">2-5 years</option>
                <option>4+ years</option>
              </select>
            </div>
          </div>
          <div className="field-group">
            <label>Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => updateProfile({ bio: e.target.value })}
            />
          </div>
          <div className="save-row">
            <button className="btn btn-primary" disabled={savingKey === 'account'} onClick={handleSaveAccount}>
              {savingKey === 'account' ? 'Saving...' : 'Save changes'}
            </button>
            <span className={`save-msg${savedMsgKey === 'account' ? ' show' : ''}`}>Saved ✓</span>
          </div>
        </div>

        {/* AI MATCHING PROFILE */}
        <div className="panel" id="ai-profile">
          <div className="panel-title">AI Matching Profile</div>
          <div className="panel-sub">
            These attributes power DevConnect's AI recommendation algorithms, squad compatibility checks, and team fit scores.
          </div>

          <div className="field-row">
            <div className="field-group">
              <label>Preferred Role in Squad</label>
              <select
                className="chip-select"
                value={profile.preferredRole || 'Frontend'}
                onChange={(e) => updateProfile({ preferredRole: e.target.value })}
              >
                <option value="Frontend">Frontend Engineer</option>
                <option value="Backend">Backend Engineer</option>
                <option value="AI">AI / ML Specialist</option>
                <option value="Cloud">Cloud / DevOps</option>
                <option value="UI/UX">UI / UX Designer</option>
                <option value="Presentation">Pitch & Presentation</option>
                <option value="Testing">QA / Testing</option>
                <option value="Documentation">Documentation & Spec</option>
              </select>
              <div className="field-hint">Used by AI Role Assignment and Team Fit models.</div>
            </div>

            <div className="field-group">
              <label>Timezone</label>
              <input
                type="text"
                placeholder="e.g. Asia/Kolkata (IST), UTC+05:30"
                value={profile.timezone || ''}
                onChange={(e) => updateProfile({ timezone: e.target.value })}
              />
              <div className="field-hint">Used to calculate async and overlap compatibility.</div>
            </div>
          </div>

          <div className="field-group">
            <label>Work Style & Personality</label>
            <textarea
              placeholder="e.g. Fast prototyper, prefers async Discord/Slack discussions, high hackathon energy..."
              value={profile.personality || ''}
              onChange={(e) => updateProfile({ personality: e.target.value })}
              rows={2}
            />
            <div className="field-hint">Used by the 1:1 compatibility engine to weigh chemistry and communication styles.</div>
          </div>

          <div className="save-row">
            <button
              className="btn btn-primary"
              disabled={savingKey === 'ai-profile'}
              onClick={() => flashSave('ai-profile', 'AI matching profile synced')}
            >
              {savingKey === 'ai-profile' ? 'Saving...' : 'Save AI attributes'}
            </button>
            <span className={`save-msg${savedMsgKey === 'ai-profile' ? ' show' : ''}`}>Synced ✓</span>
          </div>
        </div>

        {/* PASSWORD */}
        <div className="panel" id="password">
          <div className="panel-title">Change password</div>
          <div className="panel-sub">Use at least 8 characters — mix in a number for good measure.</div>
          <div className="field-group">
            <label>Current password</label>
            <input type="password" placeholder="••••••••" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field-group"><label>New password</label><input type="password" placeholder="••••••••" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
            <div className="field-group"><label>Confirm new password</label><input type="password" placeholder="••••••••" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} /></div>
          </div>
          {pwError && <div className="field-hint" style={{ color: 'var(--bad)' }}>{pwError}</div>}
          <div className="save-row">
            <button className="btn btn-primary" disabled={savingKey === 'password'} onClick={handleSavePassword}>
              {savingKey === 'password' ? 'Saving...' : 'Update password'}
            </button>
            <span className={`save-msg${savedMsgKey === 'password' ? ' show' : ''}`}>Updated ✓</span>
          </div>
        </div>

        {/* AVAILABILITY */}
        <div className="panel" id="availability">
          <div className="panel-title">Availability</div>
          <div className="panel-sub">Control whether teams and projects can find you in matches.</div>
          <div className="toggle-row">
            <div className="toggle-info">
              <b>Open to being matched</b>
              <span>Turn this off to pause all recommendations without deleting anything.</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={profile.isAvailable}
                onChange={(e) => {
                  updateProfile({ isAvailable: e.target.checked });
                  showToast(e.target.checked ? 'You’re now open to being matched' : 'Matching paused');
                }}
              />
              <span className="track"><span className="thumb" /></span>
            </label>
          </div>
          <div style={{ marginTop: 18 }}>
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: .8, color: 'var(--dim)', marginBottom: 10 }}>Available for</label>
            <div className="chip-row">
              {OPEN_OPTIONS.map(([key, label]) => (
                <span
                  key={key}
                  className={`toggle-chip${profile.openTo.includes(label) ? ' selected' : ''}`}
                  onClick={() => toggleOpenChip(label)}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="save-row" style={{ marginTop: 20 }}>
            <button className="btn btn-primary" disabled={savingKey === 'avail'} onClick={() => flashSave('avail', 'Availability preferences saved')}>
              {savingKey === 'avail' ? 'Saving...' : 'Save preferences'}
            </button>
            <span className={`save-msg${savedMsgKey === 'avail' ? ' show' : ''}`}>Saved ✓</span>
          </div>
        </div>

        {/* APPEARANCE */}
        <div className="panel" id="appearance">
          <div className="panel-title">Appearance</div>
          <div className="panel-sub">
            Switch between dark and light modes across the entire DevConnect platform.
          </div>
          <div className="toggle-row" style={{ borderBottom: 'none' }}>
            <div className="toggle-info">
              <b>Theme</b>
              <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
            </div>
            <div className="theme-toggle">
              <div className={`knob${theme === 'light' ? ' light' : ''}`}>
                {theme === 'dark' ? <MoonIcon stroke="#0a0a0a" /> : <SunIcon stroke="#0a0a0a" />}
              </div>
              <button aria-label="Dark mode" onClick={() => handleThemeSwitch('dark')}><MoonIcon stroke="var(--dim)" /></button>
              <button aria-label="Light mode" onClick={() => handleThemeSwitch('light')}><SunIcon stroke="var(--dim)" /></button>
            </div>
          </div>
        </div>

        {/* BLOCKED USERS */}
        <div className="panel" id="blocked">
          <div className="panel-title">Blocked users</div>
          <div className="panel-sub">
            Blocked accounts cannot message you, request to join your teams, or appear in your recommendations.
          </div>
          {(!blockedUsers || blockedUsers.length === 0) ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--dim)' }}>
              <p style={{ margin: 0, fontSize: '13.5px' }}>You haven't blocked any users.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {blockedUsers.map((u) => (
                <div
                  key={u._id || u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255, 152, 162, 0.12)',
                        color: 'var(--coral, #ff98a2)',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {u.initials || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text, #fff)' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--dim)' }}>
                        @{u.username || 'user'} · Blocked {u.blockedAt ? new Date(u.blockedAt).toLocaleDateString() : 'recently'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      unblockUser(u._id || u.id);
                      showToast(`Unblocked ${u.name}`);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: 'var(--text, #fff)',
                      padding: '6px 14px',
                      fontSize: '12px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                    }}
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DANGER */}
        <div className="panel danger-zone">
          <div className="panel-title">Danger zone</div>
          <div className="panel-sub">Deactivating hides your profile and pauses matching. This can be undone by logging back in.</div>
          <button
            type="button"
            className="btn"
            onClick={handleDeactivate}
            style={{ background: 'transparent', color: 'var(--bad)', border: '1px solid rgba(255,122,122,0.35)' }}
          >
            Deactivate account
          </button>
        </div>
      </div>

      <div id="toastStack">
        {toasts.map((t) => <div className="toast" key={t.id}>{t.msg}</div>)}
      </div>
    </div>
  );
}