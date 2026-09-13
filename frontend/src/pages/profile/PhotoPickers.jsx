import { useRef, useState } from 'react';

export default function PhotoPickers({ name, coverUrl, avatarUrl, onCoverChange, onAvatarChange }) {
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const initial = (name || '?')[0].toUpperCase();

  function handleFile(file, kind) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (kind === 'cover') onCoverChange(url);
    else onAvatarChange(url);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, 'cover');
  }

  return (
    <div className="pickers">
      <div
        className={`cover-pick ${dragging ? 'drag' : ''}`}
        onClick={() => coverInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {coverUrl ? (
          <img src={coverUrl} alt="" />
        ) : (
          <span className="cover-hint">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="10" r="1.5" />
              <path d="M21 15l-5-5-4 4-3-3-6 6" />
            </svg>
            Click or drop a cover photo
          </span>
        )}
        <div className="cover-overlay">Click to change</div>
        <input
          type="file"
          ref={coverInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0], 'cover')}
        />
      </div>

      <div className="avatar-pick" onClick={() => avatarInputRef.current?.click()}>
        {avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="init">{initial}</span>}
        <input
          type="file"
          ref={avatarInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0], 'avatar')}
        />
      </div>
    </div>
  );
}