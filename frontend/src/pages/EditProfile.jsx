import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext.jsx';
import Grain from './profile/Grain.jsx';
import CursorFX from './profile/CursorFX.jsx';
import ParticleBackground from './profile/ParticleBackground.jsx';
import SpotCard from './profile/SpotCard.jsx';
import StepsBar from './profile/StepsBar.jsx';
import Step1Basics from './profile/Step1Basics.jsx';
import Step2Details from './profile/Step2Details.jsx';
import Step3Availability from './profile/Step3Availability.jsx';
import WizardActions from './profile/WizardActions.jsx';
import PreviewCard from './profile/PreviewCard.jsx';
import '../ProfileApp.css';

export default function EditProfile() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();

  const [currentStep, setCurrentStep] = useState(1);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved

  const {
    name, bio, college, phone, coverUrl, avatarUrl,
    skills, experience, openTo, isAvailable,
  } = profile;

  function addSkill(val) {
    if (!skills.includes(val)) updateProfile({ skills: [...skills, val] });
  }
  function removeSkill(val) {
    updateProfile({ skills: skills.filter((s) => s !== val) });
  }
  function toggleSkillSuggestion(val) {
    updateProfile({ skills: skills.includes(val) ? skills.filter((s) => s !== val) : [...skills, val] });
  }
  function toggleOpenTo(val) {
    updateProfile({ openTo: openTo.includes(val) ? openTo.filter((o) => o !== val) : [...openTo, val] });
  }

  function goStep(step) {
    setCurrentStep(step);
  }
  function handleBack() {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else navigate('/profile');
  }
  function handleNext() {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }
    setSaveState('saving');
    // Real integration: PATCH /api/profile with the collected form state,
    // then navigate on success (and show an error state on failure).
    setTimeout(() => {
      setSaveState('saved');
      setTimeout(() => navigate('/profile'), 600);
    }, 700);
  }

  return (
    <div className="profile-app-root">
      <Grain />
      <CursorFX />
      <ParticleBackground />

      <div className="app-main">
        <div className="wizard-grid">
          <SpotCard starBorder>
            <div style={{ position: 'relative', zIndex: 1, padding: '30px' }}>
              <h1 className="detail-title"><span className="shiny">Edit profile</span></h1>
              <p className="card-sub">Keep this current — it's what teams and projects see.</p>

              <StepsBar currentStep={currentStep} onGoStep={goStep} />

              {currentStep === 1 && (
                <Step1Basics
                  name={name}
                  onNameChange={(v) => updateProfile({ name: v })}
                  bio={bio}
                  onBioChange={(v) => updateProfile({ bio: v })}
                  coverUrl={coverUrl}
                  avatarUrl={avatarUrl}
                  onCoverChange={(v) => updateProfile({ coverUrl: v })}
                  onAvatarChange={(v) => updateProfile({ avatarUrl: v })}
                />
              )}
              {currentStep === 2 && (
                <Step2Details
                  college={college}
                  onCollegeChange={(v) => updateProfile({ college: v })}
                  phone={phone}
                  onPhoneChange={(v) => updateProfile({ phone: v })}
                  skills={skills}
                  onAddSkill={addSkill}
                  onRemoveSkill={removeSkill}
                  onToggleSkill={toggleSkillSuggestion}
                  experience={experience}
                  onSetExperience={(v) => updateProfile({ experience: v })}
                />
              )}
              {currentStep === 3 && (
                <Step3Availability
                  openTo={openTo}
                  onToggleOpenTo={toggleOpenTo}
                  isAvailable={isAvailable}
                  onToggleAvailability={() => updateProfile({ isAvailable: !isAvailable })}
                />
              )}

              <WizardActions
                currentStep={currentStep}
                saveState={saveState}
                onBack={handleBack}
                onNext={handleNext}
              />
            </div>
          </SpotCard>

          <PreviewCard
            name={name}
            bio={bio}
            college={college}
            coverUrl={coverUrl}
            avatarUrl={avatarUrl}
            isAvailable={isAvailable}
            skills={skills}
            openTo={openTo}
          />
        </div>
      </div>
    </div>
  );
}