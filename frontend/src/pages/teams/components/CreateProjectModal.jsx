import React from 'react';
import { Rocket, X } from 'lucide-react';

export function CreateProjectModal({
  showModal,
  onClose,
  onSubmit,
  formName,
  setFormName,
  formTagline,
  setFormTagline,
  formCategory,
  setFormCategory,
  formSkills,
  formSkillInput,
  setFormSkillInput,
  handleAddSkillTag,
  handleRemoveSkillTag,
  formGithub,
  setFormGithub,
  formDemo,
  setFormDemo,
}) {
  if (!showModal) return null;

  return (
    <div className="project-modal-backdrop" onClick={onClose}>
      <div className="project-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Rocket size={18} color="#ff98a2" />
            <h3 className="modal-title">Launch New Project</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modal-form-group">
            <label className="modal-form-label">Project Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Fable AI, Queuely, Pulse..."
              className="modal-input"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-form-label">Tagline & Description</label>
            <textarea
              rows={3}
              placeholder="Describe the problem, target audience, and engineering goals..."
              className="modal-input"
              style={{ resize: 'vertical' }}
              value={formTagline}
              onChange={(e) => setFormTagline(e.target.value)}
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-form-label">Category</label>
            <div className="modal-category-row">
              {['Startup', 'Open Source', 'Hackathon', 'Dev Tool', 'Research'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`chip-btn ${formCategory === cat ? 'active' : ''}`}
                  onClick={() => setFormCategory(cat)}
                  style={{ padding: '6px 14px', fontSize: '11.5px' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-form-group">
            <label className="modal-form-label">Tech Stack (press Enter or Add)</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="e.g. Next.js, WebSockets, Rust"
                className="modal-input"
                style={{ flex: 1 }}
                value={formSkillInput}
                onChange={(e) => setFormSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkillTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSkillTag}
                className="chip-btn"
                style={{ padding: '8px 18px', fontSize: '12px' }}
              >
                Add
              </button>
            </div>
            <div className="team-chips-wrap">
              {formSkills.map((s) => (
                <span
                  key={s}
                  className="skill-chip"
                  style={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    padding: '4px 10px',
                  }}
                  onClick={() => handleRemoveSkillTag(s)}
                  title="Click to remove"
                >
                  {s} <X size={11} color="var(--accent, #ff98a2)" />
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="modal-form-group">
              <label className="modal-form-label">GitHub URL (Optional)</label>
              <input
                type="url"
                placeholder="https://github.com/..."
                className="modal-input"
                value={formGithub}
                onChange={(e) => setFormGithub(e.target.value)}
              />
            </div>
            <div className="modal-form-group">
              <label className="modal-form-label">Live Demo URL (Optional)</label>
              <input
                type="url"
                placeholder="https://myapp.dev"
                className="modal-input"
                value={formDemo}
                onChange={(e) => setFormDemo(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions-row">
            <button
              type="button"
              className="chip-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="join-btn">
              <Rocket size={14} />
              <span>Launch Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;
