import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { userApi } from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

const STORAGE_KEY = 'dc_profile';

const DEFAULT_PROFILE = {
  name: '',
  bio: '',
  college: '',
  phone: { countryCode: '+91', number: '' },
  phoneNumber: { countryCode: '+91', number: '' },
  coverUrl: null,
  avatarUrl: null,
  skills: [],
  experience: 'Fresher',
  experienceLevel: 'Fresher',
  timezone: '',
  preferredRole: '',
  personality: '',
  openTo: [],
  isAvailable: true,
};

function normalizePhone(val) {
  if (val && typeof val === 'object') {
    return {
      countryCode: val.countryCode || '+91',
      number: val.number ? String(val.number).replace(/\D/g, '') : '',
    };
  }
  if (typeof val === 'string' && val) {
    return { countryCode: '+91', number: val.replace(/\D/g, '') };
  }
  return { countryCode: '+91', number: '' };
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    if (parsed?.name === 'Arjun Sharma' || parsed?.username === 'arjun') {
      localStorage.removeItem(STORAGE_KEY);
      return DEFAULT_PROFILE;
    }
    const merged = { ...DEFAULT_PROFILE, ...parsed };
    merged.phone = normalizePhone(parsed?.phone || parsed?.phoneNumber);
    merged.phoneNumber = merged.phone;
    return merged;
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

  const updateTimerRef = useRef(null);
  const pendingPatchRef = useRef({});

  // Sync profile immediately from user and fetch fresh server profile
  useEffect(() => {
    if (!user?._id) return;

    setProfile((prev) => ({
      ...prev,
      name: user.name || prev.name,
      username: user.username || prev.username,
      email: user.email || prev.email,
      avatarUrl: user.profilePicture || prev.avatarUrl,
      profilePicture: user.profilePicture || prev.profilePicture,
    }));

    userApi
      .getMe()
      .then((serverUser) => {
        if (serverUser?._id) {
          setProfile((prev) => ({
            ...prev,
            ...serverUser,
            name: serverUser.name || user.name || prev.name,
            bio: serverUser.bio !== undefined ? serverUser.bio : prev.bio,
            college: serverUser.college !== undefined ? serverUser.college : prev.college,
            avatarUrl: serverUser.profilePicture || serverUser.avatarUrl || prev.avatarUrl,
            profilePicture: serverUser.profilePicture || serverUser.avatarUrl || prev.profilePicture,
            coverUrl: serverUser.coverPicture || serverUser.coverUrl || prev.coverUrl,
            coverPicture: serverUser.coverPicture || serverUser.coverUrl || prev.coverPicture,
            skills: Array.isArray(serverUser.skills) ? serverUser.skills : (prev.skills || []),
            openTo: Array.isArray(serverUser.availableFor) ? serverUser.availableFor : (prev.openTo || []),
            experience: serverUser.experience || prev.experience,
            experienceLevel: serverUser.experienceLevel || prev.experienceLevel,
            timezone: serverUser.timezone || prev.timezone,
            preferredRole: serverUser.preferredRole || prev.preferredRole,
            personality: serverUser.personality || prev.personality,
            isAvailable: serverUser.isAvailable !== undefined ? serverUser.isAvailable : prev.isAvailable,
            phone: normalizePhone(serverUser.phoneNumber || serverUser.phone || prev.phone),
            phoneNumber: normalizePhone(serverUser.phoneNumber || serverUser.phone || prev.phoneNumber),
          }));
        }
      })
      .catch(() => {
        // Continue with local state
      });
  }, [user]);

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

    // Merge into pending patch and debounce server sync by 450ms
    pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(() => {
      const payload = { ...pendingPatchRef.current };
      pendingPatchRef.current = {};
      userApi
        .updateProfile(payload)
        .catch((err) => {
          console.warn('Backend profile update deferred:', err.message);
        });
    }, 450);
  }

  function blockUser(userToBlock) {
    if (!userToBlock) return;
    const uid = String(userToBlock._id || userToBlock.id || userToBlock.userId || userToBlock.username || userToBlock.handle || '');
    if (!uid) return;

    const uname = (userToBlock.username || userToBlock.handle || '').toLowerCase();

    setBlockedUsers((prev) => {
      if (prev.some((u) => String(u._id || u.id).toLowerCase() === uid.toLowerCase() || (uname && u.username?.toLowerCase() === uname))) return prev;
      const entry = {
        _id: uid,
        id: uid,
        name: userToBlock.name || userToBlock.username || 'User',
        username: userToBlock.username || userToBlock.handle || uid,
        initials:
          userToBlock.initials ||
          (userToBlock.name || userToBlock.username || 'U')
            .split(' ')
            .filter(Boolean)
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        blockedAt: new Date().toISOString(),
      };
      return [entry, ...prev];
    });

    if (/^[0-9a-fA-F]{24}$/.test(uid)) {
      userApi.blockUser(uid).catch((err) => {
        console.warn('Backend blockUser deferred:', err.message);
      });
    }
  }

  function unblockUser(userId) {
    if (!userId) return;
    const uid = String(userId).toLowerCase();
    setBlockedUsers((prev) =>
      prev.filter((u) => {
        const entryId = String(u._id || u.id || '').toLowerCase();
        const entryUsername = (u.username || '').toLowerCase();
        return entryId !== uid && entryUsername !== uid;
      })
    );

    if (/^[0-9a-fA-F]{24}$/.test(userId)) {
      userApi.unblockUser(userId).catch((err) => {
        console.warn('Backend unblockUser deferred:', err.message);
      });
    }
  }

  function isUserBlocked(userId) {
    if (!userId) return false;
    const uid = String(userId).toLowerCase();
    return blockedUsers.some(
      (u) =>
        String(u._id || u.id || '').toLowerCase() === uid ||
        Boolean(u.username && u.username.toLowerCase() === uid)
    );
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