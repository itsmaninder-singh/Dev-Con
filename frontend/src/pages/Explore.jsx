import { useEffect, useMemo, useState } from 'react';
import AuroraField from './explore/AuroraField.jsx';
import ParticleCanvas from './explore/ParticleCanvas.jsx';
import CursorFX from './explore/CursorFX.jsx';
import Preloader from './explore/Preloader.jsx';
import PageHead from './explore/PageHead.jsx';
import FilterBar from './explore/FilterBar.jsx';
import CardGrid from './explore/CardGrid.jsx';
import SuggestedPeople from './explore/SuggestedPeople.jsx';
import CardModal from './explore/CardModal.jsx';
import ToastStack from './explore/ToastStack.jsx';
import ActivityTicker from './explore/ActivityTicker.jsx';
import { INITIAL_NOTIFICATIONS } from '../data/notifications.js';
import { useTeams } from '../context/TeamsContext.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { useAuth } from '../context/AuthContext';
import { joinRequestApi, teamApi, projectApi } from '../lib/api.js';
import '../Explore.css';

let toastId = 0;

export default function Explore() {
  const { user } = useAuth() || {};
  const {
    teams: contextTeams,
    projects: contextProjects,
    joinTeam,
    isMember,
    isCreator,
    isProjectMember,
    isProjectCreator,
    joinedTeamIds,
  } = useTeams();
  const currentUserId = String(user?._id || user?.id || '');
  const currentUsername = String(user?.username || '').toLowerCase();
  const { isUserBlocked } = useProfile();
  const [activeTab, setActiveTab] = useState('foryou');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [modalItem, setModalItem] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifs, setNotifs] = useState(INITIAL_NOTIFICATIONS);
  const [liveTeams, setLiveTeams] = useState(null);
  const [liveProjects, setLiveProjects] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      teamApi.getTeams({ limit: 50 }),
      projectApi.getProjects(),
    ]).then(([teamsRes, projectsRes]) => {
      if (!mounted) return;
      if (teamsRes.status === 'fulfilled') {
        const tList = teamsRes.value?.teams || (Array.isArray(teamsRes.value) ? teamsRes.value : []);
        setLiveTeams(tList);
      }
      if (projectsRes.status === 'fulfilled') {
        const pList = Array.isArray(projectsRes.value) ? projectsRes.value : (projectsRes.value?.projects || []);
        setLiveProjects(pList);
      }
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  const teams = liveTeams !== null ? liveTeams : contextTeams;
  const projects = liveProjects !== null ? liveProjects : contextProjects;

  function handleResolveNotif(id, action) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    showToast(action === 'accept' ? 'Request accepted!' : 'Request dismissed');
  }

  function showToast(message) {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, leaving: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 250);
    }, 2600);
  }

  // Helper for computing creator initials
  const getInitials = (name) => {
    if (!name) return 'DV';
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'DV';
  };

  // Normalize teams from TeamsContext to match explore grid shapes
  const normalizedTeams = useMemo(() => {
    return (teams || []).map((t) => {
      const creatorObj = t?.creator && typeof t.creator === 'object' ? t.creator : {};
      const creatorName = creatorObj.name || (typeof t?.creator === 'string' ? 'Team Lead' : 'Team Founder');
      const creatorUsername = creatorObj.username || (creatorName ? creatorName.toLowerCase().replace(/\s+/g, '') : 'builder');
      const creatorInitials = creatorObj.initials || getInitials(creatorName);

      return {
        ...t,
        id: t?._id || t?.id || `team_${Math.random()}`,
        name: t?.name || 'Untitled Team',
        description: t?.description || 'Collaborative team actively building on DevConnect.',
        kind: 'team',
        type: String(t?.type || t?.category || (t?.tags && t.tags[0]) || 'hackathon').toLowerCase(),
        skillsNeeded: Array.isArray(t?.skillsNeeded)
          ? t.skillsNeeded
          : (Array.isArray(t?.skills) ? t.skills : []),
        membersCount: Array.isArray(t?.members) ? t.members.length : (Number(t?.membersCount) || 1),
        maxMembers: Number(t?.maxMembers) || 4,
        matchScore: Number(t?.matchScore) || 82,
        postedAgo: t?.postedAgo || 'recently',
        isJoined: Boolean(
          (isMember && isMember(t)) ||
          (isCreator && isCreator(t)) ||
          (joinedTeamIds && joinedTeamIds.has(String(t._id || t.id))) ||
          (Array.isArray(t?.members) && t.members.some((m) => {
            const u = m?.user || m;
            const uid = String(u?._id || u?.id || u || '');
            const uusername = String(u?.username || '').toLowerCase();
            return (
              (currentUserId && uid && currentUserId === uid) ||
              (currentUsername && uusername && currentUsername === uusername)
            );
          }))
        ),
        creator: {
          _id: creatorObj._id || t?.creator,
          name: creatorName,
          username: creatorUsername,
          initials: creatorInitials,
          profilePicture: creatorObj.profilePicture || '',
        },
      };
    });
  }, [teams, isMember, isCreator, joinedTeamIds, currentUserId, currentUsername]);

  const normalizedProjects = useMemo(() => {
    return (projects || []).map((p) => {
      const ownerObj = p?.owner && typeof p.owner === 'object'
        ? p.owner
        : (p?.creator && typeof p.creator === 'object' ? p.creator : {});
      const ownerName = ownerObj.name || p?.creator?.name || 'Project Lead';
      const ownerUsername = ownerObj.username || p?.creator?.username || (ownerName ? ownerName.toLowerCase().replace(/\s+/g, '') : 'builder');
      const ownerInitials = ownerObj.initials || p?.creator?.initials || getInitials(ownerName);

      const projType = p?.category
        ? p.category.toLowerCase().replace(/\s+/g, '-')
        : (p?.type ? p.type.toLowerCase().replace(/\s+/g, '-') : 'open-source');

      const projectSkills = Array.isArray(p?.techStack)
        ? p.techStack
        : (Array.isArray(p?.skills) ? p.skills : (Array.isArray(p?.skillsNeeded) ? p.skillsNeeded : []));

      const memberCount = Array.isArray(p?.members)
        ? p.members.length
        : (Array.isArray(p?.collaborators) ? p.collaborators.length : (Number(p?.membersCount) || 1));

      return {
        ...p,
        id: p?._id || p?.id || `proj_${Math.random()}`,
        name: p?.title || p?.name || 'Untitled Project',
        description: p?.description || p?.tagline || 'Open source collaboration seeking builders.',
        kind: 'project',
        type: projType,
        skillsNeeded: projectSkills,
        membersCount: memberCount,
        maxMembers: Number(p?.maxTeamSize || p?.maxMembers) || 5,
        matchScore: Number(p?.matchScore) || 80,
        postedAgo: p?.postedAgo || 'recently',
        isJoined: Boolean(
          (isProjectMember && isProjectMember(p)) ||
          (isProjectCreator && isProjectCreator(p)) ||
          (Array.isArray(p?.collaborators) && p.collaborators.some((c) => {
            const u = c?.user || c;
            const cid = String(u?._id || u?.id || u || '');
            const cusername = String(u?.username || '').toLowerCase();
            return (
              (currentUserId && cid && currentUserId === cid) ||
              (currentUsername && cusername && currentUsername === cusername)
            );
          })) ||
          (Array.isArray(p?.members) && p.members.some((m) => {
            const u = m?.user || m;
            const mid = String(u?._id || u?.id || u || '');
            const musername = String(u?.username || '').toLowerCase();
            return (
              (currentUserId && mid && currentUserId === mid) ||
              (currentUsername && musername && currentUsername === musername)
            );
          }))
        ),
        creator: {
          _id: ownerObj._id || p?.owner || p?.creator?._id,
          name: ownerName,
          username: ownerUsername,
          initials: ownerInitials,
          profilePicture: ownerObj.profilePicture || p?.creator?.profilePicture || '',
        },
      };
    });
  }, [projects, isProjectMember, isProjectCreator, currentUserId, currentUsername]);

  const allItems = useMemo(() => {
    return [...normalizedTeams, ...normalizedProjects];
  }, [normalizedTeams, normalizedProjects]);

  const dataset = useMemo(() => {
    let data;
    if (activeTab === 'teams') data = normalizedTeams;
    else if (activeTab === 'projects') data = normalizedProjects;
    else data = [...allItems].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)); // "For You"

    // Filter out blocked users safely
    data = data.filter((d) => {
      const creatorId = d?.creator?._id || d?.creator?.id || d?.creator?.name || d?.creator?.username;
      return !creatorId || !isUserBlocked(creatorId);
    });

    if (typeFilter) data = data.filter(d => String(d.type).toLowerCase() === typeFilter.toLowerCase());
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(d =>
        String(d.name || '').toLowerCase().includes(q) ||
        (d.skillsNeeded || []).some(s => String(s).toLowerCase().includes(q))
      );
    }
    return data;
  }, [activeTab, typeFilter, searchTerm, normalizedTeams, allItems, isUserBlocked]);

  function handleToggleSave(item) {
    const tid = item._id || item.id;
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(tid)) {
        next.delete(tid);
        showToast(`Removed ${item.name} from saved`);
      } else {
        next.add(tid);
        showToast(`Saved ${item.name}`);
      }
      return next;
    });
  }

  function handleJoin(item) {
    const creatorId = String(item?.creator?._id || item?.creator?.id || item?.creator || item?.owner?._id || item?.owner?.id || item?.owner || '');
    const creatorUsername = String(item?.creator?.username || item?.owner?.username || '').toLowerCase();

    const isOwner = Boolean(
      (currentUserId && creatorId && currentUserId === creatorId) ||
      (currentUsername && creatorUsername && currentUsername === creatorUsername)
    );

    if (isOwner) {
      showToast("You cannot join your own team/project as you are the owner.");
      return;
    }

    const isAlreadyMember = Boolean(
      item?.isJoined ||
      (Array.isArray(item?.members) && item.members.some((m) => {
        const u = m?.user || m;
        const uid = String(u?._id || u?.id || u || '');
        const uusername = String(u?.username || '').toLowerCase();
        return (
          (currentUserId && uid && currentUserId === uid) ||
          (currentUsername && uusername && currentUsername === uusername)
        );
      }))
    );

    if (isAlreadyMember) {
      showToast(`You have already joined ${item.name}!`);
      return;
    }

    const tid = item._id || item.id;
    const isProj = item.kind === 'project';

    const updateLocalJoinedTeam = () => {
      setLiveTeams((prev) => {
        if (!prev) return prev;
        return prev.map((t) => {
          if (String(t._id || t.id) === String(tid)) {
            const alreadyIn = (t.members || []).some((m) => {
              const u = m?.user || m;
              const uid = String(u?._id || u?.id || u || '');
              return currentUserId && uid && currentUserId === uid;
            });
            if (alreadyIn) return t;
            const newMembers = [
              ...(t.members || []),
              {
                user: {
                  _id: currentUserId,
                  name: user?.name || 'Developer',
                  username: user?.username || 'builder',
                  profilePicture: user?.profilePicture || '',
                },
                role: 'Member',
              },
            ];
            return {
              ...t,
              members: newMembers,
              membersCount: newMembers.length,
            };
          }
          return t;
        });
      });

      setModalItem((prev) => {
        if (!prev || String(prev._id || prev.id) !== String(tid)) return prev;
        const newMembers = [
          ...(prev.members || []),
          {
            user: {
              _id: currentUserId,
              name: user?.name || 'Developer',
              username: user?.username || 'builder',
              profilePicture: user?.profilePicture || '',
            },
            role: 'Member',
          },
        ];
        return {
          ...prev,
          isJoined: true,
          members: newMembers,
          membersCount: newMembers.length,
        };
      });
    };

    if (!isProj) {
      if (tid && String(tid).length === 24) {
        joinRequestApi
          .sendJoinReq({ targetType: 'team', targetId: tid, message: 'I would love to collaborate with the team!' })
          .then(() => {
            showToast(`Join request sent to ${item.name}!`);
            joinTeam(tid);
            updateLocalJoinedTeam();
          })
          .catch((err) => {
            showToast(err?.message || `Could not join ${item.name}`);
          });
      } else {
        joinTeam(tid);
        updateLocalJoinedTeam();
        showToast(`Joined ${item.name}!`);
      }
    } else {
      if (tid && String(tid).length === 24) {
        joinRequestApi
          .sendJoinReq({ targetType: 'project', targetId: tid, message: 'Interested in contributing to this project!' })
          .then(() => {
            showToast(`Request sent to ${item.name}`);
          })
          .catch((err) => {
            showToast(err?.message || `Could not send request to ${item.name}`);
          });
      } else {
        showToast(`Request sent to ${item.name}`);
      }
    }
  }

  return (
    <div className="explore-root">
      <AuroraField />
      <ParticleCanvas />
      <CursorFX />

      <PageHead
        totalCount={allItems.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
      />

      <div className="explore-layout">
        <div className="explore-main">
          <CardGrid
            items={dataset}
            loading={loading}
            activeTab={activeTab}
            isFiltered={Boolean(searchTerm || typeFilter)}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onJoin={handleJoin}
            onOpen={setModalItem}
          />
        </div>
        <SuggestedPeople searchTerm={searchTerm} />
      </div>

      <ActivityTicker />
      <ToastStack toasts={toasts} />

      <CardModal
        item={modalItem}
        onClose={() => setModalItem(null)}
        onJoin={handleJoin}
        showToast={showToast}
      />
    </div>
  );
}