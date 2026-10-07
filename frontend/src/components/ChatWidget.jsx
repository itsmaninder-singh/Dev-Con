import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { chatApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useChatUI, AVATAR_COLORS } from "../context/ChatUIContext.jsx";
import { connectSocket } from "../lib/socket.js";
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  ArrowDown,
  RefreshCw,
} from "lucide-react";

function timeNow() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatMessageTime(dateInput) {
  if (!dateInput) return timeNow();
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return timeNow();
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function getDateLabel(dateInput) {
  if (!dateInput) return 'Today';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Today';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function formatMessageText(text) {
  if (!text) return "";
  const s = String(text).trim();
  if (/^[0-9a-f]{32}:[0-9a-f]{32,}$/i.test(s)) {
    return "💬 Message";
  }
  return text;
}

function formatWhatsAppStatus(active, isTyping) {
  if (isTyping) {
    return 'typing...';
  }
  if (!active) return '';
  if (active.isGroup) {
    const memberCount = active.participants?.length || active.membersCount;
    return memberCount ? `${memberCount} members` : 'Group conversation';
  }
  if (active.online) {
    return 'Online';
  }
  if (!active.lastSeen) {
    return 'Offline';
  }

  const d = new Date(active.lastSeen);
  if (isNaN(d.getTime())) return 'Offline';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) {
    return 'last seen just now';
  }

  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return `last seen today at ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isYesterday) {
    return `last seen yesterday at ${timeStr}`;
  }

  if (d.getFullYear() === now.getFullYear()) {
    const dateStr = d.toLocaleDateString([], { day: 'numeric', month: 'short' });
    return `last seen ${dateStr} at ${timeStr}`;
  }

  const fullDateStr = d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  return `last seen ${fullDateStr} at ${timeStr}`;
}

/* ============================================================
   GLOBAL STYLES — plain CSS animations only
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
      width:380px; max-width:calc(100vw - 40px); height:600px; max-height:calc(100vh - 64px);
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
    .view{ width:50%; height:100%; display:flex; flex-direction:column; position:relative; }

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
      content:''; position:absolute; bottom:1px; right:1px; width:11px; height:11px;
      border-radius:50%; background:#22c55e; border:2px solid var(--bg-deep, #050506);
      box-shadow:0 0 6px rgba(34,197,94,0.6);
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
    .chat-header .who{ flex:1; min-width:0; }
    .chat-header .who .name{ font-family:'Fraunces',serif; font-style:italic; font-weight:450; font-size:15.5px; }
    .chat-header .who .status{ font-size:11.5px; margin-top:1px; }

    .messages{ flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; position:relative; justify-content:flex-end; }
    .messages::-webkit-scrollbar{ width:6px; }
    .messages::-webkit-scrollbar-thumb{ background:rgba(255,152,162,.35); border-radius:3px; }

    .load-earlier-container{ display:flex; justify-content:center; padding:4px 0 10px; }
    .load-earlier-btn{
      background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:var(--text-lo);
      font-size:11.5px; padding:5px 14px; border-radius:20px; cursor:pointer; transition:all .2s ease;
      display:inline-flex; align-items:center; gap:6px;
    }
    .load-earlier-btn:hover{ background:rgba(255,255,255,0.12); color:var(--text-hi); border-color:var(--accent); }

    .day-divider{
      align-self:center; font-size:11px; color:var(--text-lo); background:var(--glass-fill); padding:3px 12px;
      border-radius:20px; border:1px solid var(--glass-border); margin:4px 0; font-weight:500;
    }

    .msg-wrapper{ display:flex; flex-direction:column; position:relative; width:100%; }
    .msg-wrapper.me{ align-items:flex-end; }
    .msg-wrapper.them{ align-items:flex-start; }

    .msg-row{ display:flex; align-items:center; gap:6px; max-width:82%; position:relative; }
    .msg-wrapper.me .msg-row{ flex-direction:row-reverse; }

    .msg{
      padding:9px 13px; border-radius:16px; font-size:13.5px; line-height:1.45; position:relative;
      animation:pop-in .3s cubic-bezier(.16,1,.3,1) both; word-break:break-word;
    }
    @keyframes pop-in{ from{ opacity:0; transform:translateY(6px); } to{ opacity:1; transform:translateY(0); } }

    .msg.them{
      background:var(--glass-fill-strong); border:1px solid var(--glass-border);
      border-bottom-left-radius:4px; color:var(--text-hi);
    }
    .msg.me{
      background:linear-gradient(135deg, var(--accent), var(--accent-2));
      color:var(--ink); font-weight:480; border-bottom-right-radius:4px;
    }
    .msg.deleted{
      opacity:0.65; font-style:italic; background:rgba(255,255,255,0.03) !important;
      border:1px dashed rgba(255,255,255,0.15) !important; color:var(--text-lo) !important;
    }

    .msg-footer{ display:flex; align-items:center; justify-content:flex-end; gap:4px; margin-top:3px; font-size:10px; opacity:.85; }
    .msg-footer .time{ opacity:.8; font-weight:400; }
    .msg-footer .edited-tag{ font-size:9.5px; opacity:0.75; font-style:italic; }

    .msg-actions{
      display:none; align-items:center; gap:2px; padding:2px; border-radius:8px;
      background:rgba(20,20,24,0.9); border:1px solid var(--glass-border);
      box-shadow:0 4px 12px rgba(0,0,0,0.3); z-index:5;
    }
    .msg-row:hover .msg-actions{ display:flex; }
    .msg-action-btn{
      background:transparent; border:none; color:var(--text-lo); padding:4px; border-radius:6px;
      cursor:pointer; display:flex; align-items:center; justify-content:center; transition:color .15s ease, background .15s ease;
    }
    .msg-action-btn:hover{ color:var(--text-hi); background:rgba(255,255,255,0.1); }
    .msg-action-btn.delete:hover{ color:#ff7a7a; background:rgba(255,74,74,0.15); }

    .inline-edit-box{ width:100%; display:flex; flex-direction:column; gap:6px; margin:4px 0; }
    .inline-edit-box textarea{
      width:100%; min-height:48px; max-height:120px; resize:none; padding:8px 10px;
      background:rgba(20,20,25,0.95); border:1px solid var(--accent); border-radius:10px;
      color:var(--text-hi); font-size:13px; outline:none; font-family:'Inter',sans-serif;
    }
    .inline-edit-actions{ display:flex; justify-content:flex-end; gap:6px; }
    .inline-edit-actions button{
      padding:4px 10px; border-radius:8px; font-size:11.5px; cursor:pointer; font-weight:600; border:none;
    }
    .btn-save-edit{ background:var(--accent); color:var(--ink); }
    .btn-cancel-edit{ background:rgba(255,255,255,0.1); color:var(--text-hi); }

    .msg-retry-banner{
      font-size:10.5px; color:#ff7a7a; display:flex; align-items:center; gap:4px; margin-top:2px;
    }
    .msg-retry-btn{
      background:none; border:none; color:#ff98a2; text-decoration:underline; cursor:pointer; font-size:10.5px; padding:0;
    }

    .typing-bar{
      padding:6px 16px; font-size:11.5px; color:var(--accent); display:flex; align-items:center; gap:8px;
      background:linear-gradient(90deg, rgba(255,152,162,0.06), transparent); animation:fadeIn .2s ease;
    }
    @keyframes fadeIn{ from{ opacity:0; transform:translateY(4px); } to{ opacity:1; transform:translateY(0); } }
    .typing-dots{ display:flex; gap:3px; }
    .typing-dots span{ width:4.5px; height:4.5px; border-radius:50%; background:var(--accent); animation:bounce 1.2s infinite ease-in-out; }
    .typing-dots span:nth-child(2){ animation-delay:.15s; }
    .typing-dots span:nth-child(3){ animation-delay:.3s; }
    @keyframes bounce{ 0%,60%,100%{ transform:translateY(0); opacity:.4; } 30%{ transform:translateY(-3.5px); opacity:1; } }

    .jump-btn{
      position:absolute; bottom:64px; right:20px; z-index:15;
      background:rgba(20,20,24,0.92); border:1px solid var(--accent); color:var(--accent);
      padding:6px 12px; border-radius:20px; font-size:11.5px; font-weight:600;
      display:flex; align-items:center; gap:5px; cursor:pointer; box-shadow:0 8px 24px rgba(0,0,0,0.5);
      backdrop-filter:blur(8px); transition:all .2s cubic-bezier(.16,1,.3,1); animation:pop-in .25s ease;
    }
    .jump-btn:hover{ transform:translateY(-2px); background:var(--accent); color:var(--ink); }

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
    .send-btn:disabled{ opacity:0.5; cursor:not-allowed; }
    .send-btn svg{ width:16px; height:16px; fill:var(--ink); }

    @media (max-width:480px){
      .cw-root .panel{ right:16px; left:16px; width:auto; bottom:96px; }
      .launcher{ right:20px; bottom:20px; }
    }
    @media (prefers-reduced-motion: reduce){
      .launcher, .msg, .typing-dots span{ animation:none !important; }
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

export function openDirectMessage({ userId, name, initial, avatarUrl, profilePicture }) {
  window.dispatchEvent(
    new CustomEvent('devconnect:open-chat', {
      detail: { userId, name, initial, avatarUrl: avatarUrl || profilePicture },
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
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [typingState, setTypingState] = useState({}); // { [chatId]: username }
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [chatPagination, setChatPagination] = useState({}); // { [chatId]: { page, hasMore } }

  const messagesRef = useRef(null);
  const panelRef = useRef(null);
  const textareaRef = useRef(null);
  const editInputRef = useRef(null);
  const currentChatIdRef = useRef(activeId);
  const isAutoScrollingRef = useRef(true);
  const typingTimeoutRef = useRef(null);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  const active = conversations.find((c) => c.id === activeId || c._id === activeId) || null;
  const [searchQuery, setSearchQuery] = useState('');

  // Sorted by most recent message / activity timestamp (WhatsApp-style)
  const sortedConversations = useMemo(() => {
    const getTimestamp = (c) => {
      if (c.lastActivity) {
        const t = new Date(c.lastActivity).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (c.updatedAt) {
        const t = new Date(c.updatedAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      const msgs = c.messages || [];
      const last = msgs[msgs.length - 1];
      if (last?.createdAt) {
        const t = new Date(last.createdAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (c.createdAt) {
        const t = new Date(c.createdAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      return 0;
    };

    const list = [...conversations].sort((a, b) => getTimestamp(b) - getTimestamp(a));

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((c) =>
      c.name?.toLowerCase().includes(q) ||
      c.lastMessageText?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  useEffect(() => {
    currentChatIdRef.current = activeId;
  }, [activeId]);

  // Handle outside click & escape
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

  // Focus textarea when entering chat view
  useEffect(() => {
    if (view === 'chat' && open) {
      const t1 = setTimeout(() => textareaRef.current?.focus(), 50);
      const t2 = setTimeout(() => textareaRef.current?.focus(), 200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [view, open, activeId]);

  // Auto-scroll to bottom if near bottom
  const scrollToBottom = useCallback((smooth = false) => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
      setShowJumpButton(false);
    }
  }, []);

  // Monitor scroll for jump button and auto-scroll behavior
  const handleScroll = useCallback(() => {
    if (!messagesRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom < 80;
    isAutoScrollingRef.current = isNearBottom;
    setShowJumpButton(distanceFromBottom > 140);
  }, []);

  // Scroll to bottom on opening a chat or when messages change (if was near bottom)
  useEffect(() => {
    if (view === 'chat' && active) {
      if (isAutoScrollingRef.current) {
        scrollToBottom(false);
      }
    }
  }, [active?.messages?.length, view, scrollToBottom]);

  // Mark chat as read helper
  const markActiveChatAsRead = useCallback((chatId) => {
    if (!chatId || !user?._id) return;
    const socket = connectSocket();
    socket.emit('chat:read', chatId);
    chatApi.markChatAsRead(chatId).catch(() => {});
  }, [user?._id]);

  // Fetch initial messages for a chat
  const loadChatMessages = useCallback(async (chatId, page = 1) => {
    if (!chatId || typeof chatId !== 'string' || chatId.length !== 24) return;
    try {
      const res = await chatApi.getMessages(chatId, page, 30);
      const list = Array.isArray(res) ? res : res?.messages || [];
      const pagination = res?.pagination || { page, hasMore: false };

      setChatPagination((prev) => ({
        ...prev,
        [chatId]: { page: pagination.page, hasMore: pagination.hasMore },
      }));

      const formatted = list.map((m) => {
        const isFromMe = (m.sender?._id || m.sender) === user?._id;
        return {
          _id: m._id || m.id,
          id: m._id || m.id,
          from: isFromMe ? 'me' : 'them',
          sender: m.sender || {},
          content: m.content || '',
          text: m.content || '',
          time: formatMessageTime(m.createdAt),
          createdAt: m.createdAt || new Date().toISOString(),
          isDeleted: Boolean(m.isDeleted),
          edited: Boolean(m.edited),
          editedAt: m.editedAt,
          readBy: m.readBy || [],
          deliveredTo: m.deliveredTo || [],
          status: 'sent',
        };
      });

      setConversations((all) =>
        all.map((c) => {
          if (c.id === chatId || c._id === chatId) {
            if (page === 1) {
              return { ...c, messages: formatted, unread: 0 };
            } else {
              // Prepend older messages while deduplicating
              const existingIds = new Set((c.messages || []).map((m) => m._id));
              const newUnique = formatted.filter((m) => !existingIds.has(m._id));
              return { ...c, messages: [...newUnique, ...(c.messages || [])] };
            }
          }
          return c;
        })
      );
    } catch (err) {
      console.warn('Failed to load chat messages:', err);
    }
  }, [user?._id, setConversations]);

  // Load earlier messages (pagination)
  const handleLoadEarlier = async () => {
    if (!active?.id || loadingEarlier) return;
    const currentPaging = chatPagination[active.id] || { page: 1, hasMore: false };
    if (!currentPaging.hasMore) return;

    setLoadingEarlier(true);
    const container = messagesRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;

    await loadChatMessages(active.id, currentPaging.page + 1);

    setLoadingEarlier(false);
    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = container.scrollHeight - prevScrollHeight;
      }
    });
  };

  // Switch to a chat thread
  const openChat = (id) => {
    const prevId = currentChatIdRef.current;
    const socket = connectSocket();

    if (prevId && prevId !== id && prevId.length === 24) {
      socket.emit('chat:leave', prevId);
    }

    setConversations((list) => list.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    setActiveId(id);
    setView('chat');
    isAutoScrollingRef.current = true;
    setTimeout(() => textareaRef.current?.focus(), 150);

    const targetConv = conversations.find((c) => c.id === id || c._id === id);
    if (targetConv && !targetConv.isGroup && targetConv.otherUserId) {
      socket.emit('presence:check', { userId: targetConv.otherUserId }, (res) => {
        if (res?.ok) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === id || c.otherUserId === targetConv.otherUserId
                ? { ...c, online: Boolean(res.isOnline), lastSeen: res.lastSeen || c.lastSeen }
                : c
            )
          );
        }
      });
    }

    if (id && id.length === 24) {
      socket.emit('chat:join', id);
      markActiveChatAsRead(id);
      loadChatMessages(id, 1).then(() => {
        setTimeout(() => scrollToBottom(false), 80);
      });
    }
  };

  const backToList = () => {
    setView('inbox');
    setEditingMessageId(null);
  };

  // Socket setup and real-time event listeners
  useEffect(() => {
    if (!user?._id) return;
    const socket = connectSocket();

    const handleIncomingMessage = (msg) => {
      if (!msg) return;
      const chatId = msg.chatId || msg.chat?._id || msg.chat || msg.conversationId;
      const isFromMe = (msg.sender?._id || msg.sender) === user._id;
      const activeCurrentId = currentChatIdRef.current;
      const isViewingActive = activeCurrentId === chatId;

      const newMsg = {
        _id: msg._id || msg.id,
        id: msg._id || msg.id,
        from: isFromMe ? 'me' : 'them',
        sender: msg.sender || {},
        content: msg.content || '',
        text: msg.content || '',
        time: formatMessageTime(msg.createdAt),
        createdAt: msg.createdAt || new Date().toISOString(),
        isDeleted: Boolean(msg.isDeleted),
        edited: Boolean(msg.edited),
        editedAt: msg.editedAt,
        readBy: msg.readBy || (isFromMe ? [user._id] : []),
        deliveredTo: msg.deliveredTo || [],
        status: 'sent',
      };

      setConversations((all) => {
        let updatedTarget = null;
        const rest = [];

        for (const c of all) {
          const matches = c.id === chatId || c._id === chatId;
          if (matches) {
            const currentList = c.messages || [];
            let reconciled = false;
            const updated = currentList.map((m) => {
              if (m._id === newMsg._id) return { ...m, ...newMsg };
              if (
                isFromMe &&
                m.status === 'sending' &&
                (m.content === newMsg.content || m.text === newMsg.content)
              ) {
                reconciled = true;
                return { ...newMsg, tempId: m._id };
              }
              return m;
            });

            if (!reconciled && !currentList.some((m) => m._id === newMsg._id)) {
              updated.push(newMsg);
            }

            updatedTarget = {
              ...c,
              unread: (isViewingActive || isFromMe) ? 0 : (c.unread || 0) + 1,
              lastMessageText: newMsg.content,
              lastMessageTime: newMsg.time,
              lastMessageFrom: isFromMe ? 'me' : 'them',
              lastActivity: newMsg.createdAt,
              updatedAt: newMsg.createdAt,
              messages: updated,
            };
          } else {
            rest.push(c);
          }
        }

        if (updatedTarget) {
          return [updatedTarget, ...rest];
        }
        return all;
      });

      if (isViewingActive) {
        socket.emit('chat:read', chatId);
        if (isAutoScrollingRef.current) {
          setTimeout(() => scrollToBottom(true), 60);
        }
      }
    };

    const handleMessageEdited = (updatedMsg) => {
      if (!updatedMsg) return;
      const msgId = updatedMsg._id || updatedMsg.id;
      const chatId = updatedMsg.chatId || updatedMsg.chat?._id || updatedMsg.chat;

      setConversations((all) =>
        all.map((c) => {
          if (c.id === chatId || c._id === chatId) {
            return {
              ...c,
              messages: (c.messages || []).map((m) =>
                m._id === msgId || m.id === msgId
                  ? {
                      ...m,
                      content: updatedMsg.content,
                      text: updatedMsg.content,
                      edited: true,
                      editedAt: updatedMsg.editedAt || new Date().toISOString(),
                    }
                  : m
              ),
            };
          }
          return c;
        })
      );
    };

    const handleMessageDeleted = ({ messageId, chatId }) => {
      if (!messageId) return;
      setConversations((all) =>
        all.map((c) => {
          if (c.id === chatId || c._id === chatId) {
            return {
              ...c,
              messages: (c.messages || []).map((m) =>
                m._id === messageId || m.id === messageId
                  ? { ...m, isDeleted: true, content: '', text: '' }
                  : m
              ),
            };
          }
          return c;
        })
      );
    };

    const handleMessageRead = ({ chatId, userId }) => {
      if (!chatId || !userId) return;
      setConversations((all) =>
        all.map((c) => {
          if (c.id === chatId || c._id === chatId) {
            return {
              ...c,
              messages: (c.messages || []).map((m) => {
                if (m.from === 'me') {
                  const currentReadBy = Array.isArray(m.readBy) ? m.readBy : [];
                  if (!currentReadBy.includes(userId)) {
                    return { ...m, readBy: [...currentReadBy, userId] };
                  }
                }
                return m;
              }),
            };
          }
          return c;
        })
      );
    };

    const handleTypingUpdate = ({ chatId, userId, username, typing }) => {
      if (userId === user._id) return;
      setTypingState((prev) => ({
        ...prev,
        [chatId]: typing ? username || 'Someone' : null,
      }));
    };

    const handleReconnect = () => {
      const activeCurrentId = currentChatIdRef.current;
      if (activeCurrentId && activeCurrentId.length === 24) {
        socket.emit('chat:join', activeCurrentId);
        loadChatMessages(activeCurrentId, 1);
      }
    };

    socket.on('message:new', handleIncomingMessage);
    socket.on('message:edited', handleMessageEdited);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('message:read', handleMessageRead);
    socket.on('typing:update', handleTypingUpdate);
    socket.on('reconnect', handleReconnect);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('message:new', handleIncomingMessage);
      socket.off('message:edited', handleMessageEdited);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('message:read', handleMessageRead);
      socket.off('typing:update', handleTypingUpdate);
      socket.off('reconnect', handleReconnect);
      socket.off('connect', handleReconnect);
    };
  }, [user?._id, setConversations, loadChatMessages, scrollToBottom]);

  // Composer typing notification emitter
  const handleComposerChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (!active?.id || !user?._id) return;
    const socket = connectSocket();
    socket.emit('typing:start', active.id);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', active.id);
    }, 1600);
  };

  // Send message implementation with optimistic temp ID & retry handling
  const sendMessage = (customContent = null, retryTempId = null) => {
    const text = (customContent !== null ? customContent : inputValue).trim();
    if (!text || !active) return;

    const socket = connectSocket();
    if (active.id && user?._id) {
      socket.emit('typing:stop', active.id);
    }
    if (customContent === null) {
      setInputValue('');
    }

    const tempId = retryTempId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const time = timeNow();
    const serverChatId = (active.isServerChat && active.id && active.id.length === 24)
      ? active.id
      : (active._id && typeof active._id === 'string' && active._id.length === 24)
      ? active._id
      : null;

    const optimisticMsg = {
      _id: tempId,
      id: tempId,
      from: 'me',
      sender: {
        _id: user?._id,
        name: user?.name,
        username: user?.username,
        profilePicture: user?.profilePicture,
      },
      content: text,
      text,
      time,
      createdAt: new Date().toISOString(),
      status: 'sending',
      isDeleted: false,
      edited: false,
      readBy: [user?._id],
    };

    setConversations((list) => {
      let updatedTarget = null;
      const rest = [];

      for (const c of list) {
        if (c.id === active.id) {
          const currentList = c.messages || [];
          const exists = currentList.some((m) => m._id === tempId);
          const updated = exists
            ? currentList.map((m) => (m._id === tempId ? { ...optimisticMsg, status: 'sending' } : m))
            : [...currentList, optimisticMsg];
          updatedTarget = {
            ...c,
            lastMessageText: text,
            lastMessageTime: time,
            lastMessageFrom: 'me',
            lastActivity: optimisticMsg.createdAt,
            updatedAt: optimisticMsg.createdAt,
            messages: updated,
          };
        } else {
          rest.push(c);
        }
      }

      return updatedTarget ? [updatedTarget, ...rest] : list;
    });

    if (serverChatId) {
      socket.emit('message:send', serverChatId, text, [], (res) => {
        if (res?.ok && res?.message) {
          const realMsg = res.message;
          setConversations((list) =>
            list.map((c) => {
              if (c.id === active.id) {
                return {
                  ...c,
                  messages: (c.messages || []).map((m) =>
                    m._id === tempId
                      ? {
                          ...m,
                          _id: realMsg._id,
                          id: realMsg._id,
                          createdAt: realMsg.createdAt,
                          status: 'sent',
                        }
                      : m
                  ),
                };
              }
              return c;
            })
          );
        } else {
          chatApi
            .sendMessage(serverChatId, text)
            .then((resDto) => {
              const realMsg = resDto?.message || resDto;
              setConversations((list) =>
                list.map((c) => {
                  if (c.id === active.id) {
                    return {
                      ...c,
                      messages: (c.messages || []).map((m) =>
                        m._id === tempId
                          ? {
                              ...m,
                              _id: realMsg._id || m._id,
                              status: 'sent',
                            }
                          : m
                      ),
                    };
                  }
                  return c;
                })
              );
            })
            .catch(() => {
              setConversations((list) =>
                list.map((c) => {
                  if (c.id === active.id) {
                    return {
                      ...c,
                      messages: (c.messages || []).map((m) =>
                        m._id === tempId ? { ...m, status: 'failed' } : m
                      ),
                    };
                  }
                  return c;
                })
              );
            });
        }
      });
    } else {
      setTimeout(() => {
        setConversations((list) =>
          list.map((c) =>
            c.id === active.id
              ? {
                  ...c,
                  messages: (c.messages || []).map((m) =>
                    m._id === tempId ? { ...m, status: 'sent' } : m
                  ),
                }
              : c
          )
        );
      }, 400);
    }

    scrollToBottom(true);
  };

  // Edit Message
  const handleStartEdit = (m) => {
    setEditingMessageId(m._id);
    setEditingContent(m.content || m.text || '');
    setTimeout(() => editInputRef.current?.focus(), 80);
  };

  const handleSaveEdit = async (messageId) => {
    const trimmed = editingContent.trim();
    if (!trimmed || !active?.id) return;

    setConversations((list) =>
      list.map((c) => {
        if (c.id === active.id) {
          return {
            ...c,
            messages: (c.messages || []).map((m) =>
              m._id === messageId
                ? { ...m, content: trimmed, text: trimmed, edited: true, editedAt: new Date().toISOString() }
                : m
            ),
          };
        }
        return c;
      })
    );
    setEditingMessageId(null);

    const socket = connectSocket();
    socket.emit('message:edit', { chatId: active.id, messageId, content: trimmed });
    chatApi.editMessage(active.id, messageId, trimmed).catch(() => {});
  };

  // Soft Delete Message
  const handleDeleteMessage = (m) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    const messageId = m._id;
    if (!messageId || !active?.id) return;

    setConversations((list) =>
      list.map((c) => {
        if (c.id === active.id) {
          return {
            ...c,
            messages: (c.messages || []).map((msg) =>
              msg._id === messageId ? { ...msg, isDeleted: true, content: '', text: '' } : msg
            ),
          };
        }
        return c;
      })
    );

    const socket = connectSocket();
    socket.emit('message:delete', { chatId: active.id, messageId });
    chatApi.deleteMessage(active.id, messageId).catch(() => {});
  };

  const canDeleteMessage = (m) => {
    if (!user?._id || m.isDeleted) return false;
    const isSender = m.from === 'me' || (m.sender?._id || m.sender) === user._id;
    if (isSender) return true;
    if (active?.leader === user._id || active?.groupAdmin === user._id) return true;
    if (Array.isArray(active?.admins) && active.admins.some((a) => (a._id || a) === user._id)) return true;
    return false;
  };

  const processedMessages = useMemo(() => {
    if (!active || !Array.isArray(active.messages)) return [];
    return active.messages.filter((m) => m && (m.content || m.text || m.isDeleted));
  }, [active]);

  const activeTypingUser = active?.id ? typingState[active.id] : null;
  const currentPaging = active?.id ? chatPagination[active.id] : null;

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
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="chat-list">
              {sortedConversations.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-lo)' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-hi)' }}>
                    {conversations.length === 0 ? 'No conversations yet' : 'No results found'}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
                    {conversations.length === 0
                      ? 'Connect with team members or start a direct message to begin chatting.'
                      : 'Try searching with a different name or message.'}
                  </p>
                </div>
              ) : (
                sortedConversations.map((conv) => {
                  const msgs = conv.messages || [];
                  const last = msgs[msgs.length - 1] || {
                    text: conv.lastMessageText || 'No messages yet',
                    time: conv.lastMessageTime || '',
                    from: conv.lastMessageFrom || '',
                  };
                  return (
                    <div className={`chat-item${conv.unread === 0 ? ' read' : ''}`} key={conv.id} onClick={() => openChat(conv.id)}>
                      <div
                        className={`avatar${conv.online ? ' online' : ''}`}
                        style={{
                          background: AVATAR_COLORS[conv.colorIdx] || AVATAR_COLORS[0],
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {conv.avatarUrl || conv.profilePicture ? (
                          <img
                            src={conv.avatarUrl || conv.profilePicture}
                            alt={conv.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : null}
                        <span
                          style={{
                            display: conv.avatarUrl || conv.profilePicture ? 'none' : 'flex',
                            width: '100%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {conv.initial}
                        </span>
                      </div>
                      <div className="info">
                        <div className="row1">
                          <span className="name">{conv.name}</span>
                          <span className="time">{last.time || ''}</span>
                        </div>
                        <div className="row2">
                          <span className="preview">
                            {last.from === 'me' ? 'You: ' : ''}
                            {formatMessageText(last.content || last.text)}
                          </span>
                          {conv.unread > 0 && <span className="unread-pill tabular">{conv.unread}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
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
                  <div
                    className={`avatar${active.online ? ' online' : ''}`}
                    style={{
                      background: AVATAR_COLORS[active.colorIdx],
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {active.avatarUrl || active.profilePicture ? (
                      <img
                        src={active.avatarUrl || active.profilePicture}
                        alt={active.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextSibling) {
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : null}
                    <span
                      style={{
                        display: active.avatarUrl || active.profilePicture ? 'none' : 'flex',
                        width: '100%',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {active.initial}
                    </span>
                  </div>
                  <div className="who">
                    <div className="name">{active.name}</div>
                    <div
                      className="status"
                      style={{
                        color: activeTypingUser
                          ? 'var(--accent, #ff98a2)'
                          : active.online
                          ? '#22c55e'
                          : 'var(--text-lo)',
                        fontWeight: activeTypingUser || active.online ? 500 : 400,
                      }}
                    >
                      {formatWhatsAppStatus(active, Boolean(activeTypingUser))}
                    </div>
                  </div>
                </>
              )}
              <FullscreenButton fullscreen={fullscreen} onClick={() => setFullscreen((f) => !f)} />
              <button className="close-btn" aria-label="Close" onClick={() => setOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>

            <div className="messages" ref={messagesRef} onScroll={handleScroll}>
              {currentPaging?.hasMore && (
                <div className="load-earlier-container">
                  <button className="load-earlier-btn" onClick={handleLoadEarlier} disabled={loadingEarlier}>
                    {loadingEarlier ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" /> Loading earlier...
                      </>
                    ) : (
                      'Load earlier messages'
                    )}
                  </button>
                </div>
              )}

              {processedMessages.map((m, index) => {
                const prev = processedMessages[index - 1];
                const currentDateLabel = getDateLabel(m.createdAt);
                const prevDateLabel = prev ? getDateLabel(prev.createdAt) : null;
                const showDateDivider = currentDateLabel !== prevDateLabel;

                const isMe = m.from === 'me';
                const isEditing = editingMessageId === m._id;
                const isDeleted = Boolean(m.isDeleted);
                const isSeen = Array.isArray(m.readBy) && m.readBy.some((id) => id && id !== user?._id);

                return (
                  <React.Fragment key={m._id || m.id || index}>
                    {showDateDivider && <div className="day-divider">{currentDateLabel}</div>}

                    <div className={`msg-wrapper ${isMe ? 'me' : 'them'}`}>
                      {isEditing ? (
                        <div className="inline-edit-box">
                          <textarea
                            ref={editInputRef}
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEdit(m._id);
                              } else if (e.key === 'Escape') {
                                setEditingMessageId(null);
                              }
                            }}
                          />
                          <div className="inline-edit-actions">
                            <button className="btn-cancel-edit" onClick={() => setEditingMessageId(null)}>
                              Cancel
                            </button>
                            <button className="btn-save-edit" onClick={() => handleSaveEdit(m._id)}>
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="msg-row">
                          {!isMe && (
                            <div
                              className="msg-avatar"
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                flexShrink: 0,
                                alignSelf: 'flex-end',
                                marginBottom: '2px',
                                background: AVATAR_COLORS[active?.colorIdx || 0],
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#0a0a0a',
                                position: 'relative',
                              }}
                              title={active?.name || 'Developer'}
                            >
                              {m.sender?.profilePicture || active?.avatarUrl || active?.profilePicture ? (
                                <img
                                  src={m.sender?.profilePicture || active?.avatarUrl || active?.profilePicture}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextSibling) {
                                      e.currentTarget.nextSibling.style.display = 'flex';
                                    }
                                  }}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                              ) : null}
                              <span
                                style={{
                                  display: m.sender?.profilePicture || active?.avatarUrl || active?.profilePicture ? 'none' : 'flex',
                                  width: '100%',
                                  height: '100%',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {m.sender?.name ? m.sender.name[0].toUpperCase() : (active?.initial || 'D')}
                              </span>
                            </div>
                          )}
                          <div className={`msg ${isMe ? 'me' : 'them'}${isDeleted ? ' deleted' : ''}`}>
                            {isDeleted ? (
                              <em>This message was deleted</em>
                            ) : (
                              formatMessageText(m.content || m.text)
                            )}

                            <div className="msg-footer">
                              <span className="time">{m.time || formatMessageTime(m.createdAt)}</span>
                              {m.edited && !isDeleted && <span className="edited-tag">(edited)</span>}
                              {isMe && !isDeleted && (
                                <span title={m.status === 'sending' ? 'Sending' : isSeen ? 'Seen' : 'Delivered'}>
                                  {m.status === 'sending' ? (
                                    <Clock size={11} style={{ opacity: 0.6 }} />
                                  ) : isSeen ? (
                                    <CheckCheck size={13} style={{ color: '#ff98a2', strokeWidth: 2.4 }} />
                                  ) : (
                                    <Check size={13} style={{ opacity: 0.7, strokeWidth: 2 }} />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {!isDeleted && m.status !== 'sending' && (
                            <div className="msg-actions">
                              {isMe && (
                                <button
                                  className="msg-action-btn"
                                  title="Edit message"
                                  onClick={() => handleStartEdit(m)}
                                >
                                  <Edit2 size={12} />
                                </button>
                              )}
                              {canDeleteMessage(m) && (
                                <button
                                  className="msg-action-btn delete"
                                  title="Delete message"
                                  onClick={() => handleDeleteMessage(m)}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {m.status === 'failed' && (
                        <div className="msg-retry-banner">
                          <AlertCircle size={11} /> Failed to send.
                          <button className="msg-retry-btn" onClick={() => sendMessage(m.content || m.text, m._id)}>
                            Retry
                          </button>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {showJumpButton && (
              <button className="jump-btn" onClick={() => scrollToBottom(true)}>
                <ArrowDown size={13} /> Jump to latest
              </button>
            )}

            {activeTypingUser && (
              <div className="typing-bar">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
                <span>{activeTypingUser} is typing...</span>
              </div>
            )}

            <div className="composer">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Type a message..."
                value={inputValue}
                onChange={handleComposerChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                className="send-btn"
                aria-label="Send"
                disabled={!inputValue.trim()}
                onClick={() => sendMessage()}
              >
                <svg viewBox="0 0 24 24"><path d="M3 20l18-8L3 4v6l12 2-12 2z" /></svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}