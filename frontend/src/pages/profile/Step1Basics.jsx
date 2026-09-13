import PhotoPickers from './PhotoPickers.jsx';

export default function Step1Basics({ name, onNameChange, bio, onBioChange, coverUrl, avatarUrl, onCoverChange, onAvatarChange }) {
  return (
    <div className="step-panel" key="step-1">
      <PhotoPickers
        name={name}
        coverUrl={coverUrl}
        avatarUrl={avatarUrl}
        onCoverChange={onCoverChange}
        onAvatarChange={onAvatarChange}
      />

      <div className="field">
        <label>Name</label>
        <input
          type="text"
          value={name}
          maxLength={50}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Bio</label>
        <textarea
          maxLength={200}
          rows={3}
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
        />
        <span className={`char-count ${bio.length > 190 ? 'warn' : ''}`}>{bio.length}/200</span>
      </div>
    </div>
  );
}