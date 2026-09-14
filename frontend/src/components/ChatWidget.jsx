import React, { useState, useRef, useEffect } from "react";
import { chatApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useChatUI, AVATAR_COLORS } from "../context/ChatUIContext.jsx";

const INITIAL_CONVERSATIONS = [
  {
    id: 'aditi', name: 'Aditi Rao · Nightwatch', initial: 'A', online: true, colorIdx: 0,
    unread: 2,
    messages: [
      { from: 'them', text: 'Hey! 👋 Have you started on the WebSocket layer?', time: '10:02 AM' },
      { from: 'me', text: 'Yeah, writing the socket reconnect logic right now', time: '10:03 AM' },
      { from: 'them', text: 'Perfect, send the PR over for review 🔥', time: '10:04 AM' },
    ],
  },
  {
    id: 'kabir', name: 'Kabir Mehta', initial: 'K', online: true, colorIdx: 1,
    unread: 2,
    messages: [
      { from: 'them', text: 'Hey, did you deploy the Ledger Loop demo?', time: '9:40 AM' },
      { from: 'them', text: 'The UPI split flow looks great 🔥', time: '9:41 AM' },
    ],
  },
  {
    id: 'meera', name: 'Meera Pillai', initial: 'M', online: false, colorIdx: 2,
    unread: 0,
    messages: [
      { from: 'me', text: 'Let\u2019s hop on a call tomorrow about Fable\u2019s frontend', time: 'Yesterday' },
      { from: 'them', text: 'Done, send over a calendar invite', time: 'Yesterday' },
    ],
  },
  {
    id: 'formless', name: 'Formless Team 👩💻', initial: 'F', online: true, colorIdx: 3,
    unread: 1,
    messages: [
      { from: 'them', text: 'There\u2019s a new PR pending review', time: '8:15 AM' },
      { from: 'them', text: 'Should I merge it into main?', time: '8:16 AM' },
    ],
  },
  {
    id: 'yusuf', name: 'Yusuf Sheikh', initial: 'Y', online: false, colorIdx: 4,
    unread: 0,
    messages: [
      { from: 'them', text: 'Thanks for accepting my Nightwatch join request!', time: 'Mon' },
      { from: 'me', text: 'Welcome to the team 🙌', time: 'Mon' },
    ],
  },
];

const REPLIES = [
  "Got it, I\u2019ll add it to the PR.",
  "Good question, can you share more detail?",
  "Cool, noted 👍",
  "Yep, I\u2019ll get it done today.",
  "Ok noted! Let\u2019s discuss it in standup.",
];

function timeNow() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* ============================================================
   GLOBAL STYLES — plain CSS animations only, no GSAP needed.
   ============================================================ */
const GlobalStyle = () => (
  <style>{`
    .cw-root{
      --bg-deep: #050506; --bg-mid: #16161a;
      --accent: #ff98a2; --accent-2: #e17a92; --online: #ff98a2;
      --glass-fill: rgba(255,255,255,0.05); --glass-fill-strong: rgba(255,255,255,0.09);
      --glass-border: rgba(255,255,255,0.1);
      --text-hi: #f2f1ed; --text-lo: rgba(242,241,237,0.55);
      --shadow-deep: 0 20px 60px rgba(0,0,0,0.55); --ink: #0a0a0a;
      font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:var(--text-hi);
    }
    .cw-root *{ box-sizing:border-box; }
    .tabular{ font-variant-numeric:tabular-nums; }

    .launcher{
      position:fixed; right:32px; bottom:32px; z-index:20; width:64px; height:64px; border-radius:50%;
      display:flex; align-items:center; justify-content:center; cursor:pointer; border:1px solid var(--glass-border);
      background:linear-gradient(145deg, var(--accent), var(--accent-2));
      box-shadow:0 12px 32px rgba(255,152,162,0.3);
      transition:transform .4s cubic-bezier(.16,1,.3,1), opacity .3s ease;
      animation:breathe 3.6s ease-in-out infinite;
    }
    .launcher:hover{ transform:translateY(-4px) scale(1.05); }
    .launcher.hidden{ opacity:0; transform:scale(.4); pointer-events:none; }
    @keyframes breathe{
      0%,100%{ box-shadow:0 12px 32px rgba(255,152,162,.3), 0 0 0 0 rgba(255,152,162,.35); }
      50%{ box-shadow:0 12px 40px rgba(255,152,162,.42), 0 0 0 10px rgba(255,152,162,0); }
    }
    .launcher svg{ width:27px; height:27px; stroke:var(--ink); }
    .launcher svg circle{ fill:var(--ink); stroke:none; }
    .badge{
      position:absolute; top:-4px; right:-4px; min-width:20px; height:20px; padding:0 5px; border-radius:10px;
      background:var(--accent); color:var(--ink); font-size:11px; font-weight:700;
      display:flex; align-items:center; justify-content:center; border:2px solid var(--bg-deep);
    }

    .cw-root .panel{
      position:fixed; right:32px; bottom:32px; z-index:9999;
      width:376px; max-width:calc(100vw - 40px); height:580px; max-height:calc(100vh - 64px);
      border-radius:24px; background:rgba(14,14,16,0.88); border:1px solid var(--glass-border);
      backdrop-filter:blur(28px) saturate(160%); -webkit-backdrop-filter:blur(28px) saturate(160%);
      box-shadow:var(--shadow-deep), 0 0 40px rgba(255,152,162,0.18), inset 0 1px 0 rgba(255,255,255,.08); overflow:hidden;
      transform-origin:bottom right; transform:scale(0.2) translateY(40px); opacity:0; pointer-events:none;
      transition:transform .4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity .25s ease,
        width .35s ease, height .35s ease, right .35s ease, bottom .35s ease;
    }
    .cw-root .panel.open{
      transform:scale(1) translateY(0);
      opacity:1;
      pointer-events:all;
      animation:panelPop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes panelPop{
      0%{ transform:scale(0.3) translateY(40px); opacity:0; }
      75%{ transform:scale(1.03) translateY(-4px); opacity:1; }
      100%{ transform:scale(1) translateY(0); opacity:1; }
    }
    .cw-root .panel.fullscreen{
      width:calc(100vw - 40px); height:calc(100vh - 40px);
      max-width:calc(100vw - 40px); max-height:calc(100vh - 40px);
      right:20px; bottom:20px; border-radius:20px;
    }
    @media (max-width:600px){
      .cw-root .panel.fullscreen{ right:10px; bottom:10px; width:calc(100vw - 20px); height:calc(100vh - 20px); border-radius:16px; }
    }

    .views{ position:relative; width:200%; height:100%; display:flex; transition:transform .4s cubic-bezier(.16,1,.3,1); }
    .views.show-chat{ transform:translateX(-50%); }
    .view{ width:50%; height:100%; display:flex; flex-direction:column; }

    .inbox-header{
      padding:18px 18px 14px; border-bottom:1px solid var(--glass-border);
      background:linear-gradient(180deg, rgba(255,255,255,.04), transparent);
      display:flex; align-items:center; gap:10px;
    }
    .brand-mark{ width:22px; height:22px; flex-shrink:0; animation:markIdle 4.5s ease-in-out infinite; }
    @keyframes markIdle{ 0%,100%{ transform:rotate(0deg) translateY(0); } 50%{ transform:rotate(-6deg) translateY(-1px); } }
    .inbox-header .titles{ flex:1; min-width:0; }
    .fullscreen-btn, .back-btn, .close-btn{
      width:30px; height:30px; border-radius:10px; border:none; flex-shrink:0;
      background:var(--glass-fill-strong); color:var(--text-hi); cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:background .2s ease, transform .3s cubic-bezier(.16,1,.3,1);
    }
    .fullscreen-btn:hover, .back-btn:hover, .close-btn:hover{ background:rgba(255,255,255,.14); }
    .back-btn:hover{ transform:translateX(-2px); }
    .close-btn:hover{ transform:rotate(90deg); }
    .fullscreen-btn svg{ width:14px; height:14px; }
    .inbox-header h2{ margin:0; font-family:'Fraunces',serif; font-style:italic; font-weight:450; font-size:20px; letter-spacing:-.01em; }
    .inbox-header .sub{ margin-top:2px; font-size:12px; color:var(--text-lo); }

    .search-box{
      margin:12px 18px 8px; padding:9px 14px; border-radius:12px;
      background:var(--glass-fill); border:1px solid var(--glass-border); display:flex; align-items:center; gap:8px;
    }
    .search-box svg{ width:15px; height:15px; stroke:var(--text-lo); flex-shrink:0; }
    .search-box input{ border:none; background:transparent; outline:none; color:var(--text-hi); font-size:13px; width:100%; }
    .search-box input::placeholder{ color:var(--text-lo); }

    .chat-list{ flex:1; overflow-y:auto; padding:6px 8px 12px; }
    .chat-list::-webkit-scrollbar{ width:6px; }
    .chat-list::-webkit-scrollbar-thumb{ background:rgba(255,152,162,.35); border-radius:3px; }

    .chat-item{ display:flex; align-items:center; gap:12px; padding:11px 10px; border-radius:16px; cursor:pointer; transition:background .18s ease; }
    .chat-item:hover{ background:var(--glass-fill-strong); }
    .avatar{
      width:46px; height:46px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center;
      font-family:'Fraunces',serif; font-style:italic; font-weight:450; color:var(--ink); font-size:17px; position:relative;
    }
    .avatar.online::after{
      display: none;
    }
    .chat-item .info{ flex:1; min-width:0; }
    .chat-item .row1{ display:flex; justify-content:space-between; align-items:baseline; gap:6px; }
    .chat-item .name{ font-family:'Fraunces',serif; font-style:italic; font-weight:450; font-size:14.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .chat-item .time{ font-size:11px; color:var(--text-lo); flex-shrink:0; }
    .chat-item .row2{ display:flex; justify-content:space-between; align-items:center; gap:6px; margin-top:2px; }
    .chat-item .preview{ font-size:12.5px; color:var(--text-lo); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .chat-item.read .preview{ color:rgba(242,241,237,.35); }
    .unread-pill{
      min-width:18px; height:18px; padding:0 5px; border-radius:9px; background:var(--accent); color:var(--ink);
      font-size:10.5px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }

    .chat-header{
      display:flex; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid var(--glass-border);
      background:linear-gradient(180deg, rgba(255,255,255,.04), transparent);
    }
    .chat-header .avatar{ width:38px; height:38px; font-size:15px; }
    .chat-header .avatar.online::after{ width:10px; height:10px; }
    .chat-header .who{ flex:1; min-width:0; }
    .chat-header .who .name{ font-family:'Fraunces',serif; font-style:italic; font-weight:450; font-size:15.5px; }
    .chat-header .who .status{ font-size:11.5px; margin-top:1px; }

    .messages{ flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; }
    .messages::-webkit-scrollbar{ width:6px; }
    .messages::-webkit-scrollbar-thumb{ background:rgba(255,152,162,.35); border-radius:3px; }
    .day-divider{
      align-self:center; font-size:11px; color:var(--text-lo); background:var(--glass-fill); padding:4px 12px;
      border-radius:20px; border:1px solid var(--glass-border); margin-bottom:2px;
    }
    .msg{
      max-width:78%; padding:10px 14px; border-radius:16px; font-size:13.5px; line-height:1.5; position:relative;
      animation:pop-in .4s cubic-bezier(.16,1,.3,1) both;
    }
    @keyframes pop-in{ from{ opacity:0; transform:translateY(8px); } to{ opacity:1; transform:translateY(0); } }
    .msg.them{ align-self:flex-start; background:var(--glass-fill-strong); border:1px solid var(--glass-border); border-bottom-left-radius:4px; }
    .msg.me{ align-self:flex-end; background:linear-gradient(135deg, var(--accent), var(--accent-2)); color:var(--ink); font-weight:500; border-bottom-right-radius:4px; }
    .msg .time{ display:block; font-size:10px; margin-top:4px; opacity:.6; font-weight:400; }

    .typing{
      align-self:flex-start; display:flex; gap:4px; padding:12px 14px; border-radius:16px; border-bottom-left-radius:4px;
      background:var(--glass-fill-strong); border:1px solid var(--glass-border); width:fit-content;
    }
    .typing span{ width:6px; height:6px; border-radius:50%; background:var(--text-lo); animation:bounce 1.2s infinite ease-in-out; }
    .typing span:nth-child(2){ animation-delay:.15s; }
    .typing span:nth-child(3){ animation-delay:.3s; }
    @keyframes bounce{ 0%,60%,100%{ transform:translateY(0); opacity:.5; } 30%{ transform:translateY(-4px); opacity:1; } }

    .composer{ display:flex; align-items:flex-end; gap:8px; padding:12px 14px; border-top:1px solid var(--glass-border); background:linear-gradient(0deg, rgba(255,255,255,.05), transparent); }
    .composer textarea{
      flex:1; resize:none; max-height:90px; min-height:38px; background:var(--glass-fill); border:1px solid var(--glass-border);
      border-radius:14px; color:var(--text-hi); padding:9px 14px; font-family:'Inter',sans-serif; font-size:13.5px; outline:none;
      transition:border-color .2s ease, background .2s ease;
    }
    .composer textarea:focus{ border-color:var(--accent); background:var(--glass-fill-strong); }
    .composer textarea::placeholder{ color:var(--text-lo); }
    .send-btn{
      width:38px; height:38px; border-radius:12px; border:none; flex-shrink:0;
      background:linear-gradient(135deg, var(--accent), var(--accent-2));
      display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .18s ease;
    }
    .send-btn:active{ transform:scale(.88); }
    .send-btn svg{ width:16px; height:16px; fill:var(--ink); }

    @media (max-width:480px){
      .cw-root .panel{ right:16px; left:16px; width:auto; bottom:96px; }
      .launcher{ right:20px; bottom:20px; }
    }
    @media (prefers-reduced-motion: reduce){
      .launcher, .msg, .typing span{ animation:none !important; }
      .cw-root .panel, .views{ transition:opacity .2s ease !important; }
    }
  `}</style>
);

function BrandMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M4 5l16 14" stroke="#ff98a2" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 5L8 12l12 7" stroke="#f5f1e8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const EXPAND_PATH = <><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /></>;
const COLLAPSE_PATH = <><path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" /></>;

function FullscreenButton({ fullscreen, onClick }) {
  return (
    <button className="fullscreen-btn" aria-label="Full screen" onClick={onClick}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {fullscreen ? COLLAPSE_PATH : EXPAND_PATH}
      </svg>
    </button>
  );
}

export function openDirectMessage({ userId, name, initial }) {
  window.dispatchEvent(
    new CustomEvent('devconnect:open-chat', {
      detail: { userId, name, initial },
    })
  );
}

export default function ChatWidget() {
  const { user } = useAuth() || {};
  const {
    open,
    setOpen,
    fullscreen,
    setFullscreen,
    view,
    setView,
    conversations,
    setConversations,
    activeId,
    setActiveId,
  } = useChatUI();

  const [inputValue, setInputValue] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesRef = useRef(null);
  const panelRef = useRef(null);
  const textareaRef = useRef(null);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  const active = conversations.find((c) => c.id === activeId) || null;

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [active, typing, view]);

  useEffect(() => {
    if (view === 'chat' && open) {
      const t1 = setTimeout(() => textareaRef.current?.focus(), 50);
      const t2 = setTimeout(() => textareaRef.current?.focus(), 150);
      const t3 = setTimeout(() => textareaRef.current?.focus(), 300);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [view, open, activeId]);

  useEffect(() => {
    function onDocClick(e) {
      if (
        e.target.closest('#messageBtn') ||
        e.target.closest('.launcher') ||
        e.target.closest('[data-chat-trigger]')
      ) {
        return;
      }
      if (open && panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape' && open) setOpen(false); }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onKey); };
  }, [open, setOpen]);

  function openChat(id) {
    setConversations((list) => list.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    setActiveId(id);
    setView('chat');
    setTimeout(() => textareaRef.current?.focus(), 150);

    // If it's a server chat, fetch message history
    const target = conversations.find((c) => c.id === id);
    if (target?.isServerChat && id && id.length === 24) {
      chatApi
        .getMessages(id)
        .then((msgs) => {
          const list = Array.isArray(msgs) ? msgs : msgs?.messages || [];
          if (list.length > 0) {
            const formatted = list.map((m) => ({
              from: m.sender?._id === user?._id || m.sender === user?._id ? 'me' : 'them',
              text: m.content || '',
              time: m.createdAt
                ? new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : 'Now',
            }));
            setConversations((all) =>
              all.map((c) => (c.id === id ? { ...c, messages: formatted } : c))
            );
          }
        })
        .catch(() => {});
    }
  }

  function backToList() { setView('inbox'); }

  function sendMessage() {
    const text = inputValue.trim();
    if (!text || !active) return;
    const time = timeNow();
    setConversations((list) => list.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, { from: 'me', text, time }] } : c)));
    setInputValue('');

    // If server chat, send via chatApi
    const serverChatId = (active.isServerChat && active.id && active.id.length === 24)
      ? active.id
      : (active._id && typeof active._id === 'string' && active._id.length === 24)
      ? active._id
      : null;

    if (serverChatId) {
      chatApi.sendMessage(serverChatId, text).catch(() => {});
    } else {
      setTyping(true);
      setTimeout(() => {
        const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
        const rtime = timeNow();
        setConversations((list) => list.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, { from: 'them', text: reply, time: rtime }] } : c)));
        setTyping(false);
      }, 900 + Math.random() * 700);
    }
  }

  return (
    <div className="cw-root">
      <GlobalStyle />

      <div className={`launcher${open ? ' hidden' : ''}`} onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 3.5c-4.97 0-9 3.58-9 8 0 2.08.9 3.97 2.38 5.4-.24 1.14-.9 2.4-1.98 3.4a.5.5 0 0 0 .4.85c1.9-.15 3.5-.8 4.7-1.55A10.6 10.6 0 0 0 12 19.5c4.97 0 9-3.58 9-8s-4.03-8-9-8Z" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="8.3" cy="11.5" r="1.05" />
          <circle cx="12" cy="11.5" r="1.05" />
          <circle cx="15.7" cy="11.5" r="1.05" />
        </svg>
        {totalUnread > 0 && <div className="badge">{totalUnread}</div>}
      </div>

      <div className={`panel${open ? ' open' : ''}${fullscreen ? ' fullscreen' : ''}`} ref={panelRef} onClick={(e) => e.stopPropagation()}>
        <div className={`views${view === 'chat' ? ' show-chat' : ''}`}>

          {/* VIEW 1: Inbox list */}
          <div className="view">
            <div className="inbox-header">
              <BrandMark className="brand-mark" />
              <div className="titles">
                <h2>Chats</h2>
                <div className="sub">{totalUnread > 0 ? `${totalUnread} new messages` : 'All caught up ✓'}</div>
              </div>
              <FullscreenButton fullscreen={fullscreen} onClick={() => setFullscreen((f) => !f)} />
              <button className="close-btn" aria-label="Close" onClick={() => setOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <input type="text" placeholder="Search..." />
            </div>
            <div className="chat-list">
              {conversations.map((conv) => {
                const last = conv.messages[conv.messages.length - 1];
                return (
                  <div className={`chat-item${conv.unread === 0 ? ' read' : ''}`} key={conv.id} onClick={() => openChat(conv.id)}>
                    <div className={`avatar${conv.online ? ' online' : ''}`} style={{ background: AVATAR_COLORS[conv.colorIdx] }}>{conv.initial}</div>
                    <div className="info">
                      <div className="row1">
                        <span className="name">{conv.name}</span>
                        <span className="time">{last.time}</span>
                      </div>
                      <div className="row2">
                        <span className="preview">{last.from === 'me' ? 'You: ' : ''}{last.text}</span>
                        {conv.unread > 0 && <span className="unread-pill tabular">{conv.unread}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VIEW 2: Chat thread */}
          <div className="view">
            <div className="chat-header">
              <button className="back-btn" aria-label="Back" onClick={backToList}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              {active && (
                <>
                  <div className={`avatar${active.online ? ' online' : ''}`} style={{ background: AVATAR_COLORS[active.colorIdx] }}>{active.initial}</div>
                  <div className="who">
                    <div className="name">{active.name}</div>
                    <div className="status" style={{ color: active.online ? 'var(--online)' : 'var(--text-lo)' }}>
                      {active.online ? 'Online now' : 'Last seen recently'}
                    </div>
                  </div>
                </>
              )}
              <FullscreenButton fullscreen={fullscreen} onClick={() => setFullscreen((f) => !f)} />
              <button className="close-btn" aria-label="Close" onClick={() => setOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="messages" ref={messagesRef}>
              <div className="day-divider">Today</div>
              {active && active.messages.map((m, i) => (
                <div className={`msg ${m.from}`} key={i}>{m.text}<span className="time">{m.time}</span></div>
              ))}
              {typing && <div className="typing"><span /><span /><span /></div>}
            </div>
            <div className="composer">
              <textarea
                ref={textareaRef} rows={1} placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <button className="send-btn" aria-label="Send" onClick={sendMessage}>
                <svg viewBox="0 0 24 24"><path d="M3 20l18-8L3 4v6l12 2-12 2z" /></svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}