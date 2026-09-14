import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTeams, useCurrentCreator } from '../context/TeamsContext.jsx';
import Grain from './profile/Grain.jsx';
import ParticleBackground from './profile/ParticleBackground.jsx';
import CursorFX from './profile/CursorFX.jsx';
import SpotCard from './profile/SpotCard.jsx';
import StepsBar from './team/StepsBar.jsx';
import Step1Basics from './team/Step1Basics.jsx';
import Step2SkillsTags, { PREDEFINED_SKILLS, resolveValidSkill } from './team/Step2SkillsTags.jsx';
import Step3Settings from './team/Step3Settings.jsx';
import WizardActions from './team/WizardActions.jsx';
import TeamPreviewCard from './team/TeamPreviewCard.jsx';
import IdeaGeneratorBanner from './team/IdeaGeneratorBanner.jsx';
import '../ProfileApp.css';
import '../TeamExtras.css';

const STEP_LABELS = ['Basics', 'Skills & tags', 'Settings'];
const TOTAL_STEPS = STEP_LABELS.length;

export default function CreateTeam() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createTeam } = useTeams();
  const creator = useCurrentCreator();

  const [currentStep, setCurrentStep] = useState(1);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved
  const [nameInvalid, setNameInvalid] = useState(false);
  const [skillsInvalid, setSkillsInvalid] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [skills, setSkills] = useState([]);
  const [tags, setTags] = useState([]);
  const [maxMembers, setMaxMembers] = useState(4);
  const [visibility, setVisibility] = useState('public');

  useEffect(() => {
    if (location.state?.idea) {
      handleApplyIdea(location.state.idea);
    }
  }, [location.state]);

  function handleApplyIdea(idea) {
    setName(idea.title);
    setDesc(idea.desc);
    if (idea.stack && idea.stack.length) {
      const validSkills = idea.stack
        .map((s) => resolveValidSkill(s) || (PREDEFINED_SKILLS.includes(s) ? s : null))
        .filter(Boolean);
      if (validSkills.length > 0) {
        setSkills(validSkills);
        setSkillsInvalid(false);
      }
    }
    if (idea.tags && idea.tags.length) {
      setTags(idea.tags);
    }
    setNameInvalid(false);
    setToastMessage(`"${idea.title}" applied — edit anything before creating`);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  }

  function addSkill(val) {
    const valid = resolveValidSkill(val) || (PREDEFINED_SKILLS.includes(val) ? val : null);
    if (!valid) return;
    setSkills((prev) => (prev.includes(valid) ? prev : [...prev, valid]));
    setSkillsInvalid(false);
  }
  function removeSkill(val) { setSkills((prev) => prev.filter((s) => s !== val)); }
  function toggleSkill(val) {
    const valid = resolveValidSkill(val) || (PREDEFINED_SKILLS.includes(val) ? val : null);
    if (!valid) return;
    setSkills((prev) => (prev.includes(valid) ? prev.filter((s) => s !== valid) : [...prev, valid]));
    setSkillsInvalid(false);
  }

  function addTag(val) { setTags((prev) => (prev.includes(val) ? prev : [...prev, val])); }
  function removeTag(val) { setTags((prev) => prev.filter((t) => t !== val)); }
  function toggleTag(val) { setTags((prev) => (prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val])); }

  function goStep(step) {
    if (step > currentStep && currentStep === 1 && !name.trim()) return;
    if (step > currentStep && currentStep === 2 && skills.length === 0) {
      setSkillsInvalid(true);
      return;
    }
    setCurrentStep(step);
  }
  function handleBack() {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else navigate('/teams');
  }
  function handleNext() {
    if (currentStep === 1 && !name.trim()) {
      setNameInvalid(true);
      return;
    }
    setNameInvalid(false);
    if (currentStep === 2 && skills.length === 0) {
      setSkillsInvalid(true);
      return;
    }
    setSkillsInvalid(false);
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      return;
    }
    setSaveState('saving');
    // Real integration: POST /api/teams with the collected form state below,
    // then navigate on success.
    setTimeout(() => {
      createTeam({ name, description: desc, skillsNeeded: skills, skills, tags, maxMembers, visibility, creator });
      setSaveState('saved');
      setTimeout(() => navigate('/teams'), 500);
    }, 700);
  }

  return (
    <div className="profile-app-root">
      <Grain />
      <ParticleBackground />
      <CursorFX />

      <div className="app-main">
        <div className="wizard-grid">
          <SpotCard starBorder>
            <div style={{ position: 'relative', zIndex: 1, padding: '30px' }}>
              <h1 className="detail-title"><span className="shiny">Start a team</span></h1>
              <p className="card-sub">Three quick steps — set the shape of who you're looking for.</p>

              <StepsBar steps={STEP_LABELS} currentStep={currentStep} onGoStep={goStep} />

              {toastMessage && (
                <div
                  style={{
                    background: 'rgba(255, 152, 162, 0.12)',
                    border: '1px solid rgba(255, 152, 162, 0.35)',
                    color: 'var(--coral, #ff98a2)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'aiFadeIn 0.25s ease',
                  }}
                >
                  <span>✓</span> {toastMessage}
                </div>
              )}

              {currentStep === 1 && (
                <>
                  <IdeaGeneratorBanner onApplyIdea={handleApplyIdea} />
                  <Step1Basics
                    name={name}
                    onNameChange={(v) => { setName(v); setNameInvalid(false); }}
                    invalid={nameInvalid}
                    desc={desc}
                    onDescChange={setDesc}
                  />
                </>
              )}
              {currentStep === 2 && (
                <Step2SkillsTags
                  skills={skills}
                  skillsInvalid={skillsInvalid}
                  onAddSkill={addSkill}
                  onRemoveSkill={removeSkill}
                  onToggleSkill={toggleSkill}
                  tags={tags}
                  onAddTag={addTag}
                  onRemoveTag={removeTag}
                  onToggleTag={toggleTag}
                />
              )}
              {currentStep === 3 && (
                <Step3Settings
                  maxMembers={maxMembers}
                  onMaxMembersChange={setMaxMembers}
                  visibility={visibility}
                  onVisibilityChange={setVisibility}
                />
              )}

              <WizardActions
                currentStep={currentStep}
                totalSteps={TOTAL_STEPS}
                saveState={saveState}
                finalLabel="team"
                onBack={handleBack}
                onNext={handleNext}
              />
            </div>
          </SpotCard>

          <TeamPreviewCard
            name={name}
            desc={desc}
            maxMembers={maxMembers}
            visibility={visibility}
            skills={skills}
            tags={tags}
          />
        </div>
      </div>
    </div>
  );
}