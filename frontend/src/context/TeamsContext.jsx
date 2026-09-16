import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useProfile } from './ProfileContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { teamApi, projectApi } from '../lib/api.js';

const STORAGE_KEY = 'dc_teams_v5';
const JOINED_KEY = 'dc_joined_teams_v5';
const PROJECTS_STORAGE_KEY = 'dc_projects_v5';

const SEED_TEAMS = [];
const SEED_PROJECTS = [];

function cleanupLegacyStorage() {
  try {
    ['dc_teams_v4', 'dc_joined_teams_v4', 'dc_projects_v4', 'dc_teams_v3', 'dc_joined_teams_v3', 'dc_projects_v3', 'dc_teams_v2', 'dc_joined_teams_v2'].forEach((k) => {
      localStorage.removeItem(k);
    });
  } catch {}
}
cleanupLegacyStorage();

function loadInitial(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

const TeamsContext = createContext(null);

export function TeamsProvider({ children }) {
  const { profile } = useProfile();
  const { user: authUser } = useAuth();

  const currentUserId = authUser?._id || 'user_current';
  const currentUserName = authUser?.name || profile?.name || authUser?.username || 'Developer';
  const currentUserInitials = (currentUserName || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [teams, setTeams] = useState(() => loadInitial(STORAGE_KEY, SEED_TEAMS));
  const [joinedTeamIds, setJoinedTeamIds] = useState(() => new Set());
  const [projects, setProjects] = useState(() => loadInitial(PROJECTS_STORAGE_KEY, SEED_PROJECTS));

  // Sync teams and projects from backend API
  useEffect(() => {
    teamApi
      .getTeams({ limit: 50 })
      .then((res) => {
        const serverTeams = res?.teams || (Array.isArray(res) ? res : []);
        setTeams(serverTeams);
      })
      .catch(() => {
        // Backend offline or network error
      });

    projectApi
      .getProjects()
      .then((serverProjects) => {
        const list = Array.isArray(serverProjects) ? serverProjects : serverProjects?.projects || [];
        setProjects(list);
      })
      .catch(() => {
        // Backend offline or network error
      });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
    } catch {
      // non-fatal
    }
  }, [teams]);

  useEffect(() => {
    if (!authUser) {
      setJoinedTeamIds(new Set());
      return;
    }
    const myJoined = new Set();
    teams.forEach((t) => {
      const isMem = t.members?.some((m) => {
        const u = m.user;
        const uid = String(u?._id || u?.id || u || '');
        const uusername = String(u?.username || '').toLowerCase();
        return (
          (uid && uid === String(authUser._id)) ||
          (uusername && authUser.username && uusername === authUser.username.toLowerCase())
        );
      });
      if (isMem) {
        myJoined.add(String(t._id || t.id));
      }
    });
    setJoinedTeamIds(myJoined);
  }, [authUser?._id, authUser?.username, teams]);

  useEffect(() => {
    try {
      localStorage.setItem(JOINED_KEY, JSON.stringify([...joinedTeamIds]));
    } catch {
      // non-fatal
    }
  }, [joinedTeamIds]);

  useEffect(() => {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch {
      // non-fatal
    }
  }, [projects]);

  const currentUserObj = useMemo(
    () => ({
      _id: currentUserId,
      name: currentUserName,
      username: authUser?.username || 'current_user',
      initials: currentUserInitials,
      avatarUrl: profile?.avatarUrl || null,
    }),
    [currentUserId, currentUserName, currentUserInitials, authUser, profile]
  );

  function isMember(team) {
    if (!team) return false;
    const tid = String(team._id || team.id || '');
    if (tid && joinedTeamIds.has(tid)) return true;
    return team.members?.some((m) => {
      const u = m.user;
      if (!u) return false;
      const uid = String(u._id || u.id || u || '');
      const uname = String(u.name || '');
      const uusername = String(u.username || '');
      return (
        (uid && (uid === String(currentUserId) || (authUser?._id && uid === String(authUser._id)))) ||
        (uname && (uname === currentUserName || uname === authUser?.name)) ||
        (uusername && authUser?.username && uusername.toLowerCase() === authUser.username.toLowerCase())
      );
    }) || false;
  }

  function isCreator(team) {
    if (!team) return false;
    const c = team.creator;
    if (!c) return false;
    const cid = String(c._id || c.id || c || '');
    const cname = String(c.name || '');
    const cusername = String(c.username || '');
    return (
      (cid && (cid === String(currentUserId) || (authUser?._id && cid === String(authUser._id)))) ||
      (cname && (cname === currentUserName || cname === authUser?.name)) ||
      (cusername && authUser?.username && cusername.toLowerCase() === authUser.username.toLowerCase())
    );
  }

  // "My Teams": either created by current user or current user is in members list
  const myTeams = useMemo(() => {
    return teams.filter((t) => isCreator(t) || isMember(t));
  }, [teams, joinedTeamIds, currentUserId, currentUserName]);

  function isProjectCreator(project) {
    if (!project) return false;
    return (
      project.creator?._id === currentUserId ||
      project.creator?.name === currentUserName ||
      project.creator?.username === authUser?.username
    );
  }

  function isProjectMember(project) {
    if (!project) return false;
    return (
      project.collaborators?.some(
        (c) => c._id === currentUserId || c.name === currentUserName
      ) || false
    );
  }

  // "My Projects": either created by current user or collaborated in
  const myProjects = useMemo(() => {
    return projects.filter((p) => isProjectCreator(p) || isProjectMember(p));
  }, [projects, currentUserId, currentUserName, authUser]);

  function createProject({
    name,
    tagline,
    description,
    skills = [],
    category = 'Startup',
    status = 'In Development',
    githubUrl = '',
    demoUrl = '',
  }) {
    const newId = `p_${Date.now()}`;
    const newProject = {
      _id: newId,
      id: newId,
      name,
      tagline: tagline || description?.slice(0, 80) || '',
      description: description || tagline || '',
      skills: Array.isArray(skills) ? skills : [skills].filter(Boolean),
      category: category || 'Startup',
      status: status || 'In Development',
      visibility: 'public',
      githubUrl: githubUrl || '',
      demoUrl: demoUrl || '',
      createdAt: new Date().toISOString(),
      creator: currentUserObj,
      collaborators: [
        {
          _id: currentUserId,
          name: currentUserName,
          role: 'Lead Architect',
          initials: currentUserInitials,
        },
      ],
      starsCount: 1,
      openRolesCount: 2,
      metrics: { commits: 1, prs: 0, stars: 1 },
    };
    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  }

  function deleteProject(projectId) {
    const pid = String(projectId);
    setProjects((prev) => prev.filter((p) => p._id !== pid && p.id !== pid));
  }

  function resetSeedData() {
    setTeams(SEED_TEAMS);
    setProjects(SEED_PROJECTS);
    setJoinedTeamIds(new Set());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TEAMS));
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(SEED_PROJECTS));
      localStorage.setItem(JOINED_KEY, JSON.stringify([]));
    } catch {
      // non-fatal
    }
  }

  function createTeam({
    name,
    description,
    skillsNeeded = [],
    skills = [],
    tags = [],
    maxMembers = 4,
    visibility = 'public',
  }) {
    const finalSkills = skillsNeeded.length ? skillsNeeded : skills;
    const newId = `t_${Date.now()}`;
    const newTeam = {
      _id: newId,
      id: newId,
      name,
      description,
      skillsNeeded: finalSkills,
      tags: tags.length ? tags : ['general'],
      type: tags[0] || 'hackathon',
      maxMembers: Number(maxMembers) || 4,
      status: 'recruiting',
      visibility,
      matchScore: 99,
      createdAt: new Date().toISOString(),
      creator: currentUserObj,
      members: [
        {
          user: currentUserObj,
          role: 'Creator',
          joinedAt: new Date().toISOString(),
        },
      ],
    };

    setTeams((prev) => [newTeam, ...prev]);

    // Async server persistence
    teamApi
      .createTeam({
        name,
        description,
        skillsNeeded: finalSkills,
        tags: tags.length ? tags : ['general'],
        maxMembers: Number(maxMembers) || 4,
        visibility,
      })
      .then((serverCreated) => {
        if (serverCreated?._id) {
          setTeams((prev) =>
            prev.map((t) => (t._id === newId || t.id === newId ? { ...serverCreated, id: serverCreated._id } : t))
          );
        }
      })
      .catch((err) => {
        console.warn('Backend createTeam deferred:', err.message);
      });

    return newTeam;
  }

  function joinTeam(teamId, role = 'Member') {
    const tid = String(teamId);

    // Call server join endpoint if MongoDB ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(tid)) {
      teamApi.joinTeam(tid, role).catch((err) => {
        console.warn('Backend joinTeam deferred:', err.message);
      });
    }
    setTeams((prev) =>
      prev.map((t) => {
        const matches = t._id === tid || t.id === tid;
        if (!matches) return t;

        const alreadyIn = t.members?.some(
          (m) => m.user?._id === currentUserId || m.user?.name === currentUserName
        );
        if (alreadyIn) return t;

        const updatedMembers = [
          ...(t.members || []),
          { user: currentUserObj, role, joinedAt: new Date().toISOString() },
        ];
        const isFull = updatedMembers.length >= (t.maxMembers || 4);

        return {
          ...t,
          members: updatedMembers,
          status: isFull ? 'full' : 'recruiting',
        };
      })
    );

    setJoinedTeamIds((prev) => new Set(prev).add(tid));
  }

  function leaveTeam(teamId) {
    const tid = String(teamId);
    setTeams((prev) =>
      prev.map((t) => {
        const matches = t._id === tid || t.id === tid;
        if (!matches) return t;

        const updatedMembers = (t.members || []).filter(
          (m) => m.user?._id !== currentUserId && m.user?.name !== currentUserName
        );
        return {
          ...t,
          members: updatedMembers,
          status: 'recruiting',
        };
      })
    );

    setJoinedTeamIds((prev) => {
      const next = new Set(prev);
      next.delete(tid);
      return next;
    });
  }

  function deleteTeam(teamId) {
    const tid = String(teamId);
    setTeams((prev) => prev.filter((t) => t._id !== tid && t.id !== tid));
    setJoinedTeamIds((prev) => {
      const next = new Set(prev);
      next.delete(tid);
      return next;
    });
  }

  function getTeam(teamIdOrSlug) {
    if (!teamIdOrSlug) return null;
    const query = String(teamIdOrSlug).toLowerCase();
    return (
      teams.find(
        (t) =>
          String(t._id || '').toLowerCase() === query ||
          String(t.id || '').toLowerCase() === query ||
          String(t.name || '').toLowerCase() === query ||
          String(t.name || '').toLowerCase().replace(/\s+/g, '-') === query
      ) || null
    );
  }

  function updateTeamRoadmap(teamId, roadmapTasks) {
    const tid = String(teamId);
    setTeams((prev) =>
      prev.map((t) => {
        if (t._id === tid || t.id === tid) {
          return {
            ...t,
            roadmapGenerated: true,
            roadmapTasks,
          };
        }
        return t;
      })
    );
  }

  function updateTeamRoles(teamId, assignedMembers) {
    const tid = String(teamId);
    setTeams((prev) =>
      prev.map((t) => {
        if (t._id === tid || t.id === tid) {
          return {
            ...t,
            members: assignedMembers,
          };
        }
        return t;
      })
    );
  }

  function kickMember(teamId, memberUserId) {
    const tid = String(teamId);
    const mid = String(memberUserId);

    if (/^[0-9a-fA-F]{24}$/.test(tid) && /^[0-9a-fA-F]{24}$/.test(mid)) {
      teamApi.removeMember(tid, mid).catch((err) => {
        console.warn('Backend removeMember deferred:', err.message);
      });
    }

    setTeams((prev) =>
      prev.map((t) => {
        if (t._id === tid || t.id === tid) {
          const updatedMembers = (t.members || []).filter(
            (m) => String(m.user?._id || m.user?.id || m.user) !== mid
          );
          return {
            ...t,
            members: updatedMembers,
            status: updatedMembers.length < (t.maxMembers || 4) ? 'recruiting' : t.status,
          };
        }
        return t;
      })
    );
  }

  function updateMemberRole(teamId, memberUserId, newRole) {
    const tid = String(teamId);
    const mid = String(memberUserId);
    setTeams((prev) =>
      prev.map((t) => {
        if (t._id === tid || t.id === tid) {
          const updatedMembers = (t.members || []).map((m) => {
            if (String(m.user?._id || m.user?.id || m.user) === mid) {
              return { ...m, role: newRole };
            }
            return m;
          });
          return {
            ...t,
            members: updatedMembers,
          };
        }
        return t;
      })
    );
  }

  function toggleAnnouncementOnly(teamId) {
    const tid = String(teamId);
    setTeams((prev) =>
      prev.map((t) => {
        if (t._id === tid || t.id === tid) {
          const nextState = !t.announcementOnly;
          if (/^[0-9a-fA-F]{24}$/.test(tid)) {
            teamApi.updateTeam(tid, { announcementOnly: nextState }).catch(() => {});
          }
          return {
            ...t,
            announcementOnly: nextState,
          };
        }
        return t;
      })
    );
  }

  return (
    <TeamsContext.Provider
      value={{
        teams,
        myTeams,
        joinedTeamIds,
        createTeam,
        joinTeam,
        leaveTeam,
        deleteTeam,
        getTeam,
        updateTeamRoadmap,
        updateTeamRoles,
        kickMember,
        updateMemberRole,
        toggleAnnouncementOnly,
        isMember,
        isCreator,
        projects,
        myProjects,
        createProject,
        deleteProject,
        isProjectCreator,
        isProjectMember,
        resetSeedData,
        currentUser: currentUserObj,
      }}
    >
      {children}
    </TeamsContext.Provider>
  );
}

export function useTeams() {
  const ctx = useContext(TeamsContext);
  if (!ctx) throw new Error('useTeams must be used within TeamsProvider');
  return ctx;
}

export function useCurrentCreator() {
  const { profile } = useProfile();
  const initials = (profile?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return { name: profile?.name || 'You', initials };
}