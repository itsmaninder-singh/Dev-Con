import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { chatApi } from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';
import { connectSocket } from '../lib/socket.js';

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
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const onlineUsersRef = useRef(onlineUserIds);
  useEffect(() => {
    onlineUsersRef.current = onlineUserIds;
  }, [onlineUserIds]);

  // Sync chats from backend on login
  useEffect(() => {
    if (user?._id) {
      chatApi
        .getMyChats()
        .then((res) => {
          const serverChats = Array.isArray(res) ? res : res?.chats || [];
          if (serverChats.length > 0) {
            const mapped = serverChats.map((c, idx) => {
              const other = c.participants?.find((p) => String(p._id || p.id) !== String(user._id)) || c.participants?.[0] || {};
              const name = c.isGroup ? (c.name || 'Group Chat') : (other.name || 'Chat Member');
              const chatInitial = (name || 'C').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'C';
              const avatarUrl = c.isGroup ? '' : (other.profilePicture || other.avatarUrl || '');
              const otherUserId = c.isGroup ? null : (other._id ? String(other._id) : null);
              const isOnline = otherUserId ? onlineUsersRef.current.has(otherUserId) : false;
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
                otherUserId,
                lastSeen: other.lastSeen || null,
                name,
                initial: chatInitial,
                avatarUrl,
                profilePicture: avatarUrl,
                online: other.isOnline !== undefined ? Boolean(other.isOnline) : isOnline,
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

  // Real-time Presence Listeners (WhatsApp-style Online/Offline tracking)
  useEffect(() => {
    if (!user?._id) return;
    const socket = connectSocket();

    const handleInitialPresence = ({ onlineUserIds: list }) => {
      const set = new Set((list || []).map(String));
      setOnlineUserIds(set);
      setConversations((prev) =>
        prev.map((c) => {
          if (!c.isGroup && c.otherUserId) {
            return { ...c, online: set.has(String(c.otherUserId)) };
          }
          return c;
        })
      );
    };

    const handleUserOnline = ({ userId }) => {
      if (!userId) return;
      const uid = String(userId);
      setOnlineUserIds((prev) => new Set([...prev, uid]));
      setConversations((prev) =>
        prev.map((c) => {
          if (!c.isGroup && c.otherUserId && String(c.otherUserId) === uid) {
            return { ...c, online: true };
          }
          return c;
        })
      );
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      if (!userId) return;
      const uid = String(userId);
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });
      setConversations((prev) =>
        prev.map((c) => {
          if (!c.isGroup && c.otherUserId && String(c.otherUserId) === uid) {
            return {
              ...c,
              online: false,
              lastSeen: lastSeen || new Date().toISOString(),
            };
          }
          return c;
        })
      );
    };

    socket.on('presence:initial', handleInitialPresence);
    socket.on('presence:online', handleUserOnline);
    socket.on('presence:offline', handleUserOffline);

    return () => {
      socket.off('presence:initial', handleInitialPresence);
      socket.off('presence:online', handleUserOnline);
      socket.off('presence:offline', handleUserOffline);
    };
  }, [user?._id]);

  /**
   * openDirectChatWith:
   * 1. Calls GET /chats/direct/:userId to get or create the 1:1 chat.
   * 2. Immediately pops open the floating chat widget showing this thread directly with active text box.
   */
  const openDirectChatWith = useCallback(
    async (userId, targetInfo = {}) => {
      const { name = 'Developer', initial = 'D', avatarUrl = '', profilePicture = '' } = targetInfo;
      const targetName = name;
      const targetInitial = initial || (targetName ? targetName[0].toUpperCase() : 'D');
      const targetAvatar = avatarUrl || profilePicture || '';

      // Instantly open widget into chat thread view
      setOpen(true);
      setView('chat');

      // Extract 24-character string ID if object was passed
      const cleanUserId = typeof userId === 'object' && userId !== null
        ? String(userId._id || userId.id || '')
        : String(userId || '').trim();
      const validUserId = cleanUserId.length === 24 ? cleanUserId : null;

      // Check if already in conversations by userId / name
      const currentList = conversationsRef.current || [];
      const existing = currentList.find(
        (c) =>
          (cleanUserId && (c.id === cleanUserId || c._id === cleanUserId)) ||
          (targetName && c.name?.toLowerCase() === targetName.toLowerCase()) ||
          (targetName && targetName.toLowerCase().includes(c.name?.toLowerCase()))
      );

      const tempId = validUserId || (cleanUserId ? `dm_${cleanUserId}` : `dm_${Date.now()}`);

      if (existing) {
        setActiveId(existing.id);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === existing.id
              ? {
                  ...c,
                  unread: 0,
                  avatarUrl: c.avatarUrl || targetAvatar || '',
                  profilePicture: c.profilePicture || targetAvatar || '',
                }
              : c
          )
        );
      } else {
        // Optimistically create and set active conversation immediately
        const isOnline = Boolean(validUserId && onlineUsersRef.current.has(validUserId));
        const optimisticConv = {
          id: tempId,
          _id: validUserId || tempId,
          isServerChat: !!validUserId,
          otherUserId: validUserId,
          lastSeen: targetInfo.lastSeen || null,
          name: targetName,
          initial: targetInitial,
          avatarUrl: targetAvatar,
          profilePicture: targetAvatar,
          online: isOnline,
          colorIdx: Math.floor(Math.random() * AVATAR_COLORS.length),
          unread: 0,
          messages: [],
        };
        setConversations((prev) => [optimisticConv, ...prev]);
        setActiveId(tempId);
      }

      // If valid MongoDB ObjectId, call GET /chats/direct/:userId via chatApi
      if (validUserId) {
        try {
          const res = await chatApi.getOrCreateDirectChat(validUserId);
          const chat = res?.chat || res;
          if (chat && chat._id) {
            const other = chat.participants?.find((p) => String(p._id || p) !== String(user?._id)) || { name: targetName, _id: validUserId };
            const chatName = other.name || targetName;
            const chatInitial = other.name ? other.name[0].toUpperCase() : targetInitial;
            const otherId = other._id ? String(other._id) : validUserId;
            const isOtherOnline = other.isOnline !== undefined
              ? Boolean(other.isOnline)
              : (otherId ? onlineUsersRef.current.has(otherId) : false);
            const chatAvatar = other.profilePicture || other.avatarUrl || targetAvatar || '';

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
              otherUserId: otherId,
              lastSeen: other.lastSeen || targetInfo.lastSeen || null,
              name: chatName,
              initial: chatInitial,
              avatarUrl: chatAvatar,
              profilePicture: chatAvatar,
              online: isOtherOnline,
              colorIdx: Math.floor(Math.random() * AVATAR_COLORS.length),
              unread: 0,
              messages: msgsFormatted,
            };

            if (!isOtherOnline && validUserId && !other.lastSeen) {
              const socket = connectSocket();
              socket.emit('presence:check', { userId: validUserId }, (checkRes) => {
                if (checkRes?.ok) {
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === chat._id || c.otherUserId === validUserId
                        ? {
                            ...c,
                            online: Boolean(checkRes.isOnline),
                            lastSeen: checkRes.lastSeen || c.lastSeen,
                          }
                        : c
                    )
                  );
                }
              });
            }

            setConversations((prev) => {
              const matches = (c) =>
                c.id === chat._id ||
                c.id === tempId ||
                c._id === validUserId ||
                (targetName && c.name?.toLowerCase() === targetName.toLowerCase());
              if (prev.some(matches)) {
                return prev.map((c) => (matches(c) ? { ...c, ...serverConv, id: chat._id } : c));
              }
              return [serverConv, ...prev];
            });
            setActiveId((curr) => (curr === tempId || curr === validUserId || !curr ? chat._id : curr));
            return chat;
          }
        } catch (err) {
          console.warn('GET /chats/direct/:userId failed, using fallback thread:', err);
          if (targetInfo.throwOnError) {
            throw err;
          }
        }
      } else if (targetInfo.throwOnError) {
        throw new Error('Invalid user ID to message');
      }

      return existing || null;
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
      const { userId, name, initial, avatarUrl, profilePicture, openOnly, isGroup, teamId, participantIds } = e.detail || {};
      if (openOnly) {
        setOpen(true);
        return;
      }
      if (isGroup || teamId) {
        openGroupChat({ teamId, name, participantIds });
        return;
      }
      openDirectChatWith(userId, { name, initial, avatarUrl: avatarUrl || profilePicture });
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
