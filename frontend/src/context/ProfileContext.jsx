import { createContext, useContext, useEffect, useState } from 'react';
import { userApi } from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

const STORAGE_KEY = 'dc_profile';

const DEFAULT_PROFILE = {
  name: 'Arjun Sharma',
  bio: "Full-stack dev who likes shipping fast and breaking things in staging, not prod.",
  college: 'Lovely Professional University',
  phone: '',
  coverUrl: null,
  avatarUrl: null,
  skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
  experience: '2-5 years',
  experienceLevel: 'Mid-Level',
  timezone: 'Asia/Kolkata',
  preferredRole: 'Frontend',
  personality: 'Proactive builder, loves shipping MVPs & async discussions',
  openTo: ['Hackathon', 'Freelance'],
  isAvailable: true,
};

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

const ProfileContext = createContext(null);

const BLOCKED_KEY = 'dc_blocked_users_v1';

function loadInitialBlocked() {
  try {
    const raw = localStorage.getItem(BLOCKED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

export function ProfileProvider({ children }) {
  const { user } = useAuth() || {};
  const [profile, setProfile] = useState(loadInitial);
  const [blockedUsers, setBlockedUsers] = useState(loadInitialBlocked);

  // Sync profile from backend if user has active session
  useEffect(() => {
    if (!user?._id) return;
    userApi
      .getMe()
      .then((serverUser) => {
        if (serverUser) {
          setProfile((prev) => ({
            ...prev,
            ...serverUser,
            name: serverUser.name || prev.name,
            bio: serverUser.bio || prev.bio,
            college: serverUser.college || prev.college,
            skills: serverUser.skills?.length ? serverUser.skills : prev.skills,
            experience: serverUser.experience || prev.experience,
            experienceLevel: serverUser.experienceLevel || prev.experienceLevel,
            timezone: serverUser.timezone || prev.timezone,
            preferredRole: serverUser.preferredRole || prev.preferredRole,
            personality: serverUser.personality || prev.personality,
            isAvailable: serverUser.isAvailable !== undefined ? serverUser.isAvailable : prev.isAvailable,
          }));
        }
      })
      .catch(() => {
        // Unauthenticated or demo mode, continue with local state
      });
  }, [user?._id]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // storage full/unavailable
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(BLOCKED_KEY, JSON.stringify(blockedUsers));
    } catch {
      // non-fatal
    }
  }, [blockedUsers]);

  function updateProfile(patch) {
    setProfile((prev) => ({ ...prev, ...patch }));

    // Seamlessly sync with backend if user is logged in
    userApi
      .updateProfile(patch)
      .catch((err) => {
        console.warn('Backend profile update deferred:', err.message);
      });
  }

  function blockUser(userToBlock) {
    if (!userToBlock) return;
    const uid = String(userToBlock._id || userToBlock.id || userToBlock.userId || '');
    if (!uid) return;

    setBlockedUsers((prev) => {
      if (prev.some((u) => String(u._id || u.id) === uid)) return prev;
      const entry = {
        _id: uid,
        id: uid,
        name: userToBlock.name || 'User',
        username: userToBlock.username || userToBlock.handle || 'user',
        initials:
          userToBlock.initials ||
          (userToBlock.name || 'U')
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        blockedAt: new Date().toISOString(),
      };
      return [entry, ...prev];
    });
  }

  function unblockUser(userId) {
    const uid = String(userId);
    setBlockedUsers((prev) => prev.filter((u) => String(u._id || u.id) !== uid));
  }

  function isUserBlocked(userId) {
    if (!userId) return false;
    const uid = String(userId);
    return blockedUsers.some((u) => String(u._id || u.id) === uid);
  }

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        blockedUsers,
        blockUser,
        unblockUser,
        isUserBlocked,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}