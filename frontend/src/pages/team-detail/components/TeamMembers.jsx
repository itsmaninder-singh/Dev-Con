import React, { useState } from 'react';
import { Sparkles, MoreVertical, ShieldAlert, UserMinus, ArrowUpRight, ArrowDownRight, Flag } from 'lucide-react';
import SpotCard from '../../profile/SpotCard.jsx';
import AIScoreRing from '../../../components/ai/AIScoreRing.jsx';
import AILoadingShimmer from '../../../components/ai/AILoadingShimmer.jsx';
import ReportUserModal from '../../../components/ReportUserModal.jsx';
import useUISound from '../../../hooks/useUISound.js';

export function TeamMembers({
  members,
  isOwner,
  assigningRoles,
  roleSuggestions,
  visibleRowsCount,
  onAssignRoles,
  onKickMember,
  onUpdateRole,
  onShowToast,
}) {
  const [activeMenuMemberId, setActiveMenuMemberId] = useState(null);
  const [reportingUser, setReportingUser] = useState(null);
  const [confirmKickUser, setConfirmKickUser] = useState(null);
  const { playClick } = useUISound();

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>Roster & Responsibilities</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>
            Current team composition and active task allocation.
          </p>
        </div>

        {/* Trigger in management section, visible ONLY to owner */}
        {isOwner && (
          <button
            type="button"
            onClick={onAssignRoles}
            disabled={assigningRoles}
            style={{
              background: 'linear-gradient(135deg, var(--coral, #ff98a2), #ff98a2dd)',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '24px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: assigningRoles ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px -3px rgba(255, 152, 162, 0.5)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Sparkles size={14} />
            {assigningRoles ? 'Analyzing skillsets...' : 'Assign roles with AI'}
          </button>
        )}
      </div>

      {/* AI Loading State */}
      {assigningRoles && (
        <AILoadingShimmer
          line1="Analyzing member profiles & team requirements..."
          line2="Synthesizing complementary role alignments & confidence scoring..."
        />
      )}

      {/* Member List with Staggered AI Suggestion Layer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {members.map((m, idx) => {
          const mUser = m.user || {};
          const mUserId = mUser._id || mUser.id || mUser;
          const mName = mUser.name || 'Developer';
          const mInitials =
            mUser.initials ||
            mName
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
          const isCreatorMember = m.role === 'Creator' || m.role?.includes('Creator');
          const isCoLead = m.role === 'Co-Lead';
          const suggestion = roleSuggestions?.find((s) => s.id === (mUser._id || idx));
          const showSuggestion = suggestion && idx < visibleRowsCount;
          const isMenuOpen = activeMenuMemberId === mUserId;

          return (
            <SpotCard key={mUserId || idx}>
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #242428, #151517)',
                      border: '1.5px solid rgba(255, 152, 162, 0.3)',
                      color: 'var(--coral, #ff98a2)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 700,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {mInitials}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--text)' }}>
                        {mName}
                      </span>
                      {isCreatorMember && (
                        <span className="role-pill role-creator" style={{ fontSize: '9.5px', padding: '2px 7px' }}>
                          Creator
                        </span>
                      )}
                      {isCoLead && (
                        <span
                          style={{
                            fontSize: '9.5px',
                            padding: '2px 7px',
                            borderRadius: '10px',
                            background: 'rgba(255, 213, 140, 0.15)',
                            color: '#ffd58c',
                            border: '1px solid rgba(255, 213, 140, 0.3)',
                            fontWeight: 600,
                          }}
                        >
                          Co-Lead
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {m.role || 'Member'} · Joined {new Date(m.joinedAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Middle: AI Role Suggestion Layer */}
                {showSuggestion && (
                  <div
                    style={{
                      flex: 1,
                      minWidth: '260px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                      background: 'rgba(255, 152, 162, 0.05)',
                      border: '1px solid rgba(255, 152, 162, 0.22)',
                      borderRadius: '12px',
                      padding: '10px 16px',
                      animation: 'aiFadeIn 0.3s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--coral, #ff98a2)',
                            background: 'rgba(255, 152, 162, 0.12)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          {suggestion.suggestedRole}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Suggested</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.35 }}>
                        {suggestion.rationale}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <AIScoreRing score={suggestion.confidence} size={42} strokeWidth={3.5} />
                    </div>
                  </div>
                )}

                {/* Right: Actions menu for group roles & reporting */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                  {!showSuggestion && (
                    <div style={{ color: 'var(--text-dim)', fontSize: '12.5px', marginRight: '4px' }}>
                      {m.role || 'Contributor'}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveMenuMemberId(isMenuOpen ? null : mUserId);
                    }}
                    style={{
                      background: isMenuOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      color: 'var(--text-dim)',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="Member actions"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        minWidth: '180px',
                        background: 'rgba(22, 22, 26, 0.97)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(16px)',
                        padding: '6px',
                        zIndex: 40,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        animation: 'fadeIn 0.15s ease',
                      }}
                    >
                      {/* Owner controls: promote/demote */}
                      {isOwner && !isCreatorMember && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              playClick();
                              setActiveMenuMemberId(null);
                              const newRole = isCoLead ? 'Member' : 'Co-Lead';
                              if (onUpdateRole) onUpdateRole(mUserId, newRole);
                              if (onShowToast) onShowToast(`${mName} is now ${newRole}`);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#fff',
                              fontSize: '12.5px',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              textAlign: 'left',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                          >
                            {isCoLead ? (
                              <>
                                <ArrowDownRight size={13} color="#ffd58c" /> Demote to Member
                              </>
                            ) : (
                              <>
                                <ArrowUpRight size={13} color="var(--coral, #ff98a2)" /> Promote to Co-Lead
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              playClick();
                              setActiveMenuMemberId(null);
                              setConfirmKickUser({ id: mUserId, name: mName });
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ff7b7b',
                              fontSize: '12.5px',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              textAlign: 'left',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 80, 80, 0.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                          >
                            <UserMinus size={13} /> Remove from Team
                          </button>
                        </>
                      )}

                      {/* General control: report */}
                      <button
                        type="button"
                        onClick={() => {
                          playClick();
                          setActiveMenuMemberId(null);
                          setReportingUser({ _id: mUserId, name: mName });
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          fontSize: '12.5px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <Flag size={13} /> Report Member
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </SpotCard>
          );
        })}
      </div>

      {/* Confirmation Modal for Kick Member */}
      {confirmKickUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#16161a',
              border: '1px solid rgba(255, 100, 100, 0.3)',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff7b7b', marginBottom: '10px' }}>
              <ShieldAlert size={20} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Remove Member</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to remove <b>{confirmKickUser.name}</b> from this team? They will lose access to team roadmap boards and discussions.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="apple-btn apple-btn-secondary"
                onClick={() => setConfirmKickUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onKickMember) onKickMember(confirmKickUser.id);
                  if (onShowToast) onShowToast(`${confirmKickUser.name} removed from team`);
                  setConfirmKickUser(null);
                }}
                style={{
                  background: '#ff5c5c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report User Modal */}
      <ReportUserModal
        isOpen={!!reportingUser}
        onClose={() => setReportingUser(null)}
        targetUser={reportingUser}
        onReportSuccess={() => {
          if (onShowToast) onShowToast(`Report submitted for ${reportingUser?.name}`);
        }}
      />
    </div>
  );
}

export default TeamMembers;
