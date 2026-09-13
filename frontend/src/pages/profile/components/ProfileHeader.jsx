import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Flag, ShieldBan, ShieldCheck } from 'lucide-react';

export function ProfileHeader({
  coverRef,
  avatarRef,
  handleAvatarMove,
  handleAvatarLeave,
  initials,
  name,
  handle,
  college,
  bio,
  copied,
  handleCopyLink,
  showToast,
  following,
  handleFollowToggle,
  navigate,
  isBlocked = false,
  onBlockToggle,
  onOpenReport,
  targetUserId,
  isOwnProfile = false,
  onMessage,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <>
      {/* Cover Header */}
      <div className="cover" ref={coverRef}></div>

      {/* Identity Wrap */}
      <div className="identity-wrap">
        <div className="avatar-block">
          <div
            className="avatar-lg"
            id="avatarLg"
            ref={avatarRef}
            onMouseMove={handleAvatarMove}
            onMouseLeave={handleAvatarLeave}
          >
            {initials}
          </div>

          <div className="identity-text" id="identityText">
            <h1>
              {name}
              <span className="tier-badge" id="tierBadge" title="Builder tier">
                <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
            </h1>
            <div className="handle">
              @{handle} · {college}
            </div>
            {bio && <p className="identity-bio">{bio}</p>}
          </div>

          <div className="identity-actions" id="identityActions">
            <button
              className={`btn btn-ghost btn-icon ${copied ? 'copied' : ''}`}
              id="copyLinkBtn"
              onClick={handleCopyLink}
              aria-label="Copy profile link"
              title="Copy profile link"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" id="copyLinkIcon">
                {copied ? (
                  <path d="M20 6 9 17l-5-5" />
                ) : (
                  <>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </>
                )}
              </svg>
            </button>
            <button
              className="btn btn-ghost"
              id="messageBtn"
              onClick={() => {
                if (onMessage) {
                  onMessage();
                } else {
                  window.dispatchEvent(
                    new CustomEvent('devconnect:open-chat', {
                      detail: { userId: targetUserId, name, initial: initials },
                    })
                  );
                }
              }}
            >
              Message
            </button>
            <button
              className={`btn ${following ? 'btn-ghost' : 'btn-primary'}`}
              onClick={handleFollowToggle}
            >
              {following ? 'Following' : 'Follow'}
            </button>
            {isOwnProfile && (
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/profile/edit')}
              >
                Edit profile
              </button>
            )}

            {/* More Options Dropdown */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="More options"
                title="More options"
                style={{ width: '42px', height: '42px' }}
              >
                <MoreHorizontal size={18} />
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '170px',
                    background: 'rgba(20, 20, 24, 0.96)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(14px)',
                    zIndex: 50,
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    animation: 'fadeIn 0.15s ease',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenReport) onOpenReport();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text, #fff)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Flag size={14} color="var(--coral, #ff98a2)" /> Report User
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (onBlockToggle) onBlockToggle();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isBlocked ? 'var(--coral, #ff98a2)' : 'var(--text, #fff)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    {isBlocked ? (
                      <>
                        <ShieldCheck size={14} color="var(--coral, #ff98a2)" /> Unblock User
                      </>
                    ) : (
                      <>
                        <ShieldBan size={14} color="#ff7b7b" /> Block User
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfileHeader;
