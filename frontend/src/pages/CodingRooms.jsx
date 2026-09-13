import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { connectSocket, getSocket } from '../lib/socket';
import './coding-rooms.css';
import RoomLobby from './RoomLobby';

const INITIAL_CODE_SNIPPETS = {
  'index.js': `// Real-time Collaborative Session
// Type code here — collaborators in this room will see your edits live!

function greetCollaborators(teamName, memberCount) {
  console.log("🚀 Live room connected with " + memberCount + " members!");
  console.log("Working on: " + teamName);
  return { status: "ready", team: teamName, active: true };
}

greetCollaborators("Nightwatch Devs", 3);
`,
  'matchmaker.ts': `// Candidate matching algorithm
function scoreFit(skills, required) {
  const matched = required.filter(s => skills.includes(s));
  const score = Math.min(97, 35 + matched.length * 20);
  console.log("Matched skills:", matched);
  console.log("Calculated Fit Score: " + score + "%");
  return { score, matched };
}

scoreFit(["React", "Node.js", "Socket.io"], ["React", "Socket.io", "Redis"]);
`,
};

export default function CodingRooms() {
  const [screen, setScreen] = useState('lobby');
  const [room, setRoom] = useState({ name: 'Nightwatch build session', code: 'NW8K4P' });

  const enterRoom = (name, code) => {
    setRoom({ name, code: (code || 'NW8K4P').toUpperCase() });
    setScreen('live');
  };

  if (screen === 'lobby') return <RoomLobby onCreate={() => setScreen('create')} onJoin={enterRoom} />;
  if (screen === 'create') return <CreateRoom onBack={() => setScreen('lobby')} onCreate={enterRoom} />;
  return <LiveRoom room={room} onLeave={() => setScreen('lobby')} onCreate={() => setScreen('create')} />;
}

