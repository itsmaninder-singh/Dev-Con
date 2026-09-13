import SpotCard from '../profile/SpotCard.jsx';

export default function TeamPreviewCard({ name, desc, maxMembers, visibility, skills, tags }) {
  return (
    <div className="preview-card-wrap">
      <span className="preview-kicker">Live preview</span>
      <SpotCard style={{ borderRadius: '20px' }}>
        <div style={{ position: 'relative', zIndex: 1, padding: '24px' }}>
          <span className="status-pill recruiting">recruiting</span>
          <h2 className="preview-name" style={{ opacity: name ? 1 : 0.4 }}>{name || 'Your team name'}</h2>
          <p className="preview-desc" style={{ opacity: desc ? 1 : 0.5 }}>
            {desc || 'Your description will show up here as you type.'}
          </p>
          <div className="meta-row">
            <span className="meta-tag">1/{maxMembers} members</span>
            <span className="meta-tag">{visibility}</span>
          </div>
          <span className="section-label">Skills needed</span>
          <div className="chip-row">
            {skills.length
              ? skills.map((s) => <span className="chip" key={s}>{s}</span>)
              : <span className="chip placeholder">none yet</span>}
          </div>
          <span className="section-label">Tags</span>
          <div className="chip-row">
            {tags.length
              ? tags.map((t) => <span className="chip coral" key={t}>{t}</span>)
              : <span className="chip placeholder">none yet</span>}
          </div>
        </div>
      </SpotCard>
    </div>
  );
}
