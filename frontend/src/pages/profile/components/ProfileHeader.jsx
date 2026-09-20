import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Flag, ShieldBan, ShieldCheck, Camera, Users, ArrowUpRight } from 'lucide-react';
import { useChatUI } from '../../../context/ChatUIContext.jsx';

export function ProfileHeader({
  coverRef,
  avatarRef,
  handleAvatarMove,
  handleAvatarLeave,
  initials,
  avatarUrl,
  coverUrl,
  onAvatarUpload,
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
  connectionsCount = 0,
  onConnectionsClick,
}) {
  const { openDirectChatWith } = useChatUI();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <>
      {/* Cover Header */}
      <div
        className="cover"
        ref={coverRef}
        style={coverUrl ? {
          backgroundImage: `url(${coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {}}
      ></div>

      {/* Identity Wrap */}
      <div className="identity-wrap">
        <div className="avatar-block">
          <div
            className="avatar-lg"
            id="avatarLg"
            ref={avatarRef}
            onMouseMove={handleAvatarMove}
            onMouseLeave={handleAvatarLeave}
            onClick={() => {
              if (isOwnProfile) {
                avatarInputRef.current?.click();
              }
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              cursor: isOwnProfile ? 'pointer' : 'default',
            }}
            title={isOwnProfile ? "Click to change profile picture" : name}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 'inherit',
                  display: 'block',
                }}
              />
            ) : (
              initials
            )}
            {isOwnProfile && (
              <div
                className="avatar-camera-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  borderRadius: 'inherit',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <Camera size={26} />
              </div>
            )}
            {isOwnProfile && (
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onAvatarUpload) {
                    onAvatarUpload(file);
                  }
                }}
              />
            )}
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
            <div className="handle" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span>@{handle}{college ? ` · ${college}` : ''}</span>
              <button
                type="button"
                className="profile-conn-badge"
                onClick={onConnectionsClick}
                title={`View ${connectionsCount} connection${connectionsCount === 1 ? '' : 's'}`}
                aria-label={`View ${connectionsCount} connections`}
              >
                <span className="profile-conn-icon-box">
                  <Users size={12} strokeWidth={2.4} />
                </span>
                <span className="profile-conn-count">{connectionsCount}</span>
                <span className="profile-conn-label">{connectionsCount === 1 ? 'connection' : 'connections'}</span>
                <ArrowUpRight size={12} className="profile-conn-arrow" strokeWidth={2.2} />
              </button>
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
            {!isOwnProfile ? (
              <>
                {isBlocked ? (
                  <button
                    className="btn btn-ghost"
                    id="messageBtn"
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (showToast) showToast(`Cannot message @${handle} while blocked. Unblock first.`);
                    }}
                    title="User is blocked"
                  >
                    Blocked
                  </button>
                ) : (
                  <button
                    className="btn btn-ghost"
                    id="messageBtn"
                    data-chat-trigger="true"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onMessage) {
                        onMessage();
                      } else {
                        openDirectChatWith(targetUserId, { name, initial: initials });
                      }
                    }}
                  >
                    Message
                  </button>
                )}
                <button
                  className={`btn ${following ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollowToggle();
                  }}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate('/profile/edit')}
                >
                  Edit profile
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate('/explore')}
                  title="View other developer profiles to connect, message, or test report/block"
                  style={{ fontSize: '12.5px', opacity: 0.85 }}
                >
                  Explore members →
                </button>
              </>
            )}

            {!isOwnProfile && (
              /* More Options Dropdown */
              <div
                style={{ position: 'relative' }}
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen((o) => !o);
                  }}
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
                      minWidth: '175px',
                      background: 'rgba(20, 20, 24, 0.98)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '14px',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(16px)',
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpen(false);
                        if (onOpenReport) onOpenReport();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text, #fff)',
                        padding: '9px 12px',
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpen(false);
                        if (onBlockToggle) onBlockToggle();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isBlocked ? 'var(--coral, #ff98a2)' : 'var(--text, #fff)',
                        padding: '9px 12px',
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfileHeader;
