import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { chatApi } from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

export const AVATAR_COLORS = [
  'linear-gradient(145deg, #ff98a2, #e17a92)',
  'linear-gradient(145deg, #f0a3ac, #c97f8c)',
  'linear-gradient(145deg, #ffb59a, #d98a6f)',
  'linear-gradient(145deg, #b39ad6, #7d6f9c)',
  'linear-gradient(145deg, #9fc4c0, #5f8f89)',
];

const INITIAL_CONVERSATIONS = [];

function timeNow() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const ChatUIContext = createContext(null);

export function ChatUIProvider({ children }) {
  const { user } = useAuth() || {};
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [view, setView] = useState('inbox'); // 'inbox' | 'chat'
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = useState(null);

  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Sync chats from backend on login
  useEffect(() => {
    if (user?._id) {
      chatApi
        .getMyChats()
        .then((res) => {
          const serverChats = Array.isArray(res) ? res : res?.chats || [];
          if (serverChats.length > 0) {
            const mapped = serverChats.map((c, idx) => {
              const other = c.participants?.find((p) => p._id !== user._id) || c.participants?.[0] || {};
              const name = c.isGroup ? c.name : other.name || 'Chat Member';
              const hasLastMsg = !!c.lastMessage?.text;
              const lastMsg = c.lastMessage?.text || 'No messages yet';
              const lastTime = c.lastMessage?.sentAt || c.lastMessage?.timestamp
                ? new Date(c.lastMessage.sentAt || c.lastMessage.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : 'Recent';
              const isFromMe = (c.lastMessage?.sender?._id || c.lastMessage?.sender) === user._id;
              return {
                id: c._id,
                _id: c._id,
                team: c.team,
                isGroup: Boolean(c.isGroup),
                leader: c.leader,
                groupAdmin: c.groupAdmin,
                admins: c.admins || [],
                isServerChat: true,
                name,
                initial: chatInitial,
                online: !!other.lastSeen && Date.now() - new Date(other.lastSeen).getTime() < 300000,
                colorIdx: idx % AVATAR_COLORS.length,
                unread: c.unreadCount || 0,
                lastMessageText: lastMsg,
                lastMessageTime: lastTime,
                lastMessageFrom: isFromMe ? 'me' : 'them',
                messages: hasLastMsg
                  ? [
                      {
                        _id: `last_${c._id}`,
                        from: isFromMe ? 'me' : 'them',
                        text: lastMsg,
                        content: lastMsg,
                        time: lastTime,
                        createdAt: c.lastMessage?.sentAt || new Date().toISOString(),
                      },
                    ]
                  : [],
              };
            });
            setConversations((prev) => {
              const combined = [...mapped];
              prev.forEach((p) => {
                if (!combined.some((item) => item.id === p.id)) combined.push(p);
              });
              return combined;
            });
          }
        })
        .catch(() => {});
    }
  }, [user?._id]);

  /**
   * openDirectChatWith:
   * 1. Calls GET /chats/direct/:userId to get or create the 1:1 chat.
   * 2. Immediately pops open the floating chat widget showing this thread directly with active text box.
   */
  const openDirectChatWith = useCallback(
    async (userId, targetInfo = {}) => {
      const { name = 'Developer', initial = 'D' } = targetInfo;
      const targetName = name;
      const targetInitial = initial || (targetName ? targetName[0].toUpperCase() : 'D');

      // Instantly open widget into chat thread view
      setOpen(true);
      setView('chat');

      // Check if already in conversations by userId / name
      const currentList = conversationsRef.current || [];
      const existing = currentList.find(
        (c) =>
          (userId && (c.id === userId || c._id === userId)) ||
          (targetName && c.name?.toLowerCase() === targetName.toLowerCase()) ||
          (targetName && targetName.toLowerCase().includes(c.name?.toLowerCase()))
      );

      const tempId = userId || `dm_${Date.now()}`;

      if (existing) {
        setActiveId(existing.id);
        setConversations((prev) => prev.map((c) => (c.id === existing.id ? { ...c, unread: 0 } : c)));
      } else {
        // Optimistically create and set active conversation immediately
        const optimisticConv = {
          id: tempId,
          _id: userId && userId.length === 24 ? userId : tempId,
          isServerChat: !!(userId && userId.length === 24),
          name: targetName,
          initial: targetInitial,
          online: true,
          colorIdx: Math.floor(Math.random() * AVATAR_COLORS.length),
          unread: 0,
          messages: [],
        };
        setConversations((prev) => [optimisticConv, ...prev]);
        setActiveId(tempId);
      }

      // If valid MongoDB ObjectId, call GET /chats/direct/:userId via chatApi
      if (userId && typeof userId === 'string' && userId.length === 24) {
        try {
          const res = await chatApi.getOrCreateDirectChat(userId);
          const chat = res?.chat || res;
          if (chat && chat._id) {
            const other = chat.participants?.find((p) => (p._id || p) !== user?._id) || { name: targetName, _id: userId };
            const chatName = other.name || targetName;
            const chatInitial = other.name ? other.name[0].toUpperCase() : targetInitial;

            // Fetch message history
            let msgsFormatted = [];
            try {
              const msgsRes = await chatApi.getMessages(chat._id);
              const list = Array.isArray(msgsRes) ? msgsRes : msgsRes?.messages || [];
              msgsFormatted = list.map((m) => ({
                from: m.sender?._id === user?._id || m.sender === user?._id ? 'me' : 'them',
                text: m.content || '',
                time: m.createdAt
                  ? new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : 'Now',
              }));
            } catch (_) {}

            const serverConv = {
              id: chat._id,
              _id: chat._id,
              isServerChat: true,
              name: chatName,
              initial: chatInitial,
              online: true,
              colorIdx: Math.floor(Math.random() * AVATAR_COLORS.length),
              unread: 0,
              messages: msgsFormatted,
            };

            setConversations((prev) => {
              const matches = (c) => c.id === chat._id || c.id === tempId || c._id === userId;
              if (prev.some(matches)) {
                return prev.map((c) => (matches(c) ? { ...c, ...serverConv, id: chat._id } : c));
              }
              return [serverConv, ...prev];
            });
            setActiveId((curr) => (curr === tempId || curr === userId || !curr ? chat._id : curr));
            return chat;
          }
        } catch (err) {
          console.warn('GET /chats/direct/:userId failed, using fallback thread:', err);
        }
      }
    },
    [user?._id]
  );

  /**
   * openGroupChat:
   * 1. Calls POST /chats/group with { name, participantIds, team, project } to get or create the group chat.
   * 2. Immediately pops open the floating chat widget showing this thread directly with active text box.
   */
  const openGroupChat = useCallback(
    async ({ teamId = null, projectId = null, name = 'Team Chat', participantIds = [] }) => {
      // Instantly open widget into chat thread view
      setOpen(true);
      setView('chat');

      const targetName = name || 'Team Chat';
      const targetInitial = targetName ? targetName[0].toUpperCase() : 'T';

      // Check if already in conversations by teamId, _id, or name
      const currentList = conversationsRef.current || [];
      const existing = currentList.find(
        (c) =>
          (teamId && (c.team === teamId || c.team?._id === teamId || c.id === `team_${teamId}`)) ||
          (c.name?.toLowerCase() === targetName.toLowerCase())
      );

      const tempId = teamId ? `team_${teamId}` : `group_${Date.now()}`;

      if (existing) {
        setActiveId(existing.id);
        setConversations((prev) => prev.map((c) => (c.id === existing.id ? { ...c, unread: 0 } : c)));
      } else {
        // Optimistically create and set active conversation immediately
        const optimisticConv = {
          id: tempId,
          _id: tempId,
          team: teamId,
          isGroup: true,
          name: targetName,
          initial: targetInitial,
          online: true,
          colorIdx: Math.floor(Math.random() * AVATAR_COLORS.length),
          unread: 0,
          messages: [],
        };
        setConversations((prev) => [optimisticConv, ...prev]);
        setActiveId(tempId);
      }

      try {
        const res = await chatApi.createGroupChat({
          name: targetName,
          participantIds,
          team: teamId,
          project: projectId,
        });
        const chat = res?.chat || res;
        if (chat && chat._id) {
          // Fetch message history
          let msgsFormatted = [];
          try {
            const msgsRes = await chatApi.getMessages(chat._id);
            const list = Array.isArray(msgsRes) ? msgsRes : msgsRes?.messages || [];
            msgsFormatted = list.map((m) => ({
              from: m.sender?._id === user?._id || m.sender === user?._id ? 'me' : 'them',
              text: m.content || '',
              time: m.createdAt
                ? new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : 'Now',
            }));
          } catch (_) {}

          const serverConv = {
            id: chat._id,
            _id: chat._id,
            team: teamId,
            isGroup: true,
            isServerChat: true,
            name: chat.name || targetName,
            initial: targetInitial,
            online: true,
            colorIdx: Math.floor(Math.random() * AVATAR_COLORS.length),
            unread: 0,
            messages: msgsFormatted,
          };

          setConversations((prev) => {
            const matches = (c) =>
              c.id === chat._id ||
              c.id === tempId ||
              (teamId && (c.team === teamId || c.team?._id === teamId || c.id === `team_${teamId}`));
            if (prev.some(matches)) {
              return prev.map((c) => (matches(c) ? { ...c, ...serverConv, id: chat._id } : c));
            }
            return [serverConv, ...prev];
          });
          setActiveId((curr) => (curr === tempId || !curr ? chat._id : curr));
          return chat;
        }
      } catch (err) {
        console.warn('POST /chats/group failed, using fallback thread:', err);
      }
    },
    [user?._id]
  );

  // Global event listener for 'devconnect:open-chat'
  useEffect(() => {
    const handleEvent = (e) => {
      const { userId, name, initial, openOnly, isGroup, teamId, participantIds } = e.detail || {};
      if (openOnly) {
        setOpen(true);
        return;
      }
      if (isGroup || teamId) {
        openGroupChat({ teamId, name, participantIds });
        return;
      }
      openDirectChatWith(userId, { name, initial });
    };

    window.addEventListener('devconnect:open-chat', handleEvent);
    return () => window.removeEventListener('devconnect:open-chat', handleEvent);
  }, [openDirectChatWith, openGroupChat]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  const value = {
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
    openDirectChatWith,
    openGroupChat,
    totalUnread,
  };

  return <ChatUIContext.Provider value={value}>{children}</ChatUIContext.Provider>;
}

export function useChatUI() {
  const context = useContext(ChatUIContext);
  if (!context) {
    throw new Error('useChatUI must be used within a ChatUIProvider');
  }
  return context;
}
