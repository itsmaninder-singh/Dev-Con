import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Crown, UserCheck, Share2, Trash2, LogOut, Check } from 'lucide-react';

export function TeamCard({
  team,
  isLead,
  copiedId,
  confirmDeleteId,
  confirmLeaveId,
  onShare,
  onDelete,
  onLeave,
  setConfirmDeleteId,
  setConfirmLeaveId,
}) {
  const tid = team._id || team.id;
  const members = team.members || [];
  const membersCount = members.length;
  const maxMembers = team.maxMembers || 4;
  const skills = team.skillsNeeded || team.skills || [];
  const leadName = members[0]?.user?.name || 'You';
  const leadInitials = members[0]?.user?.initials || (team.name ? team.name.slice(0, 2).toUpperCase() : 'TM');

  return (
    <div className="card in-view">
      <div className="card-top">
        <span className="type-badge">
          <Users size={11} style={{ marginRight: '4px' }} /> TEAM
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isLead ? (
            <span
              className="type-badge"
              style={{
                color: '#f59e0b',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                background: 'rgba(245, 158, 11, 0.1)',
              }}
            >
              <Crown size={10} style={{ marginRight: '3px' }} /> Lead
            </span>
          ) : (
            <span
              className="type-badge"
              style={{
                color: '#60a5fa',
                borderColor: 'rgba(96, 165, 250, 0.3)',
                background: 'rgba(96, 165, 250, 0.1)',
              }}
            >
              <UserCheck size={10} style={{ marginRight: '3px' }} /> Member
            </span>
          )}
          <button
            type="button"
            className="bookmark-btn"
            onClick={() => onShare(team, 'team')}
            title="Share team"
          >
            {copiedId === tid ? <Check size={13} color="#34d399" /> : <Share2 size={13} />}
          </button>

          {isLead ? (
            confirmDeleteId === tid ? (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className="join-btn"
                  style={{ padding: '3px 10px', fontSize: '10.5px', background: '#ff453a' }}
                  onClick={() => onDelete(tid)}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  style={{ padding: '3px 8px', fontSize: '10.5px' }}
                  onClick={() => setConfirmDeleteId(null)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="bookmark-btn"
                onClick={() => setConfirmDeleteId(tid)}
                title="Delete team"
              >
                <Trash2 size={13} />
              </button>
            )
          ) : confirmLeaveId === tid ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                className="join-btn"
                style={{ padding: '3px 10px', fontSize: '10.5px', background: '#ff453a' }}
                onClick={() => onLeave(tid)}
              >
                Leave
              </button>
              <button
                type="button"
                className="chip-btn"
                style={{ padding: '3px 8px', fontSize: '10.5px' }}
                onClick={() => setConfirmLeaveId(null)}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="bookmark-btn"
              onClick={() => setConfirmLeaveId(tid)}
              title="Leave team"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
      </div>

      <h3>
        <Link
          to={`/teams/${tid}`}
          style={{ color: 'inherit', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ff98a2')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
        >
          {team.name}
        </Link>
      </h3>

      <p className="desc">{team.description}</p>

      <div className="chip-row">
        {skills.length ? (
          skills.map((s) => (
            <span className="skill-chip" key={s}>
              {s}
            </span>
          ))
        ) : (
          <span className="skill-chip" style={{ opacity: 0.6 }}>
            General / Open
          </span>
        )}
      </div>

      <div className="card-owner">
        <div className="avatar-sm">{leadInitials}</div>
        <div className="owner-name">
          Lead: <b>{leadName}</b>
        </div>
      </div>

      <div className="card-footer">
        <div className="seats-row">
          <div className="seat-dots">
            {Array.from({ length: maxMembers }).map((_, i) => (
              <span
                key={i}
                className={`seat-dot ${i < membersCount ? 'filled' : ''}`}
              />
            ))}
          </div>
          <span className="seats-label">
            {membersCount}/{maxMembers}
          </span>
        </div>

        <Link to={`/teams/${tid}`} className="join-btn">
          Open Team
        </Link>
      </div>
    </div>
  );
}

export default TeamCard;
