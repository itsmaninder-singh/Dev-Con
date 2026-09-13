import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useProfile } from './ProfileContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { teamApi, projectApi } from '../lib/api.js';

const STORAGE_KEY = 'dc_teams_v3';
const JOINED_KEY = 'dc_joined_teams_v3';
const PROJECTS_STORAGE_KEY = 'dc_projects_v3';

const SEED_TEAMS = [
  {
    _id: 't_devconnect',
    id: 't_devconnect',
    name: 'DevConnect Studio',
    description: 'Building peer collaboration, AI matching tools, and live hackathon squad formation workflows for student builders.',
    skillsNeeded: ['React', 'Node.js', 'Socket.io', 'AI/LLM'],
    tags: ['startup', 'collaboration', 'ai'],
    type: 'startup',
    maxMembers: 4,
    status: 'recruiting',
    visibility: 'public',
    matchScore: 99,
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    creator: { _id: 'user_current', name: 'Arjun Sharma', username: 'arjun', initials: 'AS' },
    members: [
      { user: { _id: 'user_current', name: 'Arjun Sharma', username: 'arjun', initials: 'AS' }, role: 'Creator & Lead', joinedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString() },
      { user: { _id: 'u_aditi', name: 'Aditi Rao', username: 'aditi', initials: 'AR' }, role: 'Frontend Architect', joinedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
    ],
  },
  {
    _id: 't1',
    id: 't1',
    name: 'Nightwatch',
    description: 'Building a real-time incident dashboard for our college hackathon — need someone strong on WebSockets and event streaming.',
    skillsNeeded: ['React', 'Node.js', 'Socket.io'],
    tags: ['hackathon', 'realtime'],
    type: 'hackathon',
    maxMembers: 4,
    status: 'recruiting',
    visibility: 'public',
    matchScore: 92,
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    creator: { _id: 'u_aditi', name: 'Aditi Rao', username: 'aditi', initials: 'AR' },
    members: [
      { user: { _id: 'u_aditi', name: 'Aditi Rao', username: 'aditi', initials: 'AR' }, role: 'Creator', joinedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
      { user: { _id: 'u_dev2', name: 'Karan Sen', username: 'karansen', initials: 'KS' }, role: 'Frontend Lead', joinedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
      { user: { _id: 'user_current', name: 'Arjun Sharma', username: 'arjun', initials: 'AS' }, role: 'Backend & WebSockets', joinedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
    ],
  },
  {
    _id: 't2',
    id: 't2',
    name: 'Ledger Loop',
    description: 'Early-stage fintech idea for splitting group expenses across UPI. Looking for a backend-leaning generalist.',
    skillsNeeded: ['Express', 'MongoDB', 'Razorpay API'],
    tags: ['startup', 'fintech'],
    type: 'startup',
    maxMembers: 3,
    status: 'recruiting',
    visibility: 'public',
    matchScore: 81,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    creator: { _id: 'u_kabir', name: 'Kabir Mehta', username: 'kabir', initials: 'KM' },
    members: [
      { user: { _id: 'u_kabir', name: 'Kabir Mehta', username: 'kabir', initials: 'KM' }, role: 'Creator', joinedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
    ],
  },
  {
    _id: 't3',
    id: 't3',
    name: 'Formless',
    description: 'A headless form-builder library. We ship weekly and review every PR same day.',
    skillsNeeded: ['TypeScript', 'Vite', 'Testing'],
    tags: ['open-source', 'library'],
    type: 'open-source',
    maxMembers: 6,
    status: 'recruiting',
    visibility: 'public',
    matchScore: 74,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    creator: { _id: 'u_priya', name: 'Priya Nair', username: 'priya', initials: 'PN' },
    members: [
      { user: { _id: 'u_priya', name: 'Priya Nair', username: 'priya', initials: 'PN' }, role: 'Creator', joinedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
      { user: { _id: 'u_m1', name: 'Aman V', username: 'amanv', initials: 'AV' }, role: 'Core Contributor', joinedAt: new Date().toISOString() },
      { user: { _id: 'u_m2', name: 'Sneha P', username: 'snehap', initials: 'SP' }, role: 'Documentation', joinedAt: new Date().toISOString() },
      { user: { _id: 'u_m3', name: 'Leo D', username: 'leod', initials: 'LD' }, role: 'CI/CD', joinedAt: new Date().toISOString() },
      { user: { _id: 'u_m4', name: 'Maya C', username: 'mayac', initials: 'MC' }, role: 'Testing', joinedAt: new Date().toISOString() },
    ],
  },
  {
    _id: 't4',
    id: 't4',
    name: 'CampusMap',
    description: 'Indoor navigation for our campus buildings using QR waypoints. Final-year major project.',
    skillsNeeded: ['React Native', 'Firebase'],
    tags: ['college-project', 'mobile'],
    type: 'college-project',
    maxMembers: 4,
    status: 'full',
    visibility: 'public',
    matchScore: 65,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    creator: { _id: 'u_rohan', name: 'Rohan Iyer', username: 'rohan', initials: 'RI' },
    members: [
      { user: { _id: 'u_rohan', name: 'Rohan Iyer', username: 'rohan', initials: 'RI' }, role: 'Creator', joinedAt: new Date().toISOString() },
      { user: { _id: 'u_c1', name: 'Nikhil K', username: 'nikhilk', initials: 'NK' }, role: 'Mobile Dev', joinedAt: new Date().toISOString() },
      { user: { _id: 'u_c2', name: 'Tara B', username: 'tarab', initials: 'TB' }, role: 'Backend', joinedAt: new Date().toISOString() },
      { user: { _id: 'u_c3', name: 'Sameer J', username: 'sameerj', initials: 'SJ' }, role: 'UI Designer', joinedAt: new Date().toISOString() },
    ],
  },
  {
    _id: 't5',
    id: 't5',
    name: 'EcoTrack',
    description: 'Carbon footprint tracker with a gamified leaderboard for Smart India Hackathon.',
    skillsNeeded: ['Next.js', 'Chart.js'],
    tags: ['hackathon', 'sih'],
    type: 'hackathon',
    maxMembers: 5,
    status: 'recruiting',
    visibility: 'public',
    matchScore: 58,
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    creator: { _id: 'u_simran', name: 'Simran Kaur', username: 'simran', initials: 'SK' },
    members: [
      { user: { _id: 'u_simran', name: 'Simran Kaur', username: 'simran', initials: 'SK' }, role: 'Creator', joinedAt: new Date().toISOString() },
      { user: { _id: 'u_e1', name: 'Tanmay S', username: 'tanmays', initials: 'TS' }, role: 'Full Stack', joinedAt: new Date().toISOString() },
      { user: { _id: 'u_e2', name: 'Gauri M', username: 'gaurim', initials: 'GM' }, role: 'Frontend', joinedAt: new Date().toISOString() },
    ],
  },
  {
    _id: 't6',
    id: 't6',
    name: 'PixelForge Studio',
    description: 'Small freelance collective taking on client landing pages. Need one more designer-developer.',
    skillsNeeded: ['Figma', 'Tailwind'],
    tags: ['freelance', 'web-design'],
    type: 'freelance',
    maxMembers: 3,
    status: 'recruiting',
    visibility: 'public',
    matchScore: 44,
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    creator: { _id: 'u_devm', name: 'Dev Malhotra', username: 'devm', initials: 'DM' },
    members: [
      { user: { _id: 'u_devm', name: 'Dev Malhotra', username: 'devm', initials: 'DM' }, role: 'Creator', joinedAt: new Date().toISOString() },
      { user: { _id: 'u_p1', name: 'Zoya A', username: 'zoyaa', initials: 'ZA' }, role: 'Designer', joinedAt: new Date().toISOString() },
    ],
  },
];

const SEED_PROJECTS = [
  {
    _id: 'p1',
    id: 'p1',
    name: 'Fable AI',
    tagline: 'AI-assisted screenwriting & multimodal storytelling studio',
    description: 'Seed-funded collaborative platform for interactive narrative design, character bible generators, and live screenplay revisions with real-time co-authoring.',
    skills: ['React', 'WebSockets', 'LLM APIs', 'Tailwind CSS'],
    category: 'Startup',
    status: 'Active Dev',
    visibility: 'public',
    githubUrl: 'https://github.com/arjunsharma/fable-ai',
    demoUrl: 'https://fable-ai.dev',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    creator: { _id: 'user_current', name: 'Arjun Sharma', username: 'arjun', initials: 'AS' },
    collaborators: [
      { _id: 'user_current', name: 'Arjun Sharma', role: 'Lead Architect', initials: 'AS' },
      { _id: 'u_ananya', name: 'Ananya Ghosh', role: 'Product Lead', initials: 'AG' },
      { _id: 'u_karan', name: 'Karan Sen', role: 'Full Stack', initials: 'KS' },
    ],
    starsCount: 142,
    openRolesCount: 2,
    metrics: { commits: 84, prs: 19, stars: 142 },
  },
  {
    _id: 'p2',
    id: 'p2',
    name: 'Queuely',
    tagline: 'Ultra-lightweight distributed background job runner for Node',
    description: 'Built for ergonomics, zero-config reliability, and high throughput without the overhead of heavy enterprise message brokers.',
    skills: ['Node.js', 'Redis', 'TypeScript', 'Docker'],
    category: 'Open Source',
    status: 'Beta Live',
    visibility: 'public',
    githubUrl: 'https://github.com/devconnect/queuely',
    demoUrl: 'https://queuely.dev',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    creator: { _id: 'u_yusuf', name: 'Yusuf Sheikh', username: 'yusuf', initials: 'YS' },
    collaborators: [
      { _id: 'u_yusuf', name: 'Yusuf Sheikh', role: 'Creator', initials: 'YS' },
      { _id: 'user_current', name: 'Arjun Sharma', role: 'Core Maintainer', initials: 'AS' },
    ],
    starsCount: 389,
    openRolesCount: 1,
    metrics: { commits: 142, prs: 37, stars: 389 },
  },
  {
    _id: 'p3',
    id: 'p3',
    name: 'Signal Mesh',
    tagline: 'Offline-first peer-to-peer messaging for disaster relief zones',
    description: 'Decentralized mesh networking protocol powered by Bluetooth LE and ad-hoc WiFi for emergency connectivity when cellular towers fail.',
    skills: ['Bluetooth LE', 'React Native', 'Rust', 'Crypto'],
    category: 'Hackathon',
    status: 'Prototyping',
    visibility: 'public',
    githubUrl: 'https://github.com/arjunsharma/signal-mesh',
    demoUrl: 'https://signal-mesh.vercel.app',
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    creator: { _id: 'user_current', name: 'Arjun Sharma', username: 'arjun', initials: 'AS' },
    collaborators: [
      { _id: 'user_current', name: 'Arjun Sharma', role: 'Creator', initials: 'AS' },
      { _id: 'u_meera', name: 'Meera Pillai', role: 'Systems Engineer', initials: 'MP' },
    ],
    starsCount: 95,
    openRolesCount: 3,
    metrics: { commits: 38, prs: 8, stars: 95 },
  },
];

function loadInitial(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : fallback;
  } catch {
    return fallback;
  }
}

const TeamsContext = createContext(null);

export function TeamsProvider({ children }) {
  const { profile } = useProfile();
  const { user: authUser } = useAuth();

  const currentUserId = authUser?._id || 'user_current';
  const currentUserName = authUser?.name || profile?.name || 'Arjun Sharma';
  const currentUserInitials = (currentUserName || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [teams, setTeams] = useState(() => loadInitial(STORAGE_KEY, SEED_TEAMS));
  const [joinedTeamIds, setJoinedTeamIds] = useState(() => new Set(loadInitial(JOINED_KEY, [])));
  const [projects, setProjects] = useState(() => loadInitial(PROJECTS_STORAGE_KEY, SEED_PROJECTS));

  // Sync teams and projects from backend API
  useEffect(() => {
    teamApi
      .getTeams({ limit: 50 })
      .then((res) => {
        const serverTeams = res?.teams || (Array.isArray(res) ? res : []);
        if (serverTeams.length > 0) {
          setTeams((prev) => {
            const combined = [...serverTeams];
            // keep any local-only mock teams that don't collide
            prev.forEach((p) => {
              if (!combined.some((c) => (c._id || c.id) === (p._id || p.id))) {
                combined.push(p);
              }
            });
            return combined;
          });
        }
      })
      .catch(() => {
        // Backend offline or running in mock mode
      });

    projectApi
      .getProjects()
      .then((serverProjects) => {
        const list = Array.isArray(serverProjects) ? serverProjects : serverProjects?.projects || [];
        if (list.length > 0) {
          setProjects((prev) => {
            const combined = [...list];
            prev.forEach((p) => {
              if (!combined.some((c) => (c._id || c.id) === (p._id || p.id))) {
                combined.push(p);
              }
            });
            return combined;
          });
        }
      })
      .catch(() => {
        // Backend offline or running in mock mode
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
    const tid = team._id || team.id;
    if (joinedTeamIds.has(tid)) return true;
    return team.members?.some(
      (m) => m.user?._id === currentUserId || m.user?.name === currentUserName
    );
  }

  function isCreator(team) {
    if (!team) return false;
    return (
      team.creator?._id === currentUserId ||
      team.creator?.name === currentUserName
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