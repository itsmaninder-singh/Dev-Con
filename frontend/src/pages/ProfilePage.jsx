import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { useProfile } from '../context/ProfileContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTeams } from '../context/TeamsContext.jsx';
import { useChatUI } from '../context/ChatUIContext.jsx';
import { userApi } from '../lib/api.js';
import { ProfileHeader } from './profile/components/ProfileHeader';
import { ProfilePanels } from './profile/components/ProfilePanels';
import { ProfileTabs } from './profile/components/ProfileTabs';
import ReportUserModal from '../components/ReportUserModal.jsx';

export default function ProfilePage() {
  const { profile, blockUser, unblockUser, isUserBlocked } = useProfile();
  const { user } = useAuth() || {};
  const { teams: userTeams, projects: userProjects } = useTeams() || {};
  const { openDirectChatWith } = useChatUI();
  const navigate = useNavigate();
  const { username } = useParams();

  const [targetUser, setTargetUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const isOwnProfile = !username || (user?.username && username.toLowerCase() === user.username.toLowerCase());

  useEffect(() => {
    if (username && (!user?.username || username.toLowerCase() !== user.username.toLowerCase())) {
      setLoadingUser(true);
      setTargetUser(null);
      userApi
        .getUserByUsername(username)
        .then((res) => {
          setTargetUser(res);
        })
        .catch((err) => {
          console.warn("Could not fetch user profile:", err);
          showToast("User not found, showing public profile");
        })
        .finally(() => setLoadingUser(false));
    } else {
      setTargetUser(null);
    }
  }, [username, user?.username]);

  const activeUser = isOwnProfile ? (profile || user) : targetUser;
  const name = isOwnProfile
    ? (profile?.name || user?.name || 'Developer')
    : (targetUser?.name || username || 'Developer');
  const handle = isOwnProfile
    ? (profile?.username || user?.username || (user?.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'user'))
    : (targetUser?.username || username || 'user');
  const college = isOwnProfile
    ? (profile?.college || user?.college || '')
    : (targetUser?.college || '');
  const bio = isOwnProfile
    ? (profile?.bio || user?.bio || '')
    : (targetUser?.bio || '');
  const skills = isOwnProfile
    ? (profile?.skills && profile.skills.length > 0 ? profile.skills : (user?.skills || []))
    : (targetUser?.skills || []);
  const openTo = isOwnProfile
    ? (profile?.openTo && profile.openTo.length > 0 ? profile.openTo : (user?.availableFor || []))
    : (targetUser?.availableFor || targetUser?.openTo || []);

  const initials = isOwnProfile
    ? (profile?.initials || name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'DV')
    : (targetUser?.initials || name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'DV');

  const avatarUrl = isOwnProfile
    ? (profile?.avatarUrl || profile?.profilePicture || user?.profilePicture || user?.avatarUrl || '')
    : (targetUser?.avatarUrl || targetUser?.profilePicture || '');

  const coverUrl = isOwnProfile
    ? (profile?.coverUrl || profile?.coverPicture || user?.coverPicture || user?.coverUrl || '')
    : (targetUser?.coverUrl || targetUser?.coverPicture || '');

  const handleAvatarUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      updateProfile({ avatarUrl: dataUrl, profilePicture: dataUrl });
      showToast('Profile picture updated');
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      userApi.uploadProfilePicture(formData)
        .then((res) => {
          if (res?.profilePicture) {
            updateProfile({ avatarUrl: res.profilePicture, profilePicture: res.profilePicture });
          }
        })
        .catch((err) => console.warn('Backend profile upload deferred:', err.message));
    } catch (_) {}
  };

  const targetUserId = activeUser?._id || activeUser?.id || username || handle;
  const isBlocked = !isOwnProfile && Boolean(
    isUserBlocked(targetUserId) ||
    isUserBlocked(handle) ||
    (username && isUserBlocked(username))
  );

  const handleMessage = () => {
    if (isBlocked) {
      showToast(`Cannot message @${handle} while blocked. Unblock first.`);
      return;
    }
    // Jump straight into DM with this person via ChatUIContext
    openDirectChatWith(targetUserId, { name, initial: initials });
  };

  const [activeTab, setActiveTab] = useState('teams');
  const [following, setFollowing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  const avatarRef = useRef(null);
  const tabPillRef = useRef(null);
  const teamsBtnRef = useRef(null);
  const projectsBtnRef = useRef(null);
  const connectionsBtnRef = useRef(null);
  const repFillRef = useRef(null);
  const repScoreRef = useRef(null);
  const coverRef = useRef(null);

  const profileUserId = String(activeUser?._id || activeUser?.id || (isOwnProfile ? (user?._id || profile?._id) : targetUserId) || '');
  const profileUsername = String(activeUser?.username || (isOwnProfile ? (user?.username || profile?.username) : (username || handle)) || '').toLowerCase();

  const isUserMemberOfTeam = (team) => {
    if (!team) return false;
    const cid = String(team.creator?._id || team.creator?.id || team.creator || '');
    const cusername = String(team.creator?.username || '').toLowerCase();
    if ((profileUserId && cid === profileUserId) || (profileUsername && cusername === profileUsername)) {
      return true;
    }
    if (Array.isArray(team.members)) {
      return team.members.some((m) => {
        const u = m.user;
        const mid = String(u?._id || u?.id || u || '');
        const musername = String(u?.username || '').toLowerCase();
        return (profileUserId && mid === profileUserId) || (profileUsername && musername === profileUsername);
      });
    }
    return false;
  };

  const getTeamRoleForProfileUser = (team) => {
    const cid = String(team.creator?._id || team.creator?.id || team.creator || '');
    const cusername = String(team.creator?.username || '').toLowerCase();
    if ((profileUserId && cid === profileUserId) || (profileUsername && cusername === profileUsername)) {
      return 'Creator';
    }
    if (Array.isArray(team.members)) {
      const match = team.members.find((m) => {
        const u = m.user;
        const mid = String(u?._id || u?.id || u || '');
        const musername = String(u?.username || '').toLowerCase();
        return (profileUserId && mid === profileUserId) || (profileUsername && musername === profileUsername);
      });
      if (match?.role) return match.role;
    }
    return 'Member';
  };

  const displayTeams = (userTeams || [])
    .filter(isUserMemberOfTeam)
    .map((t) => ({
      id: t._id || t.id,
      type: t.category || t.type || (t.tags && t.tags[0]) || 'team',
      name: t.name,
      role: getTeamRoleForProfileUser(t),
    }));

  const isUserInProject = (project) => {
    if (!project) return false;
    const cid = String(project.creator?._id || project.creator?.id || project.creator || '');
    const cusername = String(project.creator?.username || '').toLowerCase();
    if ((profileUserId && cid === profileUserId) || (profileUsername && cusername === profileUsername)) {
      return true;
    }
    if (Array.isArray(project.collaborators)) {
      return project.collaborators.some((collab) => {
        const mid = String(collab?._id || collab?.id || collab || '');
        const musername = String(collab?.username || '').toLowerCase();
        return (profileUserId && mid === profileUserId) || (profileUsername && musername === profileUsername);
      });
    }
    return false;
  };

  const displayProjects = (userProjects || [])
    .filter(isUserInProject)
    .map((p) => ({
      id: p._id || p.id,
      type: p.category || p.type || p.status || 'open-source',
      name: p.name || p.title,
      role: String(p.creator?._id || p.creator?.id || p.creator || '') === profileUserId ? 'Creator' : (p.role || 'Contributor'),
    }));

  const showToast = (msg) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    setCopied(true);
    showToast('Profile link copied');
    setTimeout(() => setCopied(false), 1800);
  };

  const handleFollowToggle = () => {
    setFollowing((prev) => {
      const next = !prev;
      if (next) {
        const destId = activeUser?._id || (targetUserId && String(targetUserId).length === 24 ? targetUserId : null);
        if (destId) {
          userApi.sendConnectRequest(destId)
            .then(() => showToast(`Connection request sent to ${name}`))
            .catch((err) => showToast(err?.message || `Could not send request to ${name}`));
        } else {
          showToast(`You're now following ${name}`);
        }
      } else {
        showToast(`Unfollowed ${name}`);
      }
      return next;
    });
  };

  const fetchConnections = () => {
    const slug = username || user?.username || profileUserId;
    if (!slug) return;
    setLoadingConnections(true);
    userApi
      .getUserConnections(slug)
      .then((res) => {
        setConnections(res?.connections || []);
      })
      .catch((err) => {
        console.warn("Could not fetch connections:", err);
      })
      .finally(() => setLoadingConnections(false));
  };

  useEffect(() => {
    fetchConnections();
  }, [username, user?.username, profileUserId]);

  // Tab pill sliding between Teams, Projects, and Connections
  useEffect(() => {
    let activeBtn = teamsBtnRef.current;
    if (activeTab === 'projects') activeBtn = projectsBtnRef.current;
    else if (activeTab === 'connections') activeBtn = connectionsBtnRef.current;

    if (activeBtn && tabPillRef.current) {
      gsap.to(tabPillRef.current, {
        x: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        duration: 0.35,
        ease: 'power3.out',
      });
    }
  }, [activeTab]);

  // Entrance and Count-up Animations
  useEffect(() => {
    // Entrance
    gsap.to(['#avatarLg'], { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out', delay: 0.1 });
    gsap.to(['#identityText', '#identityActions'], { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.2 });
    gsap.to(['#panelAbout', '#panelRep', '#panelAvail', '#panelSkills', '#panelGithub'], {
      opacity: 1,
      y: 0,
      scale: 1,
      clearProps: 'transform,scale',
      duration: 0.6,
      stagger: 0.08,
      ease: 'power3.out',
      delay: 0.35,
    });
    gsap.to('.bio-text', { filter: 'blur(0px)', duration: 0.9, delay: 0.75, ease: 'power2.out' });
    gsap.fromTo('#tierBadge', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, delay: 0.85, ease: 'power2.out' });
    gsap.to('.right-col', { opacity: 1, y: 0, duration: 0.6, delay: 0.45, ease: 'power2.out' });

    // Reputation Ring
    const repScore = activeUser?.reputation?.score ?? 0;
    const repMax = 1000;
    const circumference = 2 * Math.PI * 27;
    if (repFillRef.current) {
      repFillRef.current.style.strokeDasharray = circumference;
      repFillRef.current.style.strokeDashoffset = circumference;
      gsap.to(repFillRef.current, {
        strokeDashoffset: circumference - (repScore / repMax) * circumference,
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.5,
        onComplete: () => {
          const ring = document.querySelector('.rep-ring');
          if (ring) ring.classList.add('pulse');
        },
      });
    }

    const repTarget = { v: 0 };
    gsap.to(repTarget, {
      v: repScore,
      duration: 1.2,
      delay: 0.5,
      ease: 'power3.out',
      onUpdate: () => {
        if (repScoreRef.current) {
          repScoreRef.current.textContent = `${Math.round(repTarget.v)} / ${repMax}`;
        }
      },
    });

    // Streak count-ups
    document.querySelectorAll('.streak-stat .num').forEach((el) => {
      const final = Number(el.getAttribute('data-count') || 0);
      const t = { v: 0 };
      gsap.to(t, {
        v: final,
        duration: 1,
        delay: 0.6,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = Math.round(t.v);
        },
      });
    });

    // Star count-ups
    document.querySelectorAll('.star-count').forEach((el) => {
      const final = Number(el.getAttribute('data-count') || 0);
      const t = { v: 0 };
      gsap.to(t, {
        v: final,
        duration: 1,
        delay: 0.9,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = Math.round(t.v);
        },
      });
    });

    // Chips entrance
    gsap.fromTo(
      '[data-chip]',
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration: 0.45, stagger: 0.04, ease: 'power2.out', delay: 0.65 }
    );

    // Parallax on cover
    const handleScroll = () => {
      if (coverRef.current) {
        const y = Math.min(window.scrollY, 260);
        coverRef.current.style.setProperty('--parallax', `${y * 0.3}px`);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Avatar hover 3D tilt
  const handleAvatarMove = (e) => {
    const el = avatarRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el, { rotateY: px * 22, rotateX: -py * 22, scale: 1.06, duration: 0.3, ease: 'power2.out', overwrite: true });
  };

  const handleAvatarLeave = () => {
    const el = avatarRef.current;
    if (!el) return;
    gsap.to(el, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.5, ease: 'power3.out', overwrite: true });
  };

  const tabData = activeTab === 'teams' ? displayTeams : displayProjects;

  return (
    <div className="profile-template-root">
      {/* Background Aurora Blobs */}
      <div className="aurora-field" aria-hidden="true">
        <div className="aurora-blob a1" />
        <div className="aurora-blob a2" />
      </div>
      <div className="grain-overlay" aria-hidden="true" />

      {/* Identity Wrap and Cover */}
      <ProfileHeader
        coverRef={coverRef}
        avatarRef={avatarRef}
        handleAvatarMove={handleAvatarMove}
        handleAvatarLeave={handleAvatarLeave}
        initials={initials}
        avatarUrl={avatarUrl}
        coverUrl={coverUrl}
        onAvatarUpload={handleAvatarUpload}
        name={name}
        handle={handle}
        college={college}
        bio={bio}
        copied={copied}
        handleCopyLink={handleCopyLink}
        showToast={showToast}
        following={following}
        handleFollowToggle={handleFollowToggle}
        navigate={navigate}
        targetUserId={targetUserId}
        isOwnProfile={isOwnProfile}
        onMessage={handleMessage}
        isBlocked={isBlocked}
        onBlockToggle={() => {
          if (isBlocked) {
            unblockUser(targetUserId);
            if (handle && handle !== targetUserId) unblockUser(handle);
            if (username && username !== targetUserId) unblockUser(username);
            showToast(`Unblocked ${name}`);
          } else {
            blockUser({
              _id: activeUser?._id || activeUser?.id || targetUserId,
              id: activeUser?._id || activeUser?.id || targetUserId,
              name,
              username: handle || username,
              initials,
            });
            showToast(`Blocked ${name}`);
          }
        }}
        onOpenReport={() => setReportModalOpen(true)}
        connectionsCount={connections.length}
        onConnectionsClick={() => setActiveTab('connections')}
      />

      {isBlocked && (
        <div
          style={{
            margin: '16px 6% 0',
            padding: '12px 18px',
            borderRadius: '14px',
            background: 'rgba(255, 120, 120, 0.12)',
            border: '1px solid rgba(255, 120, 120, 0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            color: '#ff98a2',
            fontSize: '13.5px',
            fontWeight: 500,
            position: 'relative',
            zIndex: 3,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🚫</span>
            <span>You have blocked <strong>@{handle}</strong>. They cannot message or interact with you.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              unblockUser(targetUserId);
              if (handle && handle !== targetUserId) unblockUser(handle);
              if (username && username !== targetUserId) unblockUser(username);
              showToast(`Unblocked ${name}`);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '5px 12px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Unblock
          </button>
        </div>
      )}

      <ReportUserModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetUser={{
          _id: activeUser?._id || activeUser?.id || targetUserId,
          id: activeUser?._id || activeUser?.id || targetUserId,
          name,
          username: handle || username,
        }}
        onReportSuccess={() => showToast(`Report filed for @${handle || username}`)}
      />

      {/* Main Grid Layout */}
      <div className="profile-body">
        <ProfilePanels
          profile={isOwnProfile ? (profile || user || {}) : (targetUser || {})}
          bio={bio}
          college={college}
          openTo={openTo}
          skills={skills}
          repFillRef={repFillRef}
          repScoreRef={repScoreRef}
          navigate={navigate}
          isOwnProfile={isOwnProfile}
        />

        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabPillRef={tabPillRef}
          teamsBtnRef={teamsBtnRef}
          projectsBtnRef={projectsBtnRef}
          connectionsBtnRef={connectionsBtnRef}
          tabData={tabData}
          displayTeams={displayTeams}
          displayProjects={displayProjects}
          displayConnections={connections}
          onMessageConnection={(conn) => {
            const cid = conn._id || conn.id;
            const cname = conn.name || 'Developer';
            const cinit = (cname || 'D')[0].toUpperCase();
            openDirectChatWith(cid, { name: cname, initial: cinit });
          }}
          navigate={navigate}
          isOwnProfile={isOwnProfile}
        />
      </div>

      {/* Floating Toast Notification Stack */}
      <div id="toastStack">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span>{t.msg}</span>
          </div>
        ))}
      </div>


      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,300;0,450;1,450&display=swap');

        .profile-template-root {
          --bg: #050506;
          --ink: #f2f1ed;
          --muted: #c7c8ca;
          --dim: #7a7d81;
          --accent: var(--coral, #ff98a2);
          --accent-dim: rgba(255, 152, 162, 0.4);
          --accent-soft: rgba(255, 152, 162, 0.12);
          --accent-glow: rgba(255, 152, 162, 0.35);
          --glass: rgba(255, 255, 255, 0.035);
          --glass-border: rgba(255, 255, 255, 0.08);
          --radius: 18px;

          position: relative;
          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          overflow-x: clip;
          padding-bottom: 80px;
        }

        .profile-template-root * {
          box-sizing: border-box;
        }

        .grain-overlay {
          position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.05; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .aurora-field { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
        .aurora-blob { position: absolute; border-radius: 50%; filter: blur(60px); }
        .aurora-blob.a1 {
          top: -20%; left: 60%; width: 700px; height: 700px;
          background: radial-gradient(circle, var(--accent-dim) 0%, transparent 68%);
          opacity: 0.3; animation: driftA 30s ease-in-out infinite;
        }
        .aurora-blob.a2 {
          top: 50%; left: -15%; width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(122, 160, 255, 0.07) 0%, transparent 70%);
          animation: driftB 34s ease-in-out infinite;
        }

        @keyframes driftA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-6%, 8%) scale(1.1); }
        }
        @keyframes driftB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(8%, -6%) scale(1.08); }
        }

        /* ================= COVER + IDENTITY ================= */
        .cover {
          position: relative; height: 260px; margin-top: 64px;
          background:
            radial-gradient(circle at 20% 30%, rgba(255, 152, 162, 0.16) 0%, transparent 55%),
            radial-gradient(circle at 80% 70%, rgba(255, 152, 162, 0.08) 0%, transparent 50%),
            #0b0b0d;
          overflow: hidden;
        }
        .cover::after {
          content: ''; position: absolute; inset: -40px 0 0 0;
          background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
          background-size: 38px 38px;
          mask-image: linear-gradient(to bottom, black, transparent);
          transform: translateY(var(--parallax, 0px));
          will-change: transform;
        }

        .identity-wrap { position: relative; z-index: 2; padding: 0 6%; }
        .avatar-block {
          display: flex; align-items: flex-end; gap: 22px;
          margin-top: -64px; perspective: 700px;
        }
        .avatar-lg {
          width: 128px; height: 128px; border-radius: 26px;
          background: linear-gradient(135deg, #232326, #141416);
          border: 3px solid var(--bg);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', sans-serif; font-weight: 700; font-size: 40px; color: var(--accent);
          flex-shrink: 0;
          box-shadow: 0 0 0 1px rgba(255, 152, 162, 0.25), 0 1px 0 rgba(255, 255, 255, 0.05) inset, 0 30px 60px -20px rgba(0, 0, 0, 0.7);
          opacity: 0; transform: scale(0.9); transform-style: preserve-3d; cursor: pointer;
          transition: border-color 0.3s ease;
        }
        .identity-text { padding-bottom: 10px; opacity: 0; transform: translateY(16px); }
        .identity-text h1 {
          font-family: 'Fraunces', serif; font-weight: 450; font-style: italic;
          font-size: clamp(28px, 4.2vw, 40px); letter-spacing: -0.01em;
          display: inline-flex; align-items: center; gap: 10px;
          color: var(--ink);
        }
        .tier-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, var(--accent), #f472b6);
          box-shadow: 0 0 0 3px rgba(255, 152, 162, 0.2);
          vertical-align: middle; margin-bottom: 2px;
        }
        .tier-badge svg { width: 12px; height: 12px; stroke: #0a0a0a; stroke-width: 3; }
        .identity-text .handle {
          font-family: 'Inter', sans-serif; color: var(--dim); font-size: 13px; margin-top: 6px;
        }
        .identity-bio {
          font-size: 13.5px;
          color: var(--muted);
          line-height: 1.5;
          margin-top: 8px;
          max-width: 620px;
        }
        .identity-actions {
          margin-left: auto; padding-bottom: 14px; display: flex; gap: 10px;
          opacity: 0; transform: translateY(16px);
        }
        .btn {
          font-family: 'Inter', sans-serif; font-size: 13px; padding: 11px 22px;
          border-radius: 30px; cursor: pointer; transition: box-shadow 0.25s ease, border-color 0.25s ease, background 0.2s ease, transform 0.2s ease;
        }
        .btn:hover { transform: translateY(-1px); }
        .btn-primary { background: var(--accent); color: #1a0f12; font-weight: 600; border: none; }
        .btn-primary:hover { box-shadow: 0 0 24px var(--accent-glow); }
        .btn-ghost { background: transparent; color: var(--ink); border: 1px solid rgba(255, 255, 255, 0.18); }
        .btn-ghost:hover { border-color: var(--accent); }
        .btn-icon {
          width: 42px; height: 42px; padding: 0; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .btn-icon svg { width: 16px; height: 16px; stroke: var(--ink); transition: stroke 0.2s ease; }
        .btn-icon.copied { border-color: var(--accent); }
        .btn-icon.copied svg { stroke: var(--accent); }

        /* ================= MAIN LAYOUT ================= */
        .profile-body {
          position: relative; z-index: 2;
          display: grid; grid-template-columns: 340px 1fr; gap: 36px;
          padding: 44px 6% 120px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }
        @media (max-width: 960px) {
          .profile-body { grid-template-columns: 1fr; gap: 28px; }
          .identity-actions { margin-left: 0; margin-top: 16px; flex-wrap: wrap; }
          .avatar-block { flex-wrap: wrap; }
        }

        .left-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
        }

        .right-col {
          min-width: 0;
        }

        .profile-panel,
        .left-col .panel {
          position: relative !important;
          background: var(--glass); border: 1px solid var(--glass-border);
          border-radius: var(--radius); padding: 24px;
          opacity: 1 !important; transform: none !important;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 30px 60px -30px rgba(0, 0, 0, 0.5);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          width: 100%;
          box-sizing: border-box;
        }
        .profile-panel:hover,
        .left-col .panel:hover { border-color: rgba(255, 255, 255, 0.14); }
        .profile-panel h4,
        .left-col .panel h4 {
          font-size: 11px; letter-spacing: 2px;
          text-transform: uppercase; color: var(--dim); margin-bottom: 16px;
        }
        .panel-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .panel-title-row h4 { margin-bottom: 0; }
        .mini-edit-btn {
          font-family: inherit;
          font-size: 11.5px;
          color: var(--accent);
          background: var(--accent-soft);
          border: 1px solid var(--accent-dim);
          padding: 4px 10px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .mini-edit-btn:hover {
          background: var(--accent);
          color: #1a0f12;
        }

        .bio-text { color: var(--muted); font-size: 14px; line-height: 1.7; will-change: filter; }

        .about-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 12px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid var(--glass-border);
        }
        .about-metric-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .metric-lbl {
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--dim);
        }
        .metric-val {
          font-size: 13px;
          color: var(--ink);
          font-weight: 500;
        }
        .metric-val.status-val {
          color: var(--accent);
          font-weight: 600;
        }

        .rep-ring-wrap { display: flex; align-items: center; gap: 16px; position: relative; }
        .rep-tooltip {
          position: absolute; top: calc(100% + 14px); left: 0; z-index: 10; width: 220px;
          background: rgba(16, 16, 18, 0.96); border: 1px solid var(--glass-border); border-radius: 14px;
          padding: 14px 16px; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.6);
          opacity: 0; transform: translateY(-6px); pointer-events: none;
          transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .rep-ring-wrap:hover .rep-tooltip { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .rep-tooltip-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--muted); padding: 5px 0; }
        .rep-tooltip-row b { color: var(--ink); font-weight: 600; font-variant-numeric: tabular-nums; }
        .rep-tooltip-title { font-size: 10.5px; text-transform: uppercase; letter-spacing: 1px; color: var(--dim); margin-bottom: 8px; }
        .rep-ring { position: relative; width: 64px; height: 64px; flex-shrink: 0; }
        .rep-ring svg { transform: rotate(-90deg); }
        .rep-ring .track { fill: none; stroke: rgba(255, 255, 255, 0.08); stroke-width: 5; }
        .rep-ring .fill { fill: none; stroke: var(--accent); stroke-width: 5; stroke-linecap: round; }
        .rep-level { font-size: 16px; font-weight: 700; text-transform: capitalize; }
        .rep-score { font-family: 'Inter', sans-serif; font-size: 12px; color: var(--dim); margin-top: 2px; font-variant-numeric: tabular-nums; }
        .rep-breakdown-row {
          display: flex;
          gap: 20px;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid var(--glass-border);
        }
        .rep-stat-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 11px;
          color: var(--dim);
        }
        .rep-stat-item b {
          font-size: 14px;
          color: var(--ink);
        }

        .chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-chip {
          font-family: 'Inter', sans-serif; font-size: 11.5px;
          color: var(--muted); border: 1px solid var(--glass-border);
          padding: 6px 12px; border-radius: 20px;
          background: rgba(255, 255, 255, 0.02);
        }
        .avail-chip {
          font-family: 'Inter', sans-serif; font-size: 11.5px;
          color: var(--accent); border: 1px solid var(--accent-dim);
          background: var(--accent-soft);
          padding: 6px 12px; border-radius: 20px;
        }

        .streak-row { display: flex; gap: 26px; margin-top: 4px; }
        .streak-stat .num { font-family: 'Inter', sans-serif; font-weight: 800; letter-spacing: -0.02em; font-size: 26px; color: var(--ink); font-variant-numeric: tabular-nums; }
        .streak-stat .lbl { font-family: 'Inter', sans-serif; font-size: 10.5px; color: var(--dim); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

        .repo-item { padding: 14px 0; position: relative; }
        .repo-item:not(:last-child)::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--glass-border) 15%, var(--glass-border) 85%, transparent);
        }
        .repo-item a { font-weight: 600; font-size: 13.5px; color: var(--ink); text-decoration: none; }
        .repo-item a:hover { color: var(--accent); }
        .repo-item p { font-size: 12.5px; color: var(--dim); margin-top: 3px; line-height: 1.5; }
        .repo-meta { display: flex; gap: 12px; margin-top: 6px; font-family: 'Inter', sans-serif; font-size: 11px; color: var(--dim); font-variant-numeric: tabular-nums; }

        /* ================= TABS + CARDS (right column) ================= */
        .tab-row { display: flex; gap: 8px; margin-bottom: 24px; position: relative; }
        .tab-btn {
          font-size: 13px;
          padding: 10px 20px; border-radius: 30px; cursor: pointer;
          border: 1px solid var(--glass-border); color: var(--muted);
          background: var(--glass); transition: color 0.25s ease, border-color 0.25s ease;
          position: relative; z-index: 2; user-select: none;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .tab-btn.active { color: #1a0f12; border-color: transparent; font-weight: 600; }
        .tab-badge {
          background: rgba(0, 0, 0, 0.25);
          color: inherit;
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 10px;
          font-weight: 600;
        }
        .tab-pill {
          position: absolute; top: 0; left: 0; height: 100%; border-radius: 30px; background: var(--accent);
          z-index: 1;
        }

        .item-card {
          background: var(--glass); border: 1px solid var(--glass-border);
          border-radius: 14px; padding: 20px; display: flex; justify-content: space-between;
          align-items: center; gap: 16px; margin-bottom: 12px; cursor: pointer;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.03) inset, 0 20px 40px -30px rgba(0, 0, 0, 0.4);
          transition: border-color 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .item-card:hover { border-color: var(--accent-dim); transform: translateX(4px); }
        .item-card .type-badge {
          font-family: 'Inter', sans-serif; font-size: 10px; letter-spacing: 1px;
          text-transform: uppercase; color: var(--accent);
          background: var(--accent-soft); border: 1px solid var(--accent-dim);
          padding: 4px 9px; border-radius: 20px; display: inline-block; margin-bottom: 8px;
        }
        .item-card h4 { font-size: 15.5px; margin-bottom: 2px; color: var(--ink); }
        .item-card .role { font-family: 'Inter', sans-serif; font-size: 11.5px; color: var(--dim); }
        .item-card .arrow { color: var(--dim); font-size: 18px; flex-shrink: 0; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s ease; }
        .item-card:hover .arrow { transform: translateX(5px); color: var(--accent); }

        .rep-ring::after {
          content: ''; position: absolute; inset: -6px; border-radius: 50%;
          box-shadow: 0 0 0 0 var(--accent-glow); opacity: 0;
        }
        .rep-ring.pulse::after { animation: repPulse 1.2s ease-out; }
        @keyframes repPulse {
          0% { opacity: 1; box-shadow: 0 0 0 0 var(--accent-glow); }
          100% { opacity: 0; box-shadow: 0 0 0 16px transparent; }
        }

        #toastStack {
          position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 250;
          display: flex; flex-direction: column; gap: 10px; pointer-events: none; align-items: center;
        }
        .toast {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 22px; border-radius: 24px;
          background: rgba(28, 28, 30, 0.85); border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%);
          box-shadow: 0 8px 30px -8px rgba(0, 0, 0, 0.5);
          font-size: 13px; font-weight: 590; color: #fff; letter-spacing: -0.01em;
          animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
