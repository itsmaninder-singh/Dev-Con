import SpotCard from './SpotCard.jsx';

export default function PreviewCard({ name, bio, college, coverUrl, avatarUrl, isAvailable, skills, openTo }) {
  const initial = (name || '?')[0].toUpperCase();
  const availColor = isAvailable ? 'var(--coral)' : 'var(--text-dim)';

  return (
    <div className="preview-card-wrap">
      <span className="preview-kicker">Live preview</span>
      <SpotCard style={{ borderRadius: '20px' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="pv-cover">
            {coverUrl && <img src={coverUrl} alt="" />}
          </div>
          <div className="pv-body">
            <div className="pv-avatar-wrap">
              <div className="pv-avatar">
                {avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="init">{initial}</span>}
              </div>
            </div>
            <h2 className="pv-name" style={{ opacity: name ? 1 : 0.4 }}>{name || 'Your name'}</h2>
            <p className="pv-college">{college}</p>
            <p className="pv-bio" style={{ opacity: bio ? 1 : 0.5 }}>
              {bio || 'Your bio will show up here as you type.'}
            </p>
            <span className="pill" style={{ color: availColor, borderColor: availColor }}>
              <span>{isAvailable ? 'Available' : 'Not available'}</span>
            </span>

            <span className="section-label">Skills</span>
            <div className="chip-row">
              {skills.length
                ? skills.map(s => <span className="chip" key={s}>{s}</span>)
                : <span className="chip placeholder">none yet</span>}
            </div>

            <span className="section-label">Open to</span>
            <div className="chip-row">
              {openTo.length
                ? openTo.map(o => <span className="chip coral" key={o}>{o}</span>)
                : <span className="chip placeholder">none yet</span>}
            </div>
          </div>
        </div>
      </SpotCard>
    </div>
  );
}