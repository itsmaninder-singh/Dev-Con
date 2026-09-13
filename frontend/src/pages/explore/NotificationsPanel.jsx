import { useState } from 'react';

export default function NotificationsPanel({
  open,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onResolve,
  panelRef
}) {
  const [previewId, setPreviewId] = useState(null);
  const [previewPos, setPreviewPos] = useState({ left: 0, top: 0 });
  const [leavingIds, setLeavingIds] = useState(new Set());

  const unreadCount = notifications.filter(n => n.unread).length;

  function handleMouseEnter(e, n) {
    if (n.type !== 'join_request' || !n.message) return;
    const item = e.currentTarget;
    const panelRect = panelRef.current?.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    if (!panelRect) return;
    setPreviewPos({
      left: panelRect.left - 266,
      top: Math.min(itemRect.top, window.innerHeight - 140)
    });
    setPreviewId(n.id);
  }
  function handleMouseLeave() {
    setPreviewId(null);
  }

  function handleResolve(n, action) {
    setPreviewId(null);
    setLeavingIds(prev => new Set(prev).add(n.id));
    setTimeout(() => {
      onResolve(n, action);
      setLeavingIds(prev => {
        const next = new Set(prev);
        next.delete(n.id);
        return next;
      });
    }, 280);
  }

  const previewNotif = notifications.find(n => n.id === previewId);

  return (
    <>
      <div id="notifPanel" className={open ? 'visible' : ''} ref={panelRef}>
        <div className="notif-header">
          <div>
            <h4>Notifications</h4>
            <div className="notif-sub">{unreadCount > 0 ? `${unreadCount} new` : "You're all caught up"}</div>
          </div>
          <button onClick={onMarkAllRead}>Mark all as read</button>
        </div>
        <div className="notif-list">
          {notifications.length === 0 && <div className="notif-empty">You're all caught up.</div>}
          {notifications.map(n => (
            <div
              key={n.id}
              className={[
                'notif-item',
                n.unread ? 'unread' : '',
                previewId === n.id ? 'previewing' : '',
                leavingIds.has(n.id) ? 'leaving' : ''
              ].join(' ').trim()}
              onClick={() => n.unread && onMarkRead(n.id)}
              onMouseEnter={(e) => handleMouseEnter(e, n)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="notif-avatar">{n.sender.initials}</div>
              <div className="notif-body">
                <div className="notif-text">
                  <b>{n.sender.name}</b> {n.text}{n.target ? <> <b>{n.target}</b></> : null}
                </div>
                <div className="notif-time">{n.time} ago</div>
                {n.type === 'join_request' && (
                  <div className="notif-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Requirement #4b: precomputed fit badge next to Accept/Decline */}
                    {n.fitScore != null && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          letterSpacing: '-0.01em',
                          color: n.fitScore >= 75 ? '#34d399' : n.fitScore >= 50 ? '#fbbf24' : '#f87171',
                          background: n.fitScore >= 75 ? 'rgba(52, 211, 153, 0.12)' : n.fitScore >= 50 ? 'rgba(251, 191, 36, 0.12)' : 'rgba(248, 113, 113, 0.12)',
                          border: `1px solid ${n.fitScore >= 75 ? 'rgba(52, 211, 153, 0.25)' : n.fitScore >= 50 ? 'rgba(251, 191, 36, 0.25)' : 'rgba(248, 113, 113, 0.25)'}`,
                        }}
                      >
                        {n.fitScore}% fit
                      </span>
                    )}
                    <button
                      className="notif-btn accept"
                      onClick={(e) => { e.stopPropagation(); handleResolve(n, 'accept'); }}
                    >
                      Accept
                    </button>
                    <button
                      className="notif-btn ignore"
                      onClick={(e) => { e.stopPropagation(); handleResolve(n, 'ignore'); }}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        id="notifPreview"
        className={previewNotif ? 'visible' : ''}
        style={{ left: previewPos.left, top: previewPos.top }}
      >
        <div className="preview-label">Their message</div>
        <div className="preview-text">{previewNotif?.message || ''}</div>
      </div>
    </>
  );
}