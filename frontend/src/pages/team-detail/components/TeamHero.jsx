import React, { useState } from 'react';
import { Crown, MessageCircle, Link as LinkIcon, Check, Volume2, VolumeX } from 'lucide-react';
import SpotCard from '../../profile/SpotCard.jsx';
import { useChatUI } from '../../../context/ChatUIContext.jsx';

export function TeamHero({
  team,
  isOwner,
  skills,
  members,
  onToggleAnnouncementOnly,
  onShowToast,
}) {
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const { openGroupChat } = useChatUI();

  async function handleOpenTeamChat(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      setOpeningChat(true);
      const teamId = team._id || team.id;
      const memberUserIds = (members || [])
        .map((m) => m?.user?._id || m?.user || m?._id || m?.id)
        .filter(Boolean)
        .map((id) => id.toString());

      if (team.creator) {
        const creatorId = (team.creator._id || team.creator).toString();
        if (!memberUserIds.includes(creatorId)) {
          memberUserIds.push(creatorId);
        }
      }

      await openGroupChat({
        teamId,
        name: team.name || 'Team Chat',
        participantIds: memberUserIds,
      });
    } catch (err) {
      console.error('Error opening team chat:', err);
      if (onShowToast) {
        onShowToast('Could not open team chat');
      }
    } finally {
      setOpeningChat(false);
    }
  }

  function handleCopyInviteLink() {
    const inviteUrl = `${window.location.origin}/teams/${team._id || team.id}?join=true`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl).catch(() => {});
    }
    setCopiedInvite(true);
    if (onShowToast) {
      onShowToast('Team invite link copied to clipboard!');
    }
    setTimeout(() => setCopiedInvite(false), 2200);
  }
  return (
    <SpotCard className="team-card-enhanced" style={{ marginBottom: '24px' }}>
      <div style={{ padding: '28px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                  color: 'var(--coral, #ff98a2)',
                  background: 'rgba(255, 152, 162, 0.12)',
                  border: '1px solid rgba(255, 152, 162, 0.25)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                }}
              >
                {team.type || 'Hackathon Team'}
              </span>
              <span className={`status-pill ${team.status === 'full' ? 'full' : 'recruiting'}`}>
                {team.status === 'full' ? 'Full Squad' : 'Recruiting'}
              </span>
              {isOwner && (
                <span
                  className="role-pill role-creator"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Crown size={11} /> You are Owner
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.025em' }}>
              {team.name}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', maxWidth: '680px', lineHeight: 1.55, margin: 0 }}>
              {team.description}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Invite Link Button */}
            <button
              type="button"
              className="apple-btn apple-btn-secondary"
              onClick={handleCopyInviteLink}
              title="Copy link to invite collaborators to this squad"
            >
              {copiedInvite ? (
                <>
                  <Check size={14} color="var(--coral, #ff98a2)" /> Link Copied!
                </>
              ) : (
                <>
                  <LinkIcon size={14} /> Invite Link
                </>
              )}
            </button>

            {/* Announcement Mode Toggle (Owner Only) */}
            {isOwner && (
              <button
                type="button"
                className="apple-btn apple-btn-secondary"
                onClick={onToggleAnnouncementOnly}
                title={team.announcementOnly ? 'Channel restricted to announcements' : 'Open team discussion'}
                style={{
                  border: team.announcementOnly
                    ? '1px solid rgba(255, 152, 162, 0.4)'
                    : '1px solid var(--border)',
                  color: team.announcementOnly ? 'var(--coral, #ff98a2)' : 'var(--text-muted)',
                }}
              >
                {team.announcementOnly ? (
                  <>
                    <VolumeX size={14} /> Announcements Only
                  </>
                ) : (
                  <>
                    <Volume2 size={14} /> Open Chat Mode
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              className="apple-btn apple-btn-secondary"
              data-chat-trigger="true"
              onClick={handleOpenTeamChat}
              disabled={openingChat}
              title="Open team group chat"
            >
              <MessageCircle size={14} /> {openingChat ? 'Opening Chat...' : 'Team Chat'}
            </button>
          </div>
        </div>

        {/* Skills & Stats */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            marginTop: '22px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div>
            <span className="team-section-label">Target Stack</span>
            <div className="team-chips-wrap" style={{ marginTop: '6px' }}>
              {skills.map((s) => (
                <span className="chip-pill" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Members
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                {members.length} / {team.maxMembers || 4}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SpotCard>
  );
}

export default TeamHero;