function LiveRoom({ room, onCreate, onLeave }) {
  const navigate = useNavigate();
  const { profile } = useProfile() || {};
  const { user } = useAuth() || {};

  const displayName = profile?.name || user?.name || 'Developer';
  const initials = (displayName || 'DV')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DV';

  // Real-time connected members in this room
  const myColor = '#ff98a2';
  const [connectedUsers, setConnectedUsers] = useState([
    { id: 'me', name: `${displayName} (you)`, initials, color: myColor, state: 'editing this file' },
  ]);

  // Code state per file
  const [files, setFiles] = useState(INITIAL_CODE_SNIPPETS);
  const [tab, setTab] = useState('index.js');
  const [changeCount, setChangeCount] = useState(0);
  const [activeLine, setActiveLine] = useState(1);
  const [remoteTyping, setRemoteTyping] = useState('');
  const [toast, setToast] = useState('');
  const [session, setSession] = useState(0);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('Live Room');

  // Terminal state — Starts completely clean & empty as requested!
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [terminalTab, setTerminalTab] = useState('terminal');
  const [terminalCmd, setTerminalCmd] = useState('');

  // Room chat state
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const terminalBodyRef = useRef(null);
  const typingTimerRef = useRef(null);

  const currentCode = files[tab] || '';
  const lines = useMemo(() => currentCode.split('\n'), [currentCode]);

  // Session clock timer
  useEffect(() => {
    const id = setInterval(() => setSession((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Toast clear timer
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  // Synchronize scroll between line numbers gutter and textarea
  const handleScroll = (e) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // Connect to backend Socket.IO for real-time room collaboration
  useEffect(() => {
    const socket = connectSocket({
      name: displayName,
      token: localStorage.getItem('dc_access_token') || '',
    });

    const memberData = {
      name: displayName,
      initials,
      color: myColor,
    };

    socket.emit('room:join', { roomCode: room.code, user: memberData }, (res) => {
      if (res?.ok) {
        if (res.members && res.members.length > 0) {
          const formatted = res.members.map((m) => ({
            id: m.id,
            name: m.id === socket.id ? `${displayName} (you)` : m.name,
            initials: m.initials || 'DV',
            color: m.color || '#8fd6ff',
            state: 'editing this file',
          }));
          setConnectedUsers(formatted);
        }
        if (res.currentCode) {
          setFiles((prev) => ({ ...prev, ...res.currentCode }));
        }
      }
    });

    socket.on('room:user-joined', (newMember) => {
      setConnectedUsers((prev) => {
        if (prev.some((m) => m.id === newMember.id)) return prev;
        return [
          ...prev,
          {
            id: newMember.id,
            name: newMember.name,
            initials: newMember.initials || 'DV',
            color: newMember.color || '#8fd6ff',
            state: 'connected',
          },
        ];
      });
      setToast(`${newMember.name} joined the room`);
    });

    socket.on('room:user-left', (leftMember) => {
      setConnectedUsers((prev) => prev.filter((m) => m.id !== leftMember.id));
      if (leftMember.name) setToast(`${leftMember.name} left the room`);
    });

    socket.on('room:code-update', ({ file, code: incomingCode, fromUser, cursorLine }) => {
      setFiles((prev) => ({ ...prev, [file]: incomingCode }));
      setChangeCount((c) => c + 1);
      setRemoteTyping(`${fromUser} is editing line ${cursorLine || 1}…`);

      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setRemoteTyping(''), 2200);
    });

    socket.on('room:chat-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit('room:leave', room.code);
      socket.off('room:user-joined');
      socket.off('room:user-left');
      socket.off('room:code-update');
      socket.off('room:chat-message');
      clearTimeout(typingTimerRef.current);
    };
  }, [room.code, displayName, initials]);

  // Code editing with real-time socket emit
  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setFiles((prev) => ({ ...prev, [tab]: newCode }));
    setChangeCount((c) => c + 1);

    const selStart = e.target.selectionStart;
    const curLine = newCode.slice(0, selStart).split('\n').length;
    setActiveLine(curLine);

    const socket = getSocket();
    socket?.emit('room:code-change', {
      roomCode: room.code,
      file: tab,
      code: newCode,
      cursorLine: curLine,
    });
  };

  // Tab key & shortcut handling (Tab = 2 spaces, Ctrl+Enter = Run)
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = e.target;
      const updated = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
      setFiles((prev) => ({ ...prev, [tab]: updated }));
      setChangeCount((c) => c + 1);

      const socket = getSocket();
      socket?.emit('room:code-change', {
        roomCode: room.code,
        file: tab,
        code: updated,
        cursorLine: activeLine,
      });

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart + 2;
        }
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
    }
  };

  // Real code runner with live console output in the terminal
  const handleRunCode = () => {
    setRunning(true);
    const startTime = performance.now();
    const newLogs = [];

    const formatArg = (arg) => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    };

    newLogs.push({
      id: Math.random().toString(36).slice(2),
      text: `$ node ${tab}`,
      type: 'command',
    });

    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    console.log = (...args) => newLogs.push({ id: Math.random().toString(36).slice(2), text: args.map(formatArg).join(' '), type: 'stdout' });
    console.warn = (...args) => newLogs.push({ id: Math.random().toString(36).slice(2), text: `[WARN] ` + args.map(formatArg).join(' '), type: 'stdout' });
    console.error = (...args) => newLogs.push({ id: Math.random().toString(36).slice(2), text: `[ERROR] ` + args.map(formatArg).join(' '), type: 'stderr' });

    try {
      // Strip simple TypeScript type annotations so execution succeeds
      const cleanCode = currentCode
        .replace(/:\s*[A-Z][a-zA-Z0-9<>\[\]]*(?=[,\)\s=;])/g, '')
        .replace(/\b(interface|type)\s+[A-Za-z0-9_]+\s*\{[^}]*\};?/g, '');

      const runner = new Function(cleanCode);
      const ret = runner();

      if (ret !== undefined) {
        newLogs.push({
          id: Math.random().toString(36).slice(2),
          text: `=> ${formatArg(ret)}`,
          type: 'return',
        });
      }

      const elapsed = Math.round(performance.now() - startTime);
      newLogs.push({
        id: Math.random().toString(36).slice(2),
        text: `✔ Process exited with code 0 (${elapsed}ms)`,
        type: 'success',
      });
      setToast(`Build passed in ${elapsed}ms`);
    } catch (err) {
      newLogs.push({
        id: Math.random().toString(36).slice(2),
        text: `✖ ${err.name}: ${err.message}`,
        type: 'stderr',
      });
      setToast(`Error: ${err.message}`);
    } finally {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
      setRunning(false);
    }

    setTerminalLogs((prev) => [...prev, ...newLogs]);

    setTimeout(() => {
      if (terminalBodyRef.current) {
        terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
      }
    }, 50);
  };

  // Terminal interactive CLI input
  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const cmd = terminalCmd.trim();
    if (!cmd) return;

    if (cmd === 'clear' || cmd === 'cls') {
      setTerminalLogs([]);
      setTerminalCmd('');
      return;
    }

    if (cmd === 'run' || cmd === `node ${tab}` || cmd === 'node') {
      setTerminalCmd('');
      handleRunCode();
      return;
    }

    if (cmd === 'ls') {
      setTerminalLogs((prev) => [
        ...prev,
        { id: Math.random().toString(36).slice(2), text: `$ ls`, type: 'command' },
        { id: Math.random().toString(36).slice(2), text: Object.keys(files).join('  '), type: 'stdout' },
      ]);
      setTerminalCmd('');
      return;
    }

    if (cmd === 'help') {
      setTerminalLogs((prev) => [
        ...prev,
        { id: Math.random().toString(36).slice(2), text: `$ help`, type: 'command' },
        { id: Math.random().toString(36).slice(2), text: 'Available commands: run, clear, ls, help, or any JS expression (e.g. 2 + 2)', type: 'stdout' },
      ]);
      setTerminalCmd('');
      return;
    }

    // Evaluate arbitrary expression
    try {
      const res = new Function(`return (${cmd})`)();
      setTerminalLogs((prev) => [
        ...prev,
        { id: Math.random().toString(36).slice(2), text: `$ ${cmd}`, type: 'command' },
        { id: Math.random().toString(36).slice(2), text: String(res), type: 'return' },
      ]);
    } catch (err) {
      setTerminalLogs((prev) => [
        ...prev,
        { id: Math.random().toString(36).slice(2), text: `$ ${cmd}`, type: 'command' },
        { id: Math.random().toString(36).slice(2), text: err.message, type: 'stderr' },
      ]);
    }
    setTerminalCmd('');
  };

  // Real-time room chat
  const sendRoomMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const socket = getSocket();
    socket?.emit('room:chat', {
      roomCode: room.code,
      message: message.trim(),
    });
    setMessage('');
  };

  const clock = new Date(session * 1000).toISOString().slice(11, 19);

  return (
    <div className="room-app">
      <div className="ambient" />
      <div className="room-subnav">
        <div className="crumb">
          <button className="back" onClick={onLeave}>← Rooms</button> / {room.name} / <b>Live Room</b>
        </div>
        <div className="nav-actions">
          <button className="outline-btn" onClick={onCreate}>
            + Create room
          </button>
          <button className="leave-btn" onClick={onLeave}>
            Leave room
          </button>
        </div>
      </div>

      <div className="tabs">
        {['Overview', 'Board', 'Live Room'].map((t) => (
          <button
            key={t}
            className={activeTab === t ? 'active' : ''}
            onClick={() => {
              setActiveTab(t);
              if (t !== 'Live Room') setToast(`Switched to ${t} view`);
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <main className="room-shell">
        <header className="room-hero">
          <div>
            <div className="eyebrow">Live collaboration</div>
            <h1>
              {room.name.split(' ')[0]} <em>builds</em>
              <br />
              in the open.
            </h1>
          </div>
          <div className="metrics">
            <Metric value={clock} label="Session time" />
            <Metric value={`${connectedUsers.length} / 4`} label="Connected" />
            <Metric value={`+${changeCount}`} label="Changes" />
          </div>
        </header>

        <section className="editor">
          <div className="editor-head">
            <div className="file-tabs">
              {Object.keys(files).map((f) => (
                <button
                  onClick={() => {
                    setTab(f);
                    setToast(`${f} opened`);
                  }}
                  className={tab === f ? 'active' : ''}
                  key={f}
                >
                  {f}
                </button>
              ))}
            </div>
            <span className="session-label">COLLABORATIVE SESSION</span>
            <div className="stack">
              {connectedUsers.map((p) => (
                <Avatar key={p.id} person={p} small />
              ))}
            </div>
            <button className="run" onClick={handleRunCode} disabled={running}>
              {running ? '⏳ Running…' : '▶ Run'}
            </button>
          </div>

          {/* REAL-TIME INTERACTIVE COLLABORATIVE CODE EDITOR */}
          <div className="editor-code-container">
            <div className="editor-gutter" ref={gutterRef}>
              {lines.map((_, i) => (
                <div key={i} className={`gutter-num ${activeLine === i + 1 ? 'active' : ''}`}>
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="editor-textarea-wrap">
              <textarea
                ref={textareaRef}
                className="real-code-textarea"
                value={currentCode}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                onClick={(e) => {
                  const line = currentCode.slice(0, e.target.selectionStart).split('\n').length;
                  setActiveLine(line);
                }}
                onKeyUp={(e) => {
                  const line = currentCode.slice(0, e.target.selectionStart).split('\n').length;
                  setActiveLine(line);
                }}
                placeholder="// Start coding here... Your changes will sync live!"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
          </div>

          {/* REAL-TIME REMOTE TYPING INDICATOR */}
          <div className="typing-bar">
            {remoteTyping ? (
              <div className="typing-indicator">
                <span className="pulse-dot" />
                <span>{remoteTyping}</span>
              </div>
            ) : (
              <span>Editing: <b>{tab}</b> · Line {activeLine}, Col 1</span>
            )}
            <span style={{ fontSize: '11px', opacity: 0.6 }}>Press Ctrl+Enter to Run</span>
          </div>

          {/* INTEGRATED TERMINAL (STARTS EMPTY BY DEFAULT) */}
          <div className="room-terminal">
            <div className="terminal-header">
              <div className="terminal-tabs">
                <button
                  className={`terminal-tab-btn ${terminalTab === 'terminal' ? 'active' : ''}`}
                  onClick={() => setTerminalTab('terminal')}
                >
                  Terminal
                </button>
                <button
                  className={`terminal-tab-btn ${terminalTab === 'output' ? 'active' : ''}`}
                  onClick={() => setTerminalTab('output')}
                >
                  Output
                </button>
              </div>
              <div className="terminal-controls">
                <button className="terminal-btn" onClick={() => setTerminalLogs([])}>
                  ⊘ Clear
                </button>
                <button className="terminal-btn" onClick={handleRunCode}>
                  ▶ Run
                </button>
              </div>
            </div>

            <div className="terminal-body" ref={terminalBodyRef}>
              {terminalLogs.length === 0 ? (
                <div className="terminal-empty">
                  <span>Terminal ready. Click <b>▶ Run</b> or press <b>Ctrl+Enter</b> to see output.</span>
                </div>
              ) : (
                terminalLogs.map((log) => (
                  <div key={log.id} className={`terminal-line ${log.type}`}>
                    {log.text}
                  </div>
                ))
              )}
            </div>

            <form className="terminal-prompt-row" onSubmit={handleTerminalSubmit}>
              <span className="terminal-prompt-sym">$</span>
              <input
                className="terminal-input"
                value={terminalCmd}
                onChange={(e) => setTerminalCmd(e.target.value)}
                placeholder="Type command (run, clear, ls, help)..."
              />
            </form>
          </div>
        </section>

        <aside>
          <section className="panel">
            <h2>In this room · {connectedUsers.length}</h2>
            {connectedUsers.map((p) => (
              <div className="person" key={p.id}>
                <Avatar person={p} />
                <div>
                  <b>{p.name}</b>
                  <small>{p.state}</small>
                </div>
              </div>
            ))}
            <button
              className="invite"
              onClick={() => {
                navigator.clipboard?.writeText(room.code);
                setToast(`Join code ${room.code} copied`);
              }}
            >
              Copy join code · {room.code}
            </button>
          </section>

          <section className="panel chat">
            <h2>Room chat</h2>
            <div className="messages">
              {messages.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '11px', textAlign: 'center', padding: '16px 0' }}>
                  No messages yet. Say hi to your team! 👋
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`message ${m.who === getSocket()?.id ? 'mine' : ''}`}>
                    <Avatar person={{ initials: m.initials, color: m.color }} small />
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>
                        {m.userName} · {m.time}
                      </div>
                      <span>{m.text}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={sendRoomMessage}>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message the room…"
              />
              <button aria-label="Send message">↑</button>
            </form>
          </section>
        </aside>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function CreateRoom({ onBack, onCreate }) {
  const navigate = useNavigate();
  const [room, setRoom] = useState('Nightwatch build session');
  const [purpose, setPurpose] = useState('Ship the updated matchmaker flow.');
  const [type, setType] = useState('Focus session');
  const [privateRoom, setPrivateRoom] = useState(true);
  const [created, setCreated] = useState(false);
  const [code] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());

  const submit = (e) => {
    e.preventDefault();
    setCreated(true);
  };

  return (
    <div className="create-app">
      <div className="ambient" />
      <div className="room-subnav">
        <button className="back" onClick={onBack}>
          ← Back to Rooms
        </button>
      </div>
      <main className="create-shell">
        <section className="intro">
          <div className="eyebrow">Collaboration, made simple</div>
          <h1>
            Make space<br />
            for the <em>good work.</em>
          </h1>
          <p>
            Start a focused coding room for your team. Bring people, a file, and a shared goal
            together in one calm place.
          </p>
          <ul>
            <li>Real-time cursors and code presence</li>
            <li>Private links, ready to share</li>
            <li>Built for quick sessions or deep work</li>
          </ul>
        </section>
        <section className="create-card">
          <header>
            <h2>Create a new room</h2>
            <span>01 / 01</span>
          </header>
          <form onSubmit={submit}>
            <Field label="ROOM NAME">
              <input value={room} onChange={(e) => setRoom(e.target.value)} required />
            </Field>
            <Field label="WHAT ARE YOU WORKING ON?">
              <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </Field>
            <Field label="SESSION TYPE">
              <div className="types">
                {['Focus session', 'Pair programming'].map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={type === t ? 'selected' : ''}
                    onClick={() => setType(t)}
                  >
                    <b>{t}</b>
                    <small>
                      {t === 'Focus session' ? 'Quiet, intentional work' : 'Build together live'}
                    </small>
                  </button>
                ))}
              </div>
            </Field>
            <button
              type="button"
              className="privacy"
              onClick={() => setPrivateRoom(!privateRoom)}
            >
              <i className={privateRoom ? 'on' : ''} />
              <span>
                <b>{privateRoom ? 'Private room' : 'Team room'}</b> ·{' '}
                {privateRoom ? 'invite-only access' : 'visible to your team'}
              </span>
            </button>
            <button className="create" type="submit">
              Create coding room →
            </button>
            <p className="note">You can change access and invite collaborators anytime.</p>
          </form>
        </section>
      </main>
      {created && (
        <div className="success-overlay">
          <div className="success">
            <div className="checkmark">✓</div>
            <h2>Your room is ready.</h2>
            <p>{room || 'Your new room'} is waiting for your team.</p>
            <div className="generated-code">
              <span>JOIN CODE</span>
              <b>{code}</b>
              <small>Share this with your team</small>
            </div>
            <button onClick={() => onCreate(room || 'Your new room', code)}>
              Enter coding room →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Metric({ value, label }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

function Avatar({ person, small }) {
  if (!person) return null;
  return (
    <span
      className={`avatar ${small ? 'small' : ''}`}
      style={{ background: person.color }}
      title={person.name}
    >
      {person.initials}
    </span>
  );
}

function Message({ who, text, people }) {
  const isMine = who === 'me' || who === 'priya';
  const p = (people || BASE_PEOPLE).find((person) => person.id === who) || {
    initials: isMine ? 'ME' : '??',
    color: isMine ? '#ff98a2' : '#8fd6ff',
  };

  return (
    <div className={`message ${isMine ? 'mine' : ''}`}>
      <Avatar person={p} small />
      <span>{text}</span>
    </div>
  );
}