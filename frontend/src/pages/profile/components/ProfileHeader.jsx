import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Flag, ShieldBan, ShieldCheck, Camera, Users, ArrowUpRight, X, ExternalLink } from 'lucide-react';
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
  const [imgError, setImgError] = useState(false);
  const [showPfpModal, setShowPfpModal] = useState(false);
  const menuRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (!showPfpModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowPfpModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPfpModal]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside);
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 20);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
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
              if (avatarUrl && !imgError) {
                setShowPfpModal(true);
              } else if (isOwnProfile) {
                avatarInputRef.current?.click();
              }
            }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              cursor: (avatarUrl && !imgError) || isOwnProfile ? 'pointer' : 'default',
            }}
            title={
              isOwnProfile
                ? 'Click to view profile picture or hover camera to change'
                : 'Click to view profile picture'
            }
          >
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={name}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
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
                  background: 'rgba(0,0,0,0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  borderRadius: 'inherit',
                  zIndex: 3,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  avatarInputRef.current?.click();
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                title="Change profile picture"
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
                        openDirectChatWith(targetUserId, { name, initial: initials, avatarUrl, profilePicture: avatarUrl });
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
                style={{ position: 'relative', zIndex: 70 }}
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
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
                  style={{ width: '42px', height: '42px', position: 'relative', zIndex: 71 }}
                >
                  <MoreHorizontal size={18} style={{ pointerEvents: 'none' }} />
                </button>

                {menuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      minWidth: '185px',
                      background: 'rgba(20, 20, 24, 0.98)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '14px',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.85), 0 0 25px rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      zIndex: 100,
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      animation: 'fadeIn 0.15s ease',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onOpenReport) onOpenReport();
                        setMenuOpen(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text, #fff)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <Flag size={14} color="var(--coral, #ff98a2)" style={{ pointerEvents: 'none', flexShrink: 0 }} />
                      <span style={{ pointerEvents: 'none' }}>Report User</span>
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onBlockToggle) onBlockToggle();
                        setMenuOpen(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isBlocked ? 'var(--coral, #ff98a2)' : 'var(--text, #fff)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      {isBlocked ? (
                        <>
                          <ShieldCheck size={14} color="var(--coral, #ff98a2)" style={{ pointerEvents: 'none', flexShrink: 0 }} />
                          <span style={{ pointerEvents: 'none' }}>Unblock User</span>
                        </>
                      ) : (
                        <>
                          <ShieldBan size={14} color="#ff7b7b" style={{ pointerEvents: 'none', flexShrink: 0 }} />
                          <span style={{ pointerEvents: 'none' }}>Block User</span>
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

      {/* Profile Picture Fullscreen Lightbox Modal */}
      {showPfpModal && (
        <div
          className="pfp-lightbox-overlay"
          onClick={() => setShowPfpModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            className="pfp-lightbox-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '460px',
              width: '100%',
              backgroundColor: '#121215',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(255, 152, 162, 0.15)',
              textAlign: 'center',
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowPfpModal(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <X size={18} />
            </button>

            {/* Avatar Display */}
            <div
              style={{
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid rgba(255, 152, 162, 0.4)',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 152, 162, 0.2)',
                marginBottom: '20px',
                backgroundColor: '#1b1b1f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {avatarUrl && !imgError ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  referrerPolicy="no-referrer"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: '64px',
                    fontWeight: 700,
                    color: 'var(--accent, #ff98a2)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {initials}
                </span>
              )}
            </div>

            {/* User Details */}
            <h3
              style={{
                margin: '0 0 6px 0',
                fontSize: '22px',
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '-0.02em',
              }}
            >
              {name}
            </h3>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              @{handle}{college ? ` · ${college}` : ''}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {avatarUrl && !imgError && (
                <a
                  href={avatarUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '100px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                >
                  <ExternalLink size={14} /> Open full size
                </a>
              )}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPfpModal(false);
                    avatarInputRef.current?.click();
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: 'var(--accent, #ff98a2)',
                    border: 'none',
                    borderRadius: '100px',
                    color: '#0a0a0c',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <Camera size={14} /> Change photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProfileHeader;
