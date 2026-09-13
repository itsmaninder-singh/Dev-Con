import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Volume2, VolumeX } from 'lucide-react';
import { RandomLetterSwap } from './ui/random-letter-swap';
import { INITIAL_NOTIFICATIONS } from '../data/notifications.js';
import useUISound from '../hooks/useUISound.js';
import NavSearchBar from './NavSearchBar.jsx';
import { notificationApi, joinRequestApi } from '../lib/api.js';
import '../SiteNav.css';

const NAV_LINKS = [
  { to: '/explore', label: 'Explore' },
  { to: '/workspace', label: 'Workspace' },
  { to: '/rooms', label: 'Rooms' },
  { to: '/hackathons', label: 'Hackathons' },
  { to: '/ai', label: 'AI Tools' },
  { to: '/about', label: 'About' },
];

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activePreviewId, setActivePreviewId] = useState('n1');
  const [calloutTop, setCalloutTop] = useState(60);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const { user, logout } = useAuth() || {};
  const { soundEnabled, toggleSound, playClick } = useUISound();

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    // Fetch notifications from server when authenticated
    if (user?._id) {
      notificationApi
        .getNotifications({ limit: 20 })
        .then((res) => {
          const serverList = res?.notifications || (Array.isArray(res) ? res : []);
          if (serverList.length > 0) {
            const mapped = serverList.map((sn) => {
              const sUser = sn.sender || {};
              const sName = sUser.name || 'User';
              const sInitials = sName
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'U';
              return {
                id: sn._id,
                _id: sn._id,
                type: sn.type || 'message',
                unread: !sn.read,
                fitScore: sn.fitScore || 85,
                sender: { name: sName, initials: sInitials },
                text: sn.text || '',
                target: sn.target || '',
                time: 'just now',
                message: sn.message || '',
                joinRequestId: sn.joinRequest?._id || sn.joinRequest || null,
              };
            });
            setNotifications(mapped);
          }
        })
        .catch(() => {
          // Fallback to initial notifications if server is not reachable
        });
    }
  }, [user?._id]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
      if (
        notifRef.current && !notifRef.current.contains(e.target)
      ) {
        setNotifOpen(false);
      }
    };
    const onEscape = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('click', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('click', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    notificationApi.markAllAsRead().catch(() => {});
  };

  const handleResolveNotif = (id, action) => {
    const targetNotif = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (activePreviewId === id) {
      const remaining = notifications.filter((n) => n.id !== id && n.message);
      setActivePreviewId(remaining.length > 0 ? remaining[0].id : null);
    }

    // Backend sync
    if (targetNotif?.joinRequestId || (id && id.length === 24)) {
      const reqId = targetNotif?.joinRequestId || id;
      if (action === 'accept') {
        joinRequestApi.acceptJoinReq(reqId).catch(() => {});
      } else {
        joinRequestApi.ignoreJoinRequest(reqId).catch(() => {});
      }
    }
    if (id && id.length === 24) {
      notificationApi.markAsRead(id).catch(() => {});
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  const handleEditProfile = () => {
    setMenuOpen(false);
    navigate('/profile/edit');
  };

  const handleLogout = () => {
    setMenuOpen(false);
    if (logout) logout();
    navigate('/login');
  };

  const activeNotif = notifications.find((n) => n.id === activePreviewId);

  return (
    <nav className={scrolled ? 'sn-nav sn-scrolled' : 'sn-nav'}>
      <NavLink to="/" className="sn-brand">
        <img src="/logo.jpeg" alt="" className="sn-brand-mark" />
        <span>DevConnect</span>
      </NavLink>

      <ul className="sn-links">
        {NAV_LINKS.map((link) => {
          const isActive =
            link.to === '/workspace'
              ? location.pathname.startsWith('/workspace') || location.pathname.startsWith('/teams')
              : location.pathname.startsWith(link.to);

          return (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={isActive ? 'sn-active' : ''}
              >
                <RandomLetterSwap
                  label={link.label}
                  staggerDuration={0.025}
                  transition={{ duration: 0.6, type: 'spring' }}
                />
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div className="sn-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isLanding ? (
          user?._id ? (
            <NavLink
              to="/workspace"
              style={{
                padding: '9px 22px',
                borderRadius: '30px',
                border: '1px solid rgba(255, 152, 162, 0.4)',
                background: 'rgba(255, 152, 162, 0.1)',
                color: '#ff98a2',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.25s ease',
              }}
            >
              Start Building
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              style={{
                padding: '9px 22px',
                borderRadius: '30px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'transparent',
                color: '#f2f1ed',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ff98a2';
                e.currentTarget.style.background = 'rgba(255, 152, 162, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Sign In
            </NavLink>
          )
        ) : (
          <>
            {/* Navbar Search Bar */}
            <NavSearchBar />

        {/* Global Sound Control */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSound();
          }}
          className="sn-sound-toggle-btn"
          style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: soundEnabled ? 'rgba(255, 152, 162, 0.12)' : 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${soundEnabled ? 'rgba(255, 152, 162, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: soundEnabled ? 'var(--coral, #ff98a2)' : 'var(--text-dim, #71717a)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            userSelect: 'none',
          }}
          title={soundEnabled ? 'Sound Effects: ON (Click to mute)' : 'Sound Effects: OFF (Click to unmute)'}
          aria-label={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Notification Bell Icon */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setNotifOpen((v) => {
                const next = !v;
                if (next) {
                  const firstMsg = notifications.find((n) => n.message);
                  if (firstMsg) {
                    setActivePreviewId(firstMsg.id);
                    setCalloutTop(60);
                  }
                }
                return next;
              });
              setMenuOpen(false);
            }}
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--muted, #c7c8ca)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ff98a2';
              e.currentTarget.style.borderColor = 'rgba(255, 152, 162, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--muted, #c7c8ca)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }}
            title="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 4px',
                  borderRadius: '10px',
                  background: '#ff7a7a',
                  color: '#fff',
                  border: '2px solid #0a0a0c',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontSize: '9px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifOpen && (
            <div className="sn-notif-panel">
              {/* Header */}
              <div className="sn-notif-header">
                <span className="sn-notif-header-title">Notifications</span>
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="sn-notif-mark-all"
                >
                  Mark all read
                </button>
              </div>

              {/* Left Floating Speech Bubble Callout */}
              {activeNotif && activeNotif.message && (
                <div
                  className="sn-notif-callout"
                  style={{ top: `${calloutTop}px` }}
                >
                  <div className="sn-notif-callout-kicker">THEIR MESSAGE</div>
                  <div className="sn-notif-callout-body">
                    "{activeNotif.message}"
                  </div>
                </div>
              )}

              {/* Notification List */}
              <div className="sn-notif-list">
                {notifications.length > 0 ? (
                  notifications.map((n) => {
                    const isPreviewing = activePreviewId === n.id;
                    return (
                      <div
                        key={n.id}
                        className={`sn-notif-item ${isPreviewing ? 'active-preview' : ''}`}
                        onMouseEnter={(e) => {
                          if (n.message) {
                            setActivePreviewId(n.id);
                            setCalloutTop(Math.max(50, e.currentTarget.offsetTop - 10));
                          }
                        }}
                      >
                        {/* Pink unread indicator dot */}
                        {n.unread && <span className="sn-notif-unread-dot" />}

                        {/* Avatar */}
                        <div className="sn-notif-avatar">
                          {n.sender.initials}
                        </div>

                        {/* Body */}
                        <div className="sn-notif-body">
                          <div className="sn-notif-text">
                            <strong>{n.sender.name}</strong> {n.text}{' '}
                            {n.target ? <strong>{n.target}</strong> : null}
                          </div>
                          <div className="sn-notif-time">{n.time} ago</div>

                          {/* Action Buttons for join requests */}
                          {n.type === 'join_request' && (
                            <div className="sn-notif-actions">
                              <button
                                type="button"
                                className="sn-notif-btn-accept"
                                onClick={() => handleResolveNotif(n.id, 'accept')}
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                className="sn-notif-btn-ignore"
                                onClick={() => handleResolveNotif(n.id, 'ignore')}
                              >
                                Ignore
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '36px 12px', color: '#7a7d81', fontSize: '13px' }}>
                    You're all caught up!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div
          className="sn-avatar"
          ref={triggerRef}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
            setNotifOpen(false);
          }}
        >
          {initials}
        </div>
        <div className={menuOpen ? 'sn-profile-menu sn-open' : 'sn-profile-menu'} ref={menuRef}>
          <div
            className="sn-menu-item"
            onClick={() => {
              setMenuOpen(false);
              navigate('/profile');
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            My profile
          </div>
          <div className="sn-menu-item" onClick={handleEditProfile}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Edit profile
          </div>
          <div className="sn-menu-divider" />
          <div className="sn-menu-item sn-danger" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Log out
          </div>
        </div>
        </>
      )}
      </div>
    </nav>
  );
}