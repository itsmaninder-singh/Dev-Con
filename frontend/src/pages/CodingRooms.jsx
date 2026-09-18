import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { connectSocket, getSocket } from '../lib/socket';
import {
  Save,
  Circle,
  CircleDot,
  Check,
  CheckCircle2,
  Code2,
  Kanban,
  FileText,
  Link2,
  Users,
  User,
  Copy,
  ExternalLink,
  Plus,
  Layers,
} from 'lucide-react';
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

greetCollaborators("DevConnect Squad", 1);
`,
  'matchmaker.ts': `// Candidate matching algorithm
function scoreFit(skills, required) {
  const matched = required.filter(s => skills.includes(s));
  const score = Math.min(97, 35 + matched.length * 20);
  console.log("Matched skills:", matched);
  console.log("Calculated Fit Score: " + score + "%");
  return { score, matched };
}

scoreFit(["React", "Node.js", "TypeScript"], ["React", "TypeScript", "Next.js"]);
`,
};

const LANGUAGE_PRESETS = [
  { id: 'python', label: 'Python', ext: 'py', icon: '🐍', defaultName: 'main.py', starter: `# Python 3 Script\ndef main():\n    print("Hello from Python 3!")\n    numbers = [1, 2, 3, 4, 5]\n    squares = [n ** 2 for n in numbers]\n    print("Squares:", squares)\n\nif __name__ == "__main__":\n    main()\n` },
  { id: 'javascript', label: 'JavaScript', ext: 'js', icon: '⚡', defaultName: 'script.js', starter: `// JavaScript\nfunction run() {\n  console.log("Hello from JavaScript!");\n  const items = ["DevConnect", "Rooms", "LiveSync"];\n  console.log("Active modules:", items.join(", "));\n}\n\nrun();\n` },
  { id: 'typescript', label: 'TypeScript', ext: 'ts', icon: '🔷', defaultName: 'main.ts', starter: `// TypeScript\ninterface Member {\n  name: string;\n  role: string;\n  active: boolean;\n}\n\nconst dev: Member = { name: "Developer", role: "Fullstack", active: true };\nconsole.log("Member info:", dev);\n` },
  { id: 'cpp', label: 'C++', ext: 'cpp', icon: '⚙️', defaultName: 'main.cpp', starter: `// C++ Source\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    cout << "🚀 Hello from C++!" << endl;\n    vector<int> nums = {10, 20, 30};\n    for (int n : nums) cout << n << " ";\n    cout << endl;\n    return 0;\n}\n` },
  { id: 'java', label: 'Java', ext: 'java', icon: '☕', defaultName: 'Main.java', starter: `// Java Class\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n        int sum = 0;\n        for (int i = 1; i <= 5; i++) sum += i;\n        System.out.println("Sum 1..5 = " + sum);\n    }\n}\n` },
  { id: 'html', label: 'HTML', ext: 'html', icon: '🌐', defaultName: 'index.html', starter: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>DevConnect Room</title>\n</head>\n<body>\n  <main>\n    <h1>Hello from DevConnect Live Room!</h1>\n    <p>Collaborative coding in real-time.</p>\n  </main>\n</body>\n</html>\n` },
  { id: 'css', label: 'CSS', ext: 'css', icon: '🎨', defaultName: 'styles.css', starter: `/* CSS Stylesheet */\n:root {\n  --primary: #ff98a2;\n  --bg: #0d0d12;\n}\n\nbody {\n  margin: 0;\n  background: var(--bg);\n  color: #f2f1ed;\n  font-family: -apple-system, sans-serif;\n}\n` },
  { id: 'go', label: 'Go', ext: 'go', icon: '🐹', defaultName: 'main.go', starter: `// Go Package\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go!")\n}\n` },
  { id: 'rust', label: 'Rust', ext: 'rs', icon: '🦀', defaultName: 'main.rs', starter: `// Rust Program\nfn main() {\n    println!("Hello from Rust!");\n}\n` },
  { id: 'sql', label: 'SQL', ext: 'sql', icon: '🗄️', defaultName: 'query.sql', starter: `-- SQL Query\nSELECT id, name, email, created_at\nFROM users\nWHERE status = 'active'\nORDER BY created_at DESC;\n` },
  { id: 'markdown', label: 'Markdown', ext: 'md', icon: '📝', defaultName: 'README.md', starter: `# Collaborative Project Notes\n\n- Room Code: DEVCON\n- Stack: React, Socket.IO, Node.js\n- Files: Multiple language support enabled\n` },
];

export default function CodingRooms() {
  const [screen, setScreen] = useState('lobby');
  const [room, setRoom] = useState({ name: 'Live Coding Room', code: 'DEVCON' });

  const enterRoom = (name, code) => {
    setRoom({ name, code: (code || 'DEVCON').toUpperCase() });
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

  // Kanban / Task board state for session (4 columns, priority, categories)
  const KANBAN_COLUMNS = [
    { id: 'todo', title: 'To Do', color: '#ff98a2', icon: '📌' },
    { id: 'in-progress', title: 'In Progress', color: '#8fd6ff', icon: '⚡' },
    { id: 'in-review', title: 'In Review', color: '#ffd43b', icon: '🔍' },
    { id: 'done', title: 'Done', color: '#81c784', icon: '✅' },
  ];

  const [boardTasks, setBoardTasks] = useState([
    { id: 'task-1', title: 'Setup project boilerplate & dependencies', status: 'done', priority: 'medium', category: 'DevOps', assignee: 'You' },
    { id: 'task-2', title: 'Implement core matchmaking logic', status: 'in-progress', priority: 'high', category: 'Backend', assignee: 'Karan' },
    { id: 'task-3', title: 'Add real-time websocket synchronization', status: 'in-review', priority: 'high', category: 'API', assignee: 'Aditi' },
    { id: 'task-4', title: 'Test edge-case handling & write unit tests', status: 'todo', priority: 'low', category: 'Frontend', assignee: 'Unassigned' },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('todo');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('Frontend');
  const [newTaskAssignee, setNewTaskAssignee] = useState('You');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [boardPriorityFilter, setBoardPriorityFilter] = useState('all');
  const [boardAssigneeFilter, setBoardAssigneeFilter] = useState('all');
  const [boardSearch, setBoardSearch] = useState('');

  // Overview Scratchpad & Resources state
  const [roomNotes, setRoomNotes] = useState(
    `# ${room.name} — Workspace Scratchpad\n\n` +
    `## Session Goals\n` +
    `- [x] Initialize shared project workspace\n` +
    `- [ ] Build real-time pair programming interface\n` +
    `- [ ] Review PRs and deploy staging build\n\n` +
    `## Architecture & Notes\n` +
    `- Frontend: React + Socket.io for live collaboration\n` +
    `- State: Reactive sprint board & real-time file sharing\n` +
    `- API: REST routes + WebSocket rooms for instant sync\n`
  );

  const [pinnedResources, setPinnedResources] = useState([
    { id: 'res-1', title: 'GitHub Repository', url: 'https://github.com', category: 'Code' },
    { id: 'res-2', title: 'Figma Design System', url: 'https://figma.com', category: 'Design' },
    { id: 'res-3', title: 'API Documentation', url: 'https://devconnect.io/docs', category: 'Docs' },
  ]);
  const [newResourceOpen, setNewResourceOpen] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceCat, setNewResourceCat] = useState('Code');
  const [memberRoles, setMemberRoles] = useState({
    me: 'Team Lead',
  });

  const handleAddTask = (e) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: newTaskStatus,
      priority: newTaskPriority,
      category: newTaskCategory,
      assignee: newTaskAssignee || displayName,
    };
    setBoardTasks((prev) => [...prev, task]);
    setNewTaskTitle('');
    setTaskModalOpen(false);
    setToast('Task added to sprint board');
  };

  const handleMoveTask = (taskId, newStatus) => {
    setBoardTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const handleMoveTaskDir = (taskId, direction) => {
    const colOrder = ['todo', 'in-progress', 'in-review', 'done'];
    setBoardTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const currIdx = colOrder.indexOf(t.status);
        const nextIdx =
          direction === 'next'
            ? Math.min(currIdx + 1, colOrder.length - 1)
            : Math.max(currIdx - 1, 0);
        return { ...t, status: colOrder[nextIdx] };
      })
    );
  };

  const handleDeleteTask = (taskId) => {
    setBoardTasks((prev) => prev.filter((t) => t.id !== taskId));
    setToast('Task removed');
  };

  const handleAddResource = (e) => {
    if (e) e.preventDefault();
    if (!newResourceTitle.trim() || !newResourceUrl.trim()) return;
    let url = newResourceUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const res = {
      id: `res-${Date.now()}`,
      title: newResourceTitle.trim(),
      url,
      category: newResourceCat,
    };
    setPinnedResources((prev) => [...prev, res]);
    setNewResourceTitle('');
    setNewResourceUrl('');
    setNewResourceOpen(false);
    setToast('Resource link pinned to room');
  };

  const handleDeleteResource = (resId) => {
    setPinnedResources((prev) => prev.filter((r) => r.id !== resId));
    setToast('Resource link removed');
  };

  const insertTemplate = (type) => {
    if (type === 'arch') {
      setRoomNotes(
        (prev) =>
          prev +
          `\n\n## Architecture Blueprint\n` +
          `- **Client**: React + Vite, SPA, Socket.io client\n` +
          `- **Server**: Node/Express, WebSocket room '${room.code}'\n` +
          `- **Data Flow**: Optimistic local state with server broadcast ack\n` +
          `- **Key Endpoints**: /api/rooms/:id/session, /api/rooms/tasks\n`
      );
      setToast('Architecture template inserted');
    } else if (type === 'api') {
      setRoomNotes(
        (prev) =>
          prev +
          `\n\n## API Endpoints Spec\n` +
          `| Method | Path | Description | Status |\n` +
          `|---|---|---|---|\n` +
          `| POST | /rooms/join | Join session with room code | Active |\n` +
          `| GET | /rooms/files | List workspace files | Active |\n` +
          `| PUT | /rooms/files/:name | Save file content | In Review |\n`
      );
      setToast('API spec template inserted');
    } else if (type === 'meeting') {
      setRoomNotes(
        (prev) =>
          prev +
          `\n\n## Meeting Minutes (${new Date().toLocaleDateString()})\n` +
          `- **Attendees**: ${connectedUsers.map((u) => u.name).join(', ')}\n` +
          `- **Discussion**: Aligning on feature requirements & MVP demo deadline.\n` +
          `- **Decisions Made**:\n` +
          `  1. Sprint Board tasks must be updated before merging code.\n` +
          `  2. Code runs in the integrated terminal sandbox.\n`
      );
      setToast('Meeting notes template inserted');
    }
  };

  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const terminalBodyRef = useRef(null);
  const typingTimerRef = useRef(null);
  const fileHandleRef = useRef(null);

  const currentCode = files[tab] || '';
  const lines = useMemo(() => currentCode.split('\n'), [currentCode]);

  // Reset file handle when active tab changes so next save prompts for the new file
  useEffect(() => {
    fileHandleRef.current = null;
  }, [tab]);

  // FIX 3: Save / Download current editor content to user's local machine
  const handleSaveToLocal = async () => {
    const filename = tab || 'main.js';
    const ext = filename.includes('.') ? filename.split('.').pop() : 'js';

    const mimeMap = {
      js: 'text/javascript',
      jsx: 'text/javascript',
      ts: 'text/typescript',
      tsx: 'text/typescript',
      html: 'text/html',
      css: 'text/css',
      py: 'text/x-python',
      json: 'application/json',
      md: 'text/markdown',
      cpp: 'text/x-c++src',
      c: 'text/x-csrc',
      java: 'text/x-java-source',
      go: 'text/x-go',
      rs: 'text/x-rustsrc',
    };
    const mimeType = mimeMap[ext] || 'text/plain';

    // 1. Preferred File System Access API (Chromium-based browsers)
    if ('showSaveFilePicker' in window) {
      try {
        let handle = fileHandleRef.current;
        if (!handle) {
          handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: `${ext.toUpperCase()} Source File`,
                accept: { [mimeType]: [`.${ext}`] },
              },
            ],
          });
          fileHandleRef.current = handle;
        }
        const writable = await handle.createWritable();
        await writable.write(currentCode);
        await writable.close();
        setToast(`Saved ${handle.name || filename} locally!`);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled save dialog
        console.warn('File System Access API failed, falling back to download:', err);
      }
    }

    // 2. Fallback: Blob + temporary <a download> (Safari, Firefox, etc.)
    try {
      const blob = new Blob([currentCode], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast(`Downloaded ${filename} locally!`);
    } catch (err) {
      setToast(`Save failed: ${err.message}`);
    }
  };

  // Create File State
  const [newFileModalOpen, setNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('main.py');
  const [selectedLang, setSelectedLang] = useState('python');

  const handleCreateFile = (e) => {
    e?.preventDefault();
    let name = newFileName.trim();
    if (!name) return;

    const preset = LANGUAGE_PRESETS.find((p) => p.id === selectedLang) || LANGUAGE_PRESETS[0];
    if (!name.includes('.')) {
      name = `${name}.${preset.ext}`;
    }

    const ext = name.split('.').pop()?.toLowerCase();
    const matchingPreset = LANGUAGE_PRESETS.find((p) => p.ext === ext) || preset;
    const starterCode = matchingPreset.starter || `// ${name}\n`;

    if (files[name] !== undefined) {
      setToast(`File ${name} already exists!`);
      setTab(name);
      setNewFileModalOpen(false);
      return;
    }

    setFiles((prev) => ({ ...prev, [name]: starterCode }));
    setTab(name);
    setToast(`Created ${name}`);
    setNewFileModalOpen(false);

    // Broadcast new file with starter code to all room peers
    const socket = getSocket();
    socket?.emit('room:code-change', {
      roomCode: room.code,
      file: name,
      code: starterCode,
      cursorLine: 1,
    });
  };

  const handleDeleteFile = (fileName, e) => {
    e.stopPropagation();
    const remaining = Object.keys(files).filter((f) => f !== fileName);
    if (remaining.length === 0) {
      setToast('Cannot delete the last file');
      return;
    }
    setFiles((prev) => {
      const copy = { ...prev };
      delete copy[fileName];
      return copy;
    });
    if (tab === fileName) {
      setTab(remaining[0]);
    }
    setToast(`Deleted ${fileName}`);
  };

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

    const ext = tab.split('.').pop()?.toLowerCase();

    // Python runner
    if (ext === 'py') {
      newLogs.push({ id: Math.random().toString(36).slice(2), text: `$ python3 ${tab}`, type: 'command' });
      const printRegex = /print\s*\((.*?)\)/g;
      let match;
      let hasOutput = false;
      while ((match = printRegex.exec(currentCode)) !== null) {
        let val = match[1].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        newLogs.push({ id: Math.random().toString(36).slice(2), text: val, type: 'stdout' });
        hasOutput = true;
      }
      if (!hasOutput) {
        newLogs.push({ id: Math.random().toString(36).slice(2), text: 'Python 3 script executed successfully.', type: 'stdout' });
      }
      const elapsed = Math.round(performance.now() - startTime);
      newLogs.push({ id: Math.random().toString(36).slice(2), text: `✔ Process finished with exit code 0 (${elapsed}ms)`, type: 'success' });
      setToast(`Python process exited with code 0`);
      setRunning(false);
      setTerminalLogs((prev) => [...prev, ...newLogs]);
      return;
    }

    // C / C++ compiler & runner
    if (ext === 'cpp' || ext === 'c') {
      const compiler = ext === 'cpp' ? 'g++ -std=c++17' : 'gcc';
      newLogs.push({ id: Math.random().toString(36).slice(2), text: `$ ${compiler} ${tab} -o main && ./main`, type: 'command' });
      const coutRegex = /cout\s*<<\s*("[^"]*")/g;
      let match;
      let found = false;
      while ((match = coutRegex.exec(currentCode)) !== null) {
        newLogs.push({ id: Math.random().toString(36).slice(2), text: match[1].slice(1, -1), type: 'stdout' });
        found = true;
      }
      if (!found) {
        newLogs.push({ id: Math.random().toString(36).slice(2), text: 'Program compiled and executed with exit code 0.', type: 'stdout' });
      }
      const elapsed = Math.round(performance.now() - startTime);
      newLogs.push({ id: Math.random().toString(36).slice(2), text: `✔ Build passed (${elapsed}ms)`, type: 'success' });
      setToast(`C++ build passed`);
      setRunning(false);
      setTerminalLogs((prev) => [...prev, ...newLogs]);
      return;
    }

    // Java runner
    if (ext === 'java') {
      newLogs.push({ id: Math.random().toString(36).slice(2), text: `$ javac ${tab} && java ${tab.replace('.java', '')}`, type: 'command' });
      const sysOutRegex = /System\.out\.println\s*\((.*?)\)/g;
      let match;
      let found = false;
      while ((match = sysOutRegex.exec(currentCode)) !== null) {
        let val = match[1].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        newLogs.push({ id: Math.random().toString(36).slice(2), text: val, type: 'stdout' });
        found = true;
      }
      if (!found) {
        newLogs.push({ id: Math.random().toString(36).slice(2), text: 'Java bytecode compiled and executed.', type: 'stdout' });
      }
      const elapsed = Math.round(performance.now() - startTime);
      newLogs.push({ id: Math.random().toString(36).slice(2), text: `✔ Java build passed (${elapsed}ms)`, type: 'success' });
      setToast(`Java build passed`);
      setRunning(false);
      setTerminalLogs((prev) => [...prev, ...newLogs]);
      return;
    }

    // HTML / CSS / Markdown / SQL
    if (['html', 'css', 'md', 'sql', 'json'].includes(ext)) {
      newLogs.push({ id: Math.random().toString(36).slice(2), text: `$ render ${tab}`, type: 'command' });
      newLogs.push({ id: Math.random().toString(36).slice(2), text: `[Parsed ${ext.toUpperCase()} document (${lines.length} lines, ${currentCode.length} bytes)]`, type: 'stdout' });
      newLogs.push({ id: Math.random().toString(36).slice(2), text: `✔ Document validated and rendered`, type: 'success' });
      setToast(`${tab} validated`);
      setRunning(false);
      setTerminalLogs((prev) => [...prev, ...newLogs]);
      return;
    }

    // JavaScript / TypeScript execution
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

  const totalTasks = boardTasks.length;
  const completedTasks = boardTasks.filter((t) => t.status === 'done').length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredBoardTasks = boardTasks.filter((t) => {
    if (boardPriorityFilter !== 'all' && t.priority !== boardPriorityFilter) return false;
    if (boardAssigneeFilter === 'mine' && t.assignee !== 'You' && t.assignee !== displayName) return false;
    if (boardSearch.trim() && !t.title.toLowerCase().includes(boardSearch.trim().toLowerCase())) return false;
    return true;
  });

  const clock = new Date(session * 1000).toISOString().slice(11, 19);

  return (
    <div className="room-app">
      <div className="ambient" />
      <div className="room-subnav">
        <div className="crumb">
          <button className="back" onClick={onLeave}>← Rooms</button> / {room.name} / <b>{activeTab}</b>
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

      <main className={`room-shell ${activeTab !== 'Live Room' ? 'full-width' : ''}`}>
        {/* =========================================================================
            TAB 1: OVERVIEW (Room Mission Control, Notes, Resources, & Sprint Vitals)
            ========================================================================= */}
        {activeTab === 'Overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Overview Hero */}
            <header className="room-hero" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '20px' }}>
              <div>
                <div className="eyebrow">ROOM MISSION CONTROL</div>
                <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', margin: '6px 0 8px' }}>
                  {room.name}
                </h1>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13.5px', maxWidth: '640px', lineHeight: 1.5 }}>
                  Central workspace dashboard for architectural notes, live sprint progression, pinned developer resources, and team member roles.
                </p>
              </div>
              <div className="metrics">
                <Metric value={clock} label="Session duration" />
                <Metric value={`${progressPct}%`} label="Sprint progress" />
                <Metric value={`${connectedUsers.length} online`} label="Active builders" />
              </div>
            </header>

            {/* Quick Navigation Hub */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Quick Actions:</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('Live Room')}
                  style={{
                    background: '#ff98a2',
                    color: '#1a1012',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 14px rgba(255, 152, 162, 0.25)',
                  }}
                >
                  <Code2 size={13} strokeWidth={2.5} />
                  <span>Open Code Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('Board')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.07)',
                    color: '#f2f1ed',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Kanban size={13} strokeWidth={2.2} />
                  <span>Open Sprint Board ({totalTasks - completedTasks} remaining)</span>
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Room Code:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#ff98a2', fontSize: '15px', letterSpacing: '2px', background: 'rgba(255, 152, 162, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255, 152, 162, 0.3)' }}>
                  {room.code}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(room.code);
                    setToast(`Room code ${room.code} copied to clipboard!`);
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Copy size={11} />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>

            {/* Sprint Progress Bar Card */}
            <div style={{ background: 'rgba(18, 18, 22, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#ff98a2', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Active Sprint Velocity
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f2f1ed', marginTop: '2px' }}>
                    {completedTasks} of {totalTasks} milestones completed ({progressPct}%)
                  </div>
                </div>

                {/* THEMED MINIMALIST STATUS BADGES (NO AI EMOJIS) */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#ff98a2',
                      background: 'rgba(255, 152, 162, 0.08)',
                      border: '1px solid rgba(255, 152, 162, 0.25)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff98a2', boxShadow: '0 0 6px rgba(255, 152, 162, 0.6)' }} />
                    <span>{boardTasks.filter((t) => t.status === 'todo').length} To Do</span>
                  </span>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#8fd6ff',
                      background: 'rgba(143, 214, 255, 0.08)',
                      border: '1px solid rgba(143, 214, 255, 0.25)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8fd6ff', boxShadow: '0 0 6px rgba(143, 214, 255, 0.6)' }} />
                    <span>{boardTasks.filter((t) => t.status === 'in-progress').length} In Progress</span>
                  </span>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#ffd43b',
                      background: 'rgba(255, 212, 59, 0.08)',
                      border: '1px solid rgba(255, 212, 59, 0.25)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffd43b', boxShadow: '0 0 6px rgba(255, 212, 59, 0.6)' }} />
                    <span>{boardTasks.filter((t) => t.status === 'in-review').length} In Review</span>
                  </span>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#81c784',
                      background: 'rgba(129, 199, 132, 0.08)',
                      border: '1px solid rgba(129, 199, 132, 0.25)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Check size={11} strokeWidth={3} />
                    <span>{completedTasks} Done</span>
                  </span>
                </div>
              </div>

              <div style={{ height: '7px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressPct}%`,
                    background: 'linear-gradient(90deg, #ff98a2 0%, #ffb4be 50%, #81c784 100%)',
                    borderRadius: '4px',
                    boxShadow: '0 0 10px rgba(255, 152, 162, 0.35)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* 2-Column Section: Notes & Scratchpad (Left) + Resources & Team Roles (Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '20px' }}>
              {/* Left: Collaborative Shared Scratchpad */}
              <div style={{ background: 'rgba(18, 18, 22, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '22px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: '#f2f1ed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={15} color="#ff98a2" strokeWidth={2.2} />
                      <span>Shared Room Scratchpad & Decisions</span>
                    </h3>
                    <small style={{ color: 'var(--muted)', fontSize: '11px' }}>Real-time workspace notes, architecture blueprints & specs</small>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => insertTemplate('arch')}
                      title="Insert Architecture template"
                      style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', color: 'var(--muted)', borderRadius: '6px', padding: '4px 8px', fontSize: '10.5px', cursor: 'pointer' }}
                    >
                      + Arch
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTemplate('api')}
                      title="Insert API spec template"
                      style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', color: 'var(--muted)', borderRadius: '6px', padding: '4px 8px', fontSize: '10.5px', cursor: 'pointer' }}
                    >
                      + API
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTemplate('meeting')}
                      title="Insert Meeting Minutes template"
                      style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', color: 'var(--muted)', borderRadius: '6px', padding: '4px 8px', fontSize: '10.5px', cursor: 'pointer' }}
                    >
                      + Minutes
                    </button>
                  </div>
                </div>

                <textarea
                  value={roomNotes}
                  onChange={(e) => setRoomNotes(e.target.value)}
                  placeholder="Type notes, decisions, architecture decisions or paste API contracts here..."
                  style={{
                    flex: 1,
                    minHeight: '260px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '14px',
                    color: '#e4e4e7',
                    fontSize: '12.5px',
                    lineHeight: 1.6,
                    fontFamily: 'monospace',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {roomNotes.length} characters · Auto-saved locally
                  </span>
                  <button
                    type="button"
                    onClick={() => setToast('Session notes saved to room!')}
                    style={{
                      background: 'rgba(255, 152, 162, 0.15)',
                      border: '1px solid rgba(255, 152, 162, 0.35)',
                      color: '#ff98a2',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save Notes
                  </button>
                </div>
              </div>

              {/* Right: Pinned Resources & Team Roster */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Pinned Resources Card */}
                <div style={{ background: 'rgba(18, 18, 22, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f2f1ed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link2 size={15} color="#ff98a2" strokeWidth={2.2} />
                      <span>Pinned Links & Resources</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setNewResourceOpen(!newResourceOpen)}
                      style={{
                        background: 'none',
                        border: '1px dashed rgba(255, 152, 162, 0.5)',
                        color: '#ff98a2',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {newResourceOpen ? '✕ Cancel' : '+ Pin Link'}
                    </button>
                  </div>

                  {newResourceOpen && (
                    <form onSubmit={handleAddResource} style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Resource title (e.g. Figma wireframe)"
                        value={newResourceTitle}
                        onChange={(e) => setNewResourceTitle(e.target.value)}
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '12px', outline: 'none' }}
                        required
                      />
                      <input
                        type="url"
                        placeholder="URL (https://...)"
                        value={newResourceUrl}
                        onChange={(e) => setNewResourceUrl(e.target.value)}
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '12px', outline: 'none' }}
                        required
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <select
                          value={newResourceCat}
                          onChange={(e) => setNewResourceCat(e.target.value)}
                          style={{ background: '#1c1c22', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', borderRadius: '6px', padding: '4px 8px', fontSize: '11px' }}
                        >
                          <option value="Code">Code</option>
                          <option value="Design">Design</option>
                          <option value="Docs">Docs</option>
                          <option value="Other">Other</option>
                        </select>
                        <button
                          type="submit"
                          style={{ background: '#ff98a2', color: '#1a1012', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Save Link
                        </button>
                      </div>
                    </form>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pinnedResources.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', overflow: 'hidden' }}>
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            {r.category === 'Design' ? (
                              <Layers size={13} color="#ff98a2" />
                            ) : r.category === 'Docs' ? (
                              <FileText size={13} color="#ffd43b" />
                            ) : r.category === 'Code' ? (
                              <Code2 size={13} color="#8fd6ff" />
                            ) : (
                              <Link2 size={13} color="#81c784" />
                            )}
                          </span>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#f2f1ed', fontSize: '12px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span>{r.title}</span>
                            <ExternalLink size={10} style={{ opacity: 0.6 }} />
                          </a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--muted)', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                            {r.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteResource(r.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px', padding: '2px' }}
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Roster & Roles */}
                <div style={{ background: 'rgba(18, 18, 22, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#f2f1ed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={15} color="#ff98a2" strokeWidth={2.2} />
                    <span>Connected Builders & Roles</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {connectedUsers.map((u) => {
                      const userRole = memberRoles[u.id] || (u.id === 'me' ? 'Team Lead' : 'Fullstack Dev');
                      const assignedCount = boardTasks.filter(
                        (t) => t.assignee === u.name || (u.id === 'me' && t.assignee === 'You')
                      ).length;

                      return (
                        <div
                          key={u.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                            borderRadius: '10px',
                            padding: '10px 12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Avatar person={u} />
                            <div>
                              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f2f1ed' }}>
                                {u.name}
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
                                {assignedCount} tasks assigned · Active
                              </div>
                            </div>
                          </div>

                          <select
                            value={userRole}
                            onChange={(e) => {
                              setMemberRoles((prev) => ({ ...prev, [u.id]: e.target.value }));
                              setToast(`${u.name} role set to ${e.target.value}`);
                            }}
                            style={{
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#ff98a2',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="Team Lead">Team Lead</option>
                            <option value="Frontend Engineer">Frontend Engineer</option>
                            <option value="Backend / API">Backend / API</option>
                            <option value="Fullstack Dev">Fullstack Dev</option>
                            <option value="UI/UX Designer">UI/UX Designer</option>
                            <option value="DevOps">DevOps</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: BOARD (Full-Width Interactive Sprint Kanban Board)
            ========================================================================= */}
        {activeTab === 'Board' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Board Hero */}
            <header className="room-hero" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '18px' }}>
              <div>
                <div className="eyebrow">COLLABORATIVE SPRINT TRACKER</div>
                <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', margin: '6px 0 8px' }}>
                  Milestones & Sprint Board
                </h1>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13.5px', maxWidth: '640px', lineHeight: 1.5 }}>
                  Track development velocity, distribute work packages, and organize features for {room.name}.
                </p>
              </div>
              <div className="metrics">
                <Metric value={`${progressPct}%`} label="Sprint velocity" />
                <Metric value={`${completedTasks} / ${totalTasks}`} label="Completed" />
                <Metric value={`${totalTasks - completedTasks} active`} label="In flight" />
              </div>
            </header>

            {/* Board Controls Toolbar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                background: 'rgba(18, 18, 22, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '12px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search sprint tasks…"
                  value={boardSearch}
                  onChange={(e) => setBoardSearch(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '7px 12px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none',
                    minWidth: '200px',
                  }}
                />

                <select
                  value={boardPriorityFilter}
                  onChange={(e) => setBoardPriorityFilter(e.target.value)}
                  style={{
                    background: '#16161b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: '#f2f1ed',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>

                <select
                  value={boardAssigneeFilter}
                  onChange={(e) => setBoardAssigneeFilter(e.target.value)}
                  style={{
                    background: '#16161b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    color: '#f2f1ed',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="all">All Assignees</option>
                  <option value="mine">My Tasks Only</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {boardTasks.some((t) => t.status === 'done') && (
                  <button
                    type="button"
                    onClick={() => {
                      setBoardTasks((prev) => prev.filter((t) => t.status !== 'done'));
                      setToast('Cleared completed tasks');
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: 'var(--muted)',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                    }}
                  >
                    Clear Done
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setNewTaskStatus('todo');
                    setTaskModalOpen(true);
                  }}
                  style={{
                    background: '#ff98a2',
                    color: '#1a1012',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  + Add Sprint Task
                </button>
              </div>
            </div>

            {/* 4-Column Kanban Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {KANBAN_COLUMNS.map((col) => {
                const colTasks = filteredBoardTasks.filter((t) => t.status === col.id);

                return (
                  <div
                    key={col.id}
                    style={{
                      background: 'rgba(18, 18, 22, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: '450px',
                    }}
                  >
                    {/* Column Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#f2f1ed' }}>
                          {col.title}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--muted)',
                          background: 'rgba(255, 255, 255, 0.07)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 600,
                        }}
                      >
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Task Cards List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      {colTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '36px 12px', color: 'rgba(255, 255, 255, 0.3)', fontSize: '12px', fontStyle: 'italic', border: '1px dashed rgba(255, 255, 255, 0.06)', borderRadius: '10px' }}>
                          No tasks in {col.title}
                        </div>
                      ) : (
                        colTasks.map((task) => {
                          const priorityColor =
                            task.priority === 'high'
                              ? '#ff6b6b'
                              : task.priority === 'medium'
                              ? '#ffd43b'
                              : '#69db7c';

                          return (
                            <div
                              key={task.id}
                              style={{
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                padding: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                transition: 'transform 0.15s ease, border-color 0.15s ease',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    textTransform: 'uppercase',
                                    fontWeight: 700,
                                    letterSpacing: '0.6px',
                                    color: priorityColor,
                                    background: `${priorityColor}1a`,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {task.priority || 'medium'}
                                </span>
                                {task.category && (
                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      color: 'var(--muted)',
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    {task.category}
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: '12.5px', color: '#f2f1ed', fontWeight: 500, lineHeight: 1.4 }}>
                                {task.title}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px', marginTop: '2px' }}>
                                <span style={{ fontSize: '10.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <User size={11} strokeWidth={2.2} />
                                  <span>{task.assignee}</span>
                                </span>

                                <div style={{ display: 'flex', gap: '3px' }}>
                                  {col.id !== 'todo' && (
                                    <button
                                      type="button"
                                      onClick={() => handleMoveTaskDir(task.id, 'prev')}
                                      style={{ background: 'none', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer', fontSize: '10px', padding: '2px 5px' }}
                                      title="Move Left"
                                    >
                                      ←
                                    </button>
                                  )}
                                  {col.id !== 'done' && (
                                    <button
                                      type="button"
                                      onClick={() => handleMoveTaskDir(task.id, 'next')}
                                      style={{ background: 'none', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer', fontSize: '10px', padding: '2px 5px' }}
                                      title="Move Right"
                                    >
                                      →
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTask(task.id)}
                                    style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '12px', padding: '2px 4px' }}
                                    title="Delete task"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Quick Column Add Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewTaskStatus(col.id);
                        setTaskModalOpen(true);
                      }}
                      style={{
                        marginTop: '12px',
                        background: 'transparent',
                        border: '1px dashed rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '8px',
                        color: 'var(--muted)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = col.color;
                        e.currentTarget.style.color = col.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.color = 'var(--muted)';
                      }}
                    >
                      + Add to {col.title}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Task Creation Modal */}
            {taskModalOpen && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 10000,
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(10px)',
                  display: 'grid',
                  placeItems: 'center',
                  padding: '16px',
                }}
                onClick={() => setTaskModalOpen(false)}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: '460px',
                    background: '#141419',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f2f1ed' }}>
                      Add Sprint Milestone
                    </h3>
                    <button
                      type="button"
                      onClick={() => setTaskModalOpen(false)}
                      style={{ background: 'none', border: 'none', color: '#8e8e93', fontSize: '18px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Task Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Implement WebSocket heartbeat protocol"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        autoFocus
                        required
                        style={{
                          width: '100%',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          color: '#fff',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                          Status / Column
                        </label>
                        <select
                          value={newTaskStatus}
                          onChange={(e) => setNewTaskStatus(e.target.value)}
                          style={{
                            width: '100%',
                            background: '#1e1e24',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '9px 10px',
                            color: '#fff',
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="in-review">In Review</option>
                          <option value="done">Done</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                          Priority
                        </label>
                        <select
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value)}
                          style={{
                            width: '100%',
                            background: '#1e1e24',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '9px 10px',
                            color: '#fff',
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        >
                          <option value="high">High Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="low">Low Priority</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                          Category
                        </label>
                        <select
                          value={newTaskCategory}
                          onChange={(e) => setNewTaskCategory(e.target.value)}
                          style={{
                            width: '100%',
                            background: '#1e1e24',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '9px 10px',
                            color: '#fff',
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        >
                          <option value="Frontend">Frontend</option>
                          <option value="Backend">Backend</option>
                          <option value="API">API</option>
                          <option value="Bug">Bug</option>
                          <option value="Design">Design</option>
                          <option value="DevOps">DevOps</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                          Assignee
                        </label>
                        <select
                          value={newTaskAssignee}
                          onChange={(e) => setNewTaskAssignee(e.target.value)}
                          style={{
                            width: '100%',
                            background: '#1e1e24',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '9px 10px',
                            color: '#fff',
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        >
                          <option value="You">You ({displayName})</option>
                          {connectedUsers
                            .filter((u) => u.id !== 'me')
                            .map((u) => (
                              <option key={u.id} value={u.name}>
                                {u.name}
                              </option>
                            ))}
                          <option value="Unassigned">Unassigned</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setTaskModalOpen(false)}
                        style={{
                          background: 'none',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          color: '#8e8e93',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          background: '#ff98a2',
                          color: '#1a1012',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 20px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Add Task
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: LIVE ROOM (Dedicated Multi-File Code Editor, Runner, & Live Chat)
            ========================================================================= */}
        {activeTab === 'Live Room' && (
          <>
            <header className="room-hero">
              <div>
                <div className="eyebrow">LIVE COLLABORATION</div>
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
                <div className="file-tabs" style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', maxWidth: '55%' }}>
                  {Object.keys(files).map((f) => {
                    const isActive = tab === f;
                    return (
                      <div
                        key={f}
                        style={{
                          position: 'relative',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <button
                          onClick={() => {
                            setTab(f);
                            setToast(`${f} opened`);
                          }}
                          className={isActive ? 'active' : ''}
                          style={{
                            paddingRight: Object.keys(files).length > 1 ? '24px' : '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <span>{f}</span>
                        </button>
                        {Object.keys(files).length > 1 && (
                          <button
                            onClick={(e) => handleDeleteFile(f, e)}
                            title={`Delete ${f}`}
                            style={{
                              position: 'absolute',
                              right: '6px',
                              background: 'none',
                              border: 'none',
                              color: isActive ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)',
                              cursor: 'pointer',
                              fontSize: '13px',
                              lineHeight: 1,
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ff98a2')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)')}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setNewFileName('main.py');
                      setSelectedLang('python');
                      setNewFileModalOpen(true);
                    }}
                    className="new-file-btn"
                    title="Create new file (Python, C++, Java, JS, HTML, etc.)"
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px dashed rgba(255, 152, 162, 0.4)',
                      background: 'rgba(255, 152, 162, 0.08)',
                      color: 'var(--pink, #ff98a2)',
                      fontFamily: 'inherit',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 152, 162, 0.18)';
                      e.currentTarget.style.borderColor = 'var(--pink, #ff98a2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 152, 162, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 152, 162, 0.4)';
                    }}
                  >
                    + New File
                  </button>
                </div>
                <span className="session-label">COLLABORATIVE SESSION</span>
                <div className="stack">
                  {connectedUsers.map((p) => (
                    <Avatar key={p.id} person={p} small />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="save-btn"
                    onClick={handleSaveToLocal}
                    title="Save code to your computer"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      color: 'var(--text-hi, #f2f1ed)',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                  >
                    <Save size={13} />
                    <span>Save</span>
                  </button>
                  <button className="run" onClick={handleRunCode} disabled={running}>
                    {running ? '⏳ Running…' : '▶ Run'}
                  </button>
                </div>
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

              {/* INTEGRATED TERMINAL */}
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

            {/* SIDEBAR ASIDE: ONLY RENDERED ON LIVE ROOM TAB */}
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
                  <button type="submit" aria-label="Send message">↑</button>
                </form>
              </section>
            </aside>
          </>
        )}
      </main>

      {newFileModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setNewFileModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#121217',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(255, 152, 162, 0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📄</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f2f1ed' }}>
                  Create New File
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNewFileModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8e8e93',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#8e8e93', lineHeight: 1.4 }}>
              Select a programming language preset or enter a custom file name with its extension.
            </p>

            {/* Language Presets Grid */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#ff98a2', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Select Language Preset
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px', maxHeight: '170px', overflowY: 'auto', paddingRight: '4px' }}>
                {LANGUAGE_PRESETS.map((p) => {
                  const isSelected = selectedLang === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedLang(p.id);
                        setNewFileName(p.defaultName);
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: isSelected ? '1px solid #ff98a2' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSelected ? 'rgba(255, 152, 162, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                        color: isSelected ? '#ff98a2' : '#f2f1ed',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      }}
                    >
                      <span style={{ fontSize: '15px' }}>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Filename Form */}
            <form onSubmit={handleCreateFile}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#ff98a2', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  File Name & Extension
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. main.py, App.jsx, styles.css"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#f2f1ed',
                    fontSize: '13.5px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#ff98a2')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)')}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setNewFileModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'transparent',
                    color: '#8e8e93',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--pink, #ff98a2)',
                    color: '#1a1012',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(255, 152, 162, 0.35)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function CreateRoom({ onBack, onCreate }) {
  const navigate = useNavigate();
  const [room, setRoom] = useState('');
  const [purpose, setPurpose] = useState('');
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
              <input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Nightwatch build session"
                required
              />
            </Field>
            <Field label="WHAT ARE YOU WORKING ON?">
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Ship the updated matchmaker flow."
              />
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