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
import { TEAMS as INITIAL_TEAMS, PROJECTS } from './explore/data.js';
import { INITIAL_NOTIFICATIONS } from '../data/notifications.js';
import { useTeams } from '../context/TeamsContext.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { joinRequestApi } from '../lib/api.js';
import '../Explore.css';

let toastId = 0;

export default function Explore() {
  const { teams, joinTeam, isMember } = useTeams();
  const { isUserBlocked } = useProfile();
  const [activeTab, setActiveTab] = useState('foryou');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [modalItem, setModalItem] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifs, setNotifs] = useState(INITIAL_NOTIFICATIONS);

  // brief skeleton on first load, like a real fetch
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

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

  // Normalize teams from TeamsContext to match explore grid shapes
  const normalizedTeams = useMemo(() => {
    return (teams || []).map((t) => ({
      ...t,
      id: t._id || t.id,
      kind: 'team',
      type: t.type || t.tags?.[0] || 'hackathon',
      skillsNeeded: t.skillsNeeded || t.skills || [],
      membersCount: t.members?.length || t.membersCount || 1,
      maxMembers: t.maxMembers || 4,
      matchScore: t.matchScore || 78,
      postedAgo: t.postedAgo || 'recently',
      isJoined: isMember(t),
    }));
  }, [teams, isMember]);

  const allItems = useMemo(() => {
    return [...normalizedTeams, ...PROJECTS];
  }, [normalizedTeams]);

  const dataset = useMemo(() => {
    let data;
    if (activeTab === 'teams') data = normalizedTeams;
    else if (activeTab === 'projects') data = PROJECTS;
    else data = [...allItems].sort((a, b) => b.matchScore - a.matchScore); // "For You"

    // Filter out blocked users
    data = data.filter(
      (d) =>
        !isUserBlocked(d.creator?._id || d.creator?.id || d.creator?.name || d.creator?.username)
    );

    if (typeFilter) data = data.filter(d => d.type === typeFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.skillsNeeded || []).some(s => s.toLowerCase().includes(q))
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
    const tid = item._id || item.id;
    if (item.kind !== 'project') {
      joinTeam(tid);
      showToast(`Joined ${item.name}! Added to your teams.`);
      if (tid && tid.length === 24) {
        joinRequestApi
          .sendJoinReq({ targetType: 'team', targetId: tid, message: 'I would love to collaborate with the team!' })
          .catch(() => {});
      }
    } else {
      showToast(`Request sent to ${item.name}`);
      if (tid && tid.length === 24) {
        joinRequestApi
          .sendJoinReq({ targetType: 'project', targetId: tid, message: 'Interested in contributing to this project!' })
          .catch(() => {});
      }
    }
  }

  return (
    <div className="explore-root">
      <Preloader />

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
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onJoin={handleJoin}
            onOpen={setModalItem}
          />
        </div>
        <SuggestedPeople />
      </div>

      <ActivityTicker />
      <ToastStack toasts={toasts} />

      <CardModal
        item={modalItem}
        onClose={() => setModalItem(null)}
        onJoin={(item) => showToast(`Request sent to ${item.name}`)}
      />
    </div>
  );
}