import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTeams } from '../context/TeamsContext.jsx';
import Grain from './profile/Grain.jsx';
import ParticleBackground from './profile/ParticleBackground.jsx';
import { Users, ArrowLeft, ListTodo } from 'lucide-react';
import { TeamHero } from './team-detail/components/TeamHero';
import { TeamMembers } from './team-detail/components/TeamMembers';
import { TeamKanban } from './team-detail/components/TeamKanban';
import '../ProfileApp.css';
import '../TeamExtras.css';

const KANBAN_COLUMNS = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

const VERB_TEMPLATES = [
  { verb: 'Set up {skill} boilerplate & repository', col: 'done', priority: 'medium' },
  { verb: 'Design {skill} architecture & interfaces', col: 'done', priority: 'high' },
  { verb: 'Build core {skill} data models & validation', col: 'inprogress', priority: 'high' },
  { verb: 'Integrate {skill} endpoints with client handlers', col: 'inprogress', priority: 'high' },
  { verb: 'Implement unit & integration test suites for {skill}', col: 'todo', priority: 'medium' },
  { verb: 'Handle edge cases, throttling & offline recovery in {skill}', col: 'todo', priority: 'low' },
  { verb: 'Polish {skill} UI interactions & loading states', col: 'todo', priority: 'medium' },
  { verb: 'Code review & security audit on {skill} module', col: 'review', priority: 'high' },
  { verb: 'Document {skill} setup & environment secrets', col: 'backlog', priority: 'low' },
  { verb: 'Benchmark & optimize {skill} runtime throughput', col: 'backlog', priority: 'medium' },
  { verb: 'Configure telemetry & alerting for {skill}', col: 'backlog', priority: 'low' },
];

function generateDefaultTasks(team) {
  const skills = team?.skillsNeeded?.length ? team.skillsNeeded : team?.skills?.length ? team.skills : ['Core', 'API', 'UI'];
  return VERB_TEMPLATES.map((t, idx) => {
    const skill = skills[idx % skills.length];
    return {
      id: `task-${idx + 1}`,
      title: t.verb.replace('{skill}', skill),
      column: t.col,
      tag: skill,
      priority: t.priority,
    };
  });
}

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getTeam,
    teams,
    isCreator,
    updateTeamRoadmap,
    kickMember,
    updateMemberRole,
    toggleAnnouncementOnly,
  } = useTeams();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'board'
  const [team, setTeam] = useState(null);
  const [toasts, setToasts] = useState([]);

  function showToast(msg) {
    const tid = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id: tid, msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== tid));
    }, 2400);
  }

  // Role Assignment State
  const [assigningRoles, setAssigningRoles] = useState(false);
  const [roleSuggestions, setRoleSuggestions] = useState(null);
  const [visibleRowsCount, setVisibleRowsCount] = useState(0);

  // Kanban Board State
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [dragId, setDragId] = useState(null);

  useEffect(() => {
    const found = getTeam(id) || teams.find(t => t.id === id || t._id === id);
    if (found) {
      setTeam(found);
      if (found.roadmapTasks) {
        setTasks(found.roadmapTasks);
      }
    }
  }, [id, teams, getTeam]);

  if (!team) {
    return (
      <div className="profile-app-root">
        <Grain />
        <div className="app-main" style={{ textAlign: 'center', paddingTop: '160px' }}>
          <h2>Team not found</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '20px' }}>
            We couldn't locate this team workspace.
          </p>
          <Link to="/teams" className="apple-btn apple-btn-primary">
            Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  const tid = team._id || team.id;
  const isOwner = isCreator(team);
  const members = team.members || [];
  const skills = team.skillsNeeded || team.skills || [];
  const roadmapExists = team.roadmapGenerated || (tasks && tasks.length > 0);

  // Trigger Role Assignment
  function handleAssignRoles() {
    setAssigningRoles(true);
    setRoleSuggestions(null);
    setVisibleRowsCount(0);

    setTimeout(() => {
      // Create role assignment recommendations based on skills
      const suggestions = members.map((m, idx) => {
        const mUser = m.user || {};
        const mName = mUser.name || 'Member';
        const primarySkill = skills[idx % Math.max(1, skills.length)] || 'Engineering';
        const role = idx === 0 && m.role === 'Creator' ? 'Tech Lead' : `${primarySkill} Specialist`;
        const rationale = `Strong in ${primarySkill} & async execution — directly fulfills core project requirements.`;
        const confidence = 85 + ((idx * 7 + 3) % 12); // Stably 88%-97%
        return {
          id: mUser._id || idx,
          name: mName,
          suggestedRole: role,
          rationale,
          confidence,
        };
      });

      setRoleSuggestions(suggestions);
      setAssigningRoles(false);

      // Stagger reveal per row (~100ms apart)
      suggestions.forEach((_, i) => {
        setTimeout(() => {
          setVisibleRowsCount((prev) => Math.max(prev, i + 1));
        }, (i + 1) * 110);
      });
    }, 1100);
  }

  // Trigger Roadmap Generation
  function handleGenerateRoadmap() {
    setGeneratingRoadmap(true);
    setTimeout(() => {
      const generated = generateDefaultTasks(team);
      setTasks(generated);
      updateTeamRoadmap(tid, generated);
      setGeneratingRoadmap(false);
    }, 1200);
  }

  // Drag and Drop
  function handleDrop(columnId) {
    if (!dragId) return;
    const updated = tasks.map((t) => (t.id === dragId ? { ...t, column: columnId } : t));
    setTasks(updated);
    updateTeamRoadmap(tid, updated);
    setDragId(null);
  }

  return (
    <div className="profile-app-root teams-page-root">
      <Grain />
      <ParticleBackground />

      <div className="app-main teams-container" style={{ maxWidth: '1120px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => navigate('/teams')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-dim)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={14} /> Back to My Teams
          </button>
        </div>

        {/* Team Hero Card */}
        <TeamHero
          team={team}
          isOwner={isOwner}
          skills={skills}
          members={members}
          onToggleAnnouncementOnly={() => {
            toggleAnnouncementOnly(tid);
            showToast(team.announcementOnly ? 'Switched to Open Chat Mode' : 'Restricted to Announcements Only');
          }}
          onShowToast={showToast}
        />

        {/* Workspace Nav Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '12px',
            marginBottom: '26px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              background: activeTab === 'overview' ? 'rgba(255, 152, 162, 0.12)' : 'transparent',
              border: activeTab === 'overview' ? '1px solid rgba(255, 152, 162, 0.3)' : '1px solid transparent',
              color: activeTab === 'overview' ? 'var(--coral, #ff98a2)' : 'var(--text-muted)',
              borderRadius: '20px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Users size={14} /> Overview & Members
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('board')}
            style={{
              background: activeTab === 'board' ? 'rgba(255, 152, 162, 0.12)' : 'transparent',
              border: activeTab === 'board' ? '1px solid rgba(255, 152, 162, 0.3)' : '1px solid transparent',
              color: activeTab === 'board' ? 'var(--coral, #ff98a2)' : 'var(--text-muted)',
              borderRadius: '20px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <ListTodo size={14} /> Board
            {tasks.length > 0 && (
              <span
                style={{
                  background: 'var(--coral, #ff98a2)',
                  color: '#0a0a0a',
                  fontSize: '10px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  padding: '1px 6px',
                }}
              >
                {tasks.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ROLE ASSIGNMENT */}
        {activeTab === 'overview' && (
          <TeamMembers
            members={members}
            isOwner={isOwner}
            assigningRoles={assigningRoles}
            roleSuggestions={roleSuggestions}
            visibleRowsCount={visibleRowsCount}
            onAssignRoles={handleAssignRoles}
            onKickMember={(memberUserId) => kickMember(tid, memberUserId)}
            onUpdateRole={(memberUserId, newRole) => updateMemberRole(tid, memberUserId, newRole)}
            onShowToast={showToast}
          />
        )}

        {/* TAB 2: ROADMAP & KANBAN BOARD */}
        {activeTab === 'board' && (
          <TeamKanban
            roadmapExists={roadmapExists}
            generatingRoadmap={generatingRoadmap}
            teamName={team.name}
            skills={skills}
            tasks={tasks}
            dragId={dragId}
            setDragId={setDragId}
            onGenerateRoadmap={handleGenerateRoadmap}
            onDrop={handleDrop}
            kanbanColumns={KANBAN_COLUMNS}
            members={members}
          />
        )}

        {/* Toast Stack */}
        {toasts.length > 0 && (
          <div
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'rgba(24, 24, 28, 0.95)',
                  border: '1px solid rgba(255, 152, 162, 0.3)',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  fontSize: '13px',
                  fontWeight: 500,
                  backdropFilter: 'blur(12px)',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                {t.msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

