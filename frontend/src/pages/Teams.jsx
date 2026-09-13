import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTeams } from '../context/TeamsContext.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import Grain from './profile/Grain.jsx';
import ParticleBackground from './profile/ParticleBackground.jsx';
import {
  Check,
  Layers,
  Plus,
  FolderGit2,
  Compass,
} from 'lucide-react';
import { TeamsHeader } from './teams/components/TeamsHeader';
import { TeamsToolbar } from './teams/components/TeamsToolbar';
import { TeamCard } from './teams/components/TeamCard';
import { ProjectCard } from './teams/components/ProjectCard';
import { BlueprintSection } from './teams/components/BlueprintSection';
import { CreateProjectModal } from './teams/components/CreateProjectModal';
import '../ProfileApp.css';
import '../TeamExtras.css';

export default function Teams() {
  const {
    myTeams,
    leaveTeam,
    deleteTeam,
    isCreator,
    myProjects,
    createProject,
    deleteProject,
    isProjectCreator,
    currentUser,
    createTeam,
  } = useTeams();
  const { profile } = useProfile();

  // Primary view: 'all' | 'teams' | 'projects'
  const [entityView, setEntityView] = useState('all');
  // Secondary sub-filter: 'all' | 'created' | 'joined'
  const [activeTab, setActiveTab] = useState('all');

  const [copiedId, setCopiedId] = useState(null);
  const [confirmLeaveId, setConfirmLeaveId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState(null);

  // Create Project Modal state
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formCategory, setFormCategory] = useState('Startup');
  const [formSkills, setFormSkills] = useState(['React', 'TypeScript']);
  const [formSkillInput, setFormSkillInput] = useState('');
  const [formGithub, setFormGithub] = useState('');
  const [formDemo, setFormDemo] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Teams filtering
  const createdTeams = useMemo(
    () => myTeams.filter((t) => isCreator(t)),
    [myTeams, isCreator]
  );
  const joinedTeams = useMemo(
    () => myTeams.filter((t) => !isCreator(t)),
    [myTeams, isCreator]
  );

  // Projects filtering
  const createdProjects = useMemo(
    () => (myProjects || []).filter((p) => isProjectCreator(p)),
    [myProjects, isProjectCreator]
  );
  const joinedProjects = useMemo(
    () => (myProjects || []).filter((p) => !isProjectCreator(p)),
    [myProjects, isProjectCreator]
  );

  // Active items calculation based on view and sub-filter
  const displayedTeams = useMemo(() => {
    if (entityView === 'projects') return [];
    if (activeTab === 'created') return createdTeams;
    if (activeTab === 'joined') return joinedTeams;
    return myTeams;
  }, [entityView, activeTab, myTeams, createdTeams, joinedTeams]);

  const displayedProjects = useMemo(() => {
    if (entityView === 'teams') return [];
    if (activeTab === 'created') return createdProjects;
    if (activeTab === 'joined') return joinedProjects;
    return myProjects || [];
  }, [entityView, activeTab, myProjects, createdProjects, joinedProjects]);

  const totalItemsCount = displayedTeams.length + displayedProjects.length;

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function handleShare(item, type = 'team') {
    const id = item._id || item.id;
    const url = `${window.location.origin}/teams#${type}-${id}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    showToast(`Link copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleLeave(teamId) {
    leaveTeam(teamId);
    setConfirmLeaveId(null);
    showToast('Left team successfully');
  }

  function handleDeleteTeam(teamId) {
    deleteTeam(teamId);
    setConfirmDeleteId(null);
    showToast('Team removed');
  }

  function handleDeleteProject(projId) {
    deleteProject(projId);
    setConfirmDeleteProjectId(null);
    showToast('Project deleted');
  }

  function handleAddSkillTag() {
    const trimmed = formSkillInput.trim();
    if (trimmed && !formSkills.includes(trimmed)) {
      setFormSkills([...formSkills, trimmed]);
      setFormSkillInput('');
    }
  }

  function handleRemoveSkillTag(skillToRemove) {
    setFormSkills(formSkills.filter((s) => s !== skillToRemove));
  }

  function handleCreateProjectSubmit(e) {
    e.preventDefault();
    if (!formName.trim()) return;

    createProject({
      name: formName.trim(),
      tagline: formTagline.trim() || 'Next-generation developer tool',
      description: formTagline.trim() || 'Building something remarkable with our engineering squad.',
      category: formCategory,
      skills: formSkills,
      githubUrl: formGithub.trim(),
      demoUrl: formDemo.trim(),
      status: 'Active Dev',
    });

    setFormName('');
    setFormTagline('');
    setFormGithub('');
    setFormDemo('');
    setShowModal(false);
    showToast('🚀 Project created successfully!');
  }

  function instantiateBlueprint(type) {
    if (type === 'hackathon') {
      createTeam({
        name: 'Quantum Sprint',
        description: 'Building high-performance decentralized indexing tools for the upcoming national hackathon.',
        skillsNeeded: ['React', 'Node.js', 'WebSockets', 'GraphQL'],
        tags: ['hackathon', 'sprint'],
        maxMembers: 4,
      });
      showToast('Created Quantum Sprint hackathon team!');
    } else if (type === 'ai') {
      createProject({
        name: 'Nexus Agent',
        tagline: 'Autonomous AI workflow coordinator for DevOps & incident response',
        description: 'Multi-agent orchestration platform that correlates logs and writes automated PR fixes.',
        category: 'Startup',
        skills: ['Python', 'FastAPI', 'React', 'LangChain'],
        githubUrl: 'https://github.com/nexus-agent/core',
        demoUrl: 'https://nexusagent.ai',
      });
      showToast('Launched Nexus Agent project!');
    } else {
      createProject({
        name: 'HyperMesh',
        tagline: 'Lightweight peer-to-peer event broker for browser runtimes',
        description: 'Zero-config WebRTC distributed mesh for multiplayer states and collaborative canvases.',
        category: 'Open Source',
        skills: ['TypeScript', 'WebRTC', 'Vite'],
        githubUrl: 'https://github.com/hypermesh/webrtc',
        demoUrl: 'https://hypermesh.dev',
      });
      showToast('Launched HyperMesh open-source repo!');
    }
  }

  return (
    <div className="profile-app-root teams-page-root">
      <Grain />
      <ParticleBackground />

      {/* Immersive Ambient Glow Aurora */}
      <div className="teams-aurora-glow-1" />
      <div className="teams-aurora-glow-2" />

      {/* Floating Toast Notice */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            background: 'rgba(17, 18, 22, 0.92)',
            border: '1px solid rgba(255, 152, 162, 0.4)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 152, 162, 0.2)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 1000,
            fontSize: '13.5px',
            fontWeight: 600,
            animation: 'modal-fade-in 0.25s ease',
          }}
        >
          <Check size={16} color="#ff98a2" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="app-main teams-container">
        <TeamsHeader onOpenProjectModal={() => setShowModal(true)} />

        <TeamsToolbar
          entityView={entityView}
          setEntityView={setEntityView}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          myTeamsCount={myTeams.length}
          myProjectsCount={myProjects?.length || 0}
        />

        {/* Combined Listing or Empty State */}
        {totalItemsCount === 0 ? (
          <div className="teams-empty-state">
            <div className="workspace-empty-icon">
              <Layers size={22} color="var(--coral, #ff98a2)" />
            </div>
            <h3 className="empty-title">
              {activeTab === 'created'
                ? "No squads or projects created yet"
                : activeTab === 'joined'
                ? "You haven't joined any squads yet"
                : entityView === 'teams'
                ? "No teams or squads yet"
                : entityView === 'projects'
                ? "No projects or repos yet"
                : "No squads or projects yet"}
            </h3>
            <p className="empty-desc">
              {activeTab === 'created'
                ? "Start a squad to recruit builders for hackathons, or showcase a project repository."
                : activeTab === 'joined'
                ? "Discover active squads and open-source projects looking for contributors on Explore."
                : "Start a team to assemble a hackathon squad, showcase a project you're shipping, or find teams looking for your skills."}
            </p>

            <div className="empty-actions">
              <Link to="/teams/create" className="join-btn">
                <Plus size={14} />
                <span>Start a Team</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="chip-btn"
              >
                <FolderGit2 size={14} />
                <span>Create a Project</span>
              </button>
              <Link to="/explore" className="chip-btn">
                <Compass size={14} />
                <span>Explore DevConnect</span>
              </Link>
            </div>

            <BlueprintSection onUseBlueprint={instantiateBlueprint} />
          </div>
        ) : (
          <div
            className="card-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {displayedTeams.map((team) => (
              <TeamCard
                key={`team-${team._id || team.id}`}
                team={team}
                isLead={isCreator(team)}
                copiedId={copiedId}
                confirmDeleteId={confirmDeleteId}
                confirmLeaveId={confirmLeaveId}
                onShare={handleShare}
                onDelete={handleDeleteTeam}
                onLeave={handleLeave}
                setConfirmDeleteId={setConfirmDeleteId}
                setConfirmLeaveId={setConfirmLeaveId}
              />
            ))}

            {displayedProjects.map((project) => (
              <ProjectCard
                key={`proj-${project._id || project.id}`}
                project={project}
                isLead={isProjectCreator(project)}
                copiedId={copiedId}
                confirmDeleteProjectId={confirmDeleteProjectId}
                onShare={handleShare}
                onDelete={handleDeleteProject}
                setConfirmDeleteProjectId={setConfirmDeleteProjectId}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        showModal={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateProjectSubmit}
        formName={formName}
        setFormName={setFormName}
        formTagline={formTagline}
        setFormTagline={setFormTagline}
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formSkills={formSkills}
        formSkillInput={formSkillInput}
        setFormSkillInput={setFormSkillInput}
        handleAddSkillTag={handleAddSkillTag}
        handleRemoveSkillTag={handleRemoveSkillTag}
        formGithub={formGithub}
        setFormGithub={setFormGithub}
        formDemo={formDemo}
        setFormDemo={setFormDemo}
      />
    </div>
  );
}