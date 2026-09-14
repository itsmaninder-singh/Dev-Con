import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { Sparkles, ArrowRight, X } from 'lucide-react';

export default function ProfileCompletionBanner() {
  const { user } = useAuth() || {};
  const { profile } = useProfile() || {};
  const navigate = useNavigate();
  const location = useLocation();

  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('dc_profile_banner_dismissed') === 'true';
  });

  if (!user || dismissed) return null;
  // Don't show while currently on the edit profile page
  if (location.pathname === '/profile/edit') return null;

  const currentProfile = profile || user;

  // Check required profile fields:
  // 1. avatar (avatarUrl or profilePicture)
  // 2. bio
  // 3. skills (array with at least 1 skill)
  // 4. college
  // 5. availability (availableFor length > 0 or openTo length > 0 or isAvailable defined)
  const hasAvatar = Boolean(currentProfile.avatarUrl || currentProfile.profilePicture);
  const hasBio = Boolean(currentProfile.bio && currentProfile.bio.trim().length > 10);
  const hasSkills = Boolean(currentProfile.skills && currentProfile.skills.length > 0);
  const hasCollege = Boolean(currentProfile.college && currentProfile.college.trim().length > 0);
  const hasAvailability = Boolean(
    (currentProfile.availableFor && currentProfile.availableFor.length > 0) ||
    (currentProfile.openTo && currentProfile.openTo.length > 0) ||
    currentProfile.isAvailable !== undefined
  );

  const isComplete = hasAvatar && hasBio && hasSkills && hasCollege && hasAvailability;

  // Once profile is complete, do not render
  if (isComplete) return null;

  const missingFields = [];
  if (!hasAvatar) missingFields.push('photo');
  if (!hasBio) missingFields.push('bio');
  if (!hasSkills) missingFields.push('skills');
  if (!hasCollege) missingFields.push('college');
  if (!hasAvailability) missingFields.push('availability');

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('dc_profile_banner_dismissed', 'true');
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 999,
        maxWidth: '420px',
        background: 'rgba(18, 18, 22, 0.95)',
        border: '1px solid rgba(255, 152, 162, 0.35)',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 152, 162, 0.12)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        animation: 'slideUp 0.3s ease-out',
        color: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(255, 152, 162, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ff98a2',
            }}
          >
            <Sparkles size={16} />
          </div>
          <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#f2f1ed' }}>
            Complete your profile
          </span>
        </div>
        <button
          onClick={handleDismiss}
          type="button"
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.4)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)')}
          title="Dismiss"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>

      <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.45 }}>
        Stand out to teams and hackathon squads by adding your{' '}
        <span style={{ color: '#ff98a2', fontWeight: 500 }}>
          {missingFields.slice(0, 3).join(', ')}
          {missingFields.length > 3 ? ' and more' : ''}
        </span>
        .
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button
          type="button"
          onClick={() => navigate('/profile/edit')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #ff98a2 0%, #f472b6 100%)',
            color: '#120d10',
            border: 'none',
            borderRadius: '10px',
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255, 152, 162, 0.3)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
        >
          Edit Profile <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
