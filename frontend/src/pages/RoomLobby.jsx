import { useState } from 'react';
import './coding-rooms.css';

export default function RoomLobby({ onCreate, onJoin }) {
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const join = (event) => {
    event.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) return setError('Enter the 6-character room code.');
    onJoin('Shared coding room', cleanCode);
  };

  return (
    <div className="lobby-app">
      <div className="ambient" />
      <main className="lobby-shell">
        <div className="lobby-copy">
          <div className="eyebrow">Your coding space</div>
          <h1>
            Ready when<br />
            your team <em>is.</em>
          </h1>
          <p>
            You’re not in a coding room right now. Start a new session, or enter a code from your
            team to join theirs.
          </p>
        </div>
        <section className="lobby-card">
          <div className="lobby-mark">⌘</div>
          <h2>Start collaborating</h2>
          <p>Keep the next session simple.</p>
          <button className="primary-action" onClick={onCreate}>
            Create a coding room <span>→</span>
          </button>
          <button
            className="secondary-action"
            onClick={() => {
              setJoining(true);
              setError('');
            }}
          >
            Join with a room code
          </button>
          <small>Room codes are shared by the person who created the room.</small>
        </section>
      </main>
      {joining && (
        <div className="join-overlay">
          <form className="join-card" onSubmit={join}>
            <button className="close" type="button" onClick={() => setJoining(false)} aria-label="Close">
              ×
            </button>
            <div className="eyebrow">Join a room</div>
            <h2>Enter your room code</h2>
            <p>Ask the host for the six-character code.</p>
            <input
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6));
                setError('');
              }}
              placeholder="ABC123"
              aria-label="Room code"
            />
            <span className="join-error">{error}</span>
            <button className="primary-action" type="submit">
              Join room <span>→</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}