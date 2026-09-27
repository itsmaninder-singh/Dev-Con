import jwt from "jsonwebtoken";
import xss from "xss";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { evaluateSendPermission } from "../utils/chatGuard.js";
import { canSendInGroup } from "../utils/chatPermission.js";
import { isBlocked } from "../utils/blockGuard.js";
import { notifyForNewMessage, toMessageDTO } from "../controller/chat.controller.js";
import { encryptText } from "../utils/crypto.js";
import redisClient from "../config/redis.js";

const MAX_MESSAGES = 10;
const WINDOW_SECONDS = 10;
const isRateLimited = async (userId) => {
  const key = `ratelimit:msg:${userId}`;
  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, WINDOW_SECONDS);
  }
  return count > MAX_MESSAGES;
};

const chatListKey = (userId) => `chatlist:${userId}`;
const invalidateChatCaches = async (chat) => {
  const keys = chat.participants.map((p) => chatListKey(p.toString()));
  keys.push(`messages:${chat._id.toString()}:p1:l30`);
  if (keys.length) await redisClient.del(keys);
};
const roomCodeState = {};

const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
          socket.user = user;
          return next();
        }
        return next(new Error("Authentication error: User not found"));
      } catch (jwtErr) {
        return next(new Error("Authentication error: Invalid or expired token"));
      }
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`socket-con established : ${userId}`);

    socket.join(userId);
    redisClient.sAdd("online_users", userId);
    io.emit("presence:online", { userId });

    // Send initial list of all currently online user IDs to the connected client (verified live)
    (async () => {
      try {
        const rawList = await redisClient.sMembers("online_users");
        const trulyOnline = [];
        for (const uid of (rawList || [])) {
          const live = await io.in(uid).fetchSockets();
          if (live.length > 0) {
            trulyOnline.push(uid);
          } else {
            await redisClient.sRem("online_users", uid);
          }
        }
        socket.emit("presence:initial", { onlineUserIds: trulyOnline });
      } catch (err) {
        console.warn("[socket] Failed to fetch online users:", err.message);
      }
    })();

    socket.on("presence:check", async ({ userId: targetUserId }, callback) => {
      try {
        if (!targetUserId) return callback?.({ ok: false, error: "Missing userId" });
        const cleanId = String(targetUserId);

        // Verify with live sockets in room
        const liveSockets = await io.in(cleanId).fetchSockets();
        const isOnline = liveSockets.length > 0;

        if (!isOnline) {
          await redisClient.sRem("online_users", cleanId);
        } else {
          await redisClient.sAdd("online_users", cleanId);
        }

        let lastSeen = null;
        if (!isOnline) {
          const u = await User.findById(cleanId).select("lastSeen");
          lastSeen = u?.lastSeen ? new Date(u.lastSeen).toISOString() : null;
        }
        callback?.({ ok: true, userId: cleanId, isOnline, lastSeen });
      } catch (err) {
        callback?.({ ok: false, error: err.message });
      }
    });

    socket.on("chat:join", async (chatId, callback) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return callback?.({ ok: false, error: "chat not found" });
        const isParticipant = chat.participants.some(
          (p) => p.toString() === userId,
        );
        if (!isParticipant) {
          return callback?.({ ok: false, error: "Not a participant" });
        }
        socket.join(chatId);
        const result = await Message.updateMany(
          {
            chat: chatId,
            sender: { $ne: socket.user._id },
            deliveredTo: { $ne: socket.user._id },
          },
          {
            $addToSet: { deliveredTo: socket.user._id },
          },
        );
        if (result.modifiedCount > 0) {
          io.to(chatId).emit("message:delivered", { chatId, userId });
        }
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, error: "Server error" });
      }
    });

    socket.on("chat:read", async (chatId, callback) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
          return callback?.({ ok: false, error: "chat not found" });
        }

        const isParticipant = chat.participants.some(
          (p) => p.toString() === userId,
        );
        if (!isParticipant) {
          return callback?.({ ok: false, error: "not a participant" });
        }

        const result = await Message.updateMany(
          {
            chat: chatId,
            sender: { $ne: socket.user._id },
            readBy: { $ne: socket.user._id },
          },
          {
            $addToSet: {
              readBy: socket.user._id,
              deliveredTo: socket.user._id,
            },
          },
        );
        if (result.modifiedCount > 0) {
          await invalidateChatCaches(chat);
          io.to(chatId).emit("message:read", { chatId, userId });
        }
        callback?.({ ok: true, modifiedCount: result.modifiedCount });
      } catch (err) {
        callback?.({ ok: false, error: "Server error" });
      }
    });

    socket.on(
      "message:send",
      async (chatId, content, mentions = [], callback) => {
        try {
          if (await isRateLimited(userId)) {
            return callback?.({
              ok: false,
              error: "Slow Down - too many message at once",
            });
          }
          if (!content || !content.trim()) {
            return callback?.({ ok: false, error: "Message can not be empty" });
          }
          if (content.length > 2000) {
            return callback?.({ ok: false, error: "Message too long" });
          }
          const chat = await Chat.findById(chatId);

          if (!chat) return callback?.({ ok: false, error: " chat not found" });
          const isParticipant = chat.participants.some(
            (p) => p.toString() === userId,
          );
          if (!isParticipant) {
            return callback?.({ ok: false, error: "Not a participant" });
          }
          if (chat.isGroup) {
            if (!canSendInGroup(chat, socket.user._id)) {
              return callback?.({
                ok: false,
                error: "Only the leader/admins can send messages right now",
              });
            }
          } else {
            const otherId = chat.participants.find(
              (p) => p.toString() !== userId,
            );
            if (otherId && (await isBlocked(socket.user._id, otherId))) {
              return callback?.({
                ok: false,
                error: "This message could not be sent",
              });
            }
          }
          const permission = evaluateSendPermission(chat, socket.user._id);
          if (!permission.allowed) {
            return callback?.({ ok: false, error: permission.reason });
          }
          const clean = xss(content.trim());
          const validMentions = [
            ...new Set(mentions.filter((id) => typeof id === "string")),
          ]
            .filter((id) => chat.participants.some((p) => p.toString() === id))
            .slice(0, 20);

          const message = await Message.create({
            chat: chatId,
            conversationId: chatId,
            team: chat.team || null,
            sender: socket.user._id,
            content: clean,
            mentions: validMentions,
          });
          const roomSockets = await io.in(chatId).fetchSockets();
          const alreadyViewing = roomSockets
            .map((s) => s.user?._id?.toString())
            .filter((id) => id && id !== userId);

          if (alreadyViewing.length > 0) {
            message.deliveredTo.push(...alreadyViewing);
            await message.save();
          }

          Object.assign(chat, permission.updates);
          chat.lastMessage = {
            text: clean,
            sender: socket.user._id,
            sentAt: new Date(),
          };
          await chat.save();

          await invalidateChatCaches(chat);
          await notifyForNewMessage(chat, message, socket.user, validMentions);
          const populatedDoc = await message.populate(
            "sender",
            "name username profilePicture",
          );
          const dto = toMessageDTO(populatedDoc);

          io.to(chatId).emit("message:new", dto);
          if (Array.isArray(chat.participants)) {
            chat.participants.forEach((p) => {
              const pId = p.toString();
              if (pId !== chatId) {
                io.to(pId).emit("message:new", dto);
              }
            });
          }
          callback?.({ ok: true, message: dto });
        } catch (error) {
          console.error("message:send error:", error);
          callback?.({ ok: false, error: "Server error" });
        }
      },
    );

    socket.on("message:edit", async ({ chatId, messageId, content }, callback) => {
      try {
        if (!content || !content.trim()) {
          return callback?.({ ok: false, error: "Content cannot be empty" });
        }
        const message = await Message.findOne({ _id: messageId, chat: chatId });
        if (!message) return callback?.({ ok: false, error: "Message not found" });

        if (message.sender.toString() !== userId) {
          return callback?.({ ok: false, error: "You can only edit your own messages" });
        }

        if (message.isDeleted || message.deletedForEveryone) {
          return callback?.({ ok: false, error: "Cannot edit a deleted message" });
        }

        const clean = xss(content.trim());
        message.content = clean;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        const populatedDoc = await message.populate("sender", "name username profilePicture");
        const dto = toMessageDTO(populatedDoc);

        io.to(chatId).emit("message:edited", dto);
        if (Array.isArray(chatId)) {
          // just to be safe
        }
        callback?.({ ok: true, message: dto });
      } catch (err) {
        console.error("message:edit error:", err);
        callback?.({ ok: false, error: "Server error" });
      }
    });

    socket.on("message:delete", async ({ chatId, messageId }, callback) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return callback?.({ ok: false, error: "Chat not found" });

        const message = await Message.findOne({ _id: messageId, chat: chatId });
        if (!message) return callback?.({ ok: false, error: "Message not found" });

        const isSender = message.sender.toString() === userId;
        const isLeader = chat.leader && chat.leader.toString() === userId;
        const isAdmin = (chat.admins || []).some((a) => a.toString() === userId) ||
                        (chat.groupAdmin && chat.groupAdmin.toString() === userId);

        if (!isSender && !isLeader && !isAdmin) {
          return callback?.({ ok: false, error: "Not authorized to delete this message" });
        }

        message.isDeleted = true;
        message.deletedForEveryone = true;
        message.content = "";
        await message.save();

        const payload = {
          messageId: String(messageId),
          chatId: String(chatId),
          isDeleted: true,
        };

        io.to(chatId).emit("message:deleted", payload);
        callback?.({ ok: true, ...payload });
      } catch (err) {
        console.error("message:delete error:", err);
        callback?.({ ok: false, error: "Server error" });
      }
    });

    socket.on("typing:start", (payload) => {
      const targetChatId = typeof payload === "string" ? payload : payload?.chatId;
      if (targetChatId) {
        const username = socket.user?.name || socket.user?.username || "Someone";
        socket.to(targetChatId).emit("typing:update", { chatId: targetChatId, userId, username, typing: true });
        socket.to(targetChatId).emit("typing:start", { chatId: targetChatId, userId, username });
      }
    });

    socket.on("typing:stop", (payload) => {
      const targetChatId = typeof payload === "string" ? payload : payload?.chatId;
      if (targetChatId) {
        const username = socket.user?.name || socket.user?.username || "Someone";
        socket.to(targetChatId).emit("typing:update", { chatId: targetChatId, userId, username, typing: false });
        socket.to(targetChatId).emit("typing:stop", { chatId: targetChatId, userId });
      }
    });
    // Real-time Collaborative Coding Rooms
    socket.on("room:join", ({ roomCode, user: userInfo }, callback) => {
      const code = (roomCode || "DEFAULT").toUpperCase();
      socket.join(`room:${code}`);
      socket.roomCode = code;

      const member = {
        id: socket.id,
        userId: socket.user?._id?.toString() || socket.id,
        name: userInfo?.name || socket.user?.name || "Developer",
        initials: userInfo?.initials || (userInfo?.name ? userInfo.name.slice(0, 2).toUpperCase() : "DV"),
        color: userInfo?.color || "#8fd6ff",
        state: "editing this file",
      };

      socket.roomMember = member;

      // Broadcast to others in the room
      socket.to(`room:${code}`).emit("room:user-joined", member);

      // Collect all active members in room
      const roomSockets = io.sockets.adapter.rooms.get(`room:${code}`) || new Set();
      const members = [];
      for (const sId of roomSockets) {
        const s = io.sockets.sockets.get(sId);
        if (s?.roomMember) members.push(s.roomMember);
      }
      if (!members.some((m) => m.id === member.id)) members.push(member);

      callback?.({
        ok: true,
        members,
        currentCode: roomCodeState[code] || null,
      });
    });

    socket.on("room:code-change", ({ roomCode, file, code, cursorLine }) => {
      const codeKey = (roomCode || socket.roomCode || "DEFAULT").toUpperCase();
      if (!roomCodeState[codeKey]) roomCodeState[codeKey] = {};
      roomCodeState[codeKey][file] = code;

      socket.to(`room:${codeKey}`).emit("room:code-update", {
        file,
        code,
        fromUser: socket.roomMember?.name || socket.user?.name || "Collaborator",
        fromId: socket.id,
        cursorLine,
      });
    });

    socket.on("room:cursor", ({ roomCode, file, line, col }) => {
      const codeKey = (roomCode || socket.roomCode || "DEFAULT").toUpperCase();
      socket.to(`room:${codeKey}`).emit("room:cursor-update", {
        fromUser: socket.roomMember?.name || socket.user?.name || "Collaborator",
        fromId: socket.id,
        color: socket.roomMember?.color || "#ff98a2",
        file,
        line,
        col,
      });
    });

    socket.on("room:chat", ({ roomCode, message: msgText }) => {
      const codeKey = (roomCode || socket.roomCode || "DEFAULT").toUpperCase();
      const chatPayload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        who: socket.id,
        userName: socket.roomMember?.name || socket.user?.name || "Collaborator",
        initials: socket.roomMember?.initials || "CB",
        color: socket.roomMember?.color || "#ffd58c",
        text: msgText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      io.to(`room:${codeKey}`).emit("room:chat-message", chatPayload);
    });

    socket.on("room:leave", (roomCode) => {
      const codeKey = (roomCode || socket.roomCode || "DEFAULT").toUpperCase();
      socket.leave(`room:${codeKey}`);
      socket.to(`room:${codeKey}`).emit("room:user-left", {
        id: socket.id,
        name: socket.roomMember?.name,
      });
      socket.roomCode = null;
    });

    socket.on("disconnect", async () => {
      if (socket.roomCode) {
        socket.to(`room:${socket.roomCode}`).emit("room:user-left", {
          id: socket.id,
          name: socket.roomMember?.name,
        });
      }
      const remaining = await io.in(userId).fetchSockets();
      if (remaining.length === 0) {
        await redisClient.sRem("online_users", userId);
        const lastSeenDate = new Date();
        if (!socket.user.isGuest) {
          await User.findByIdAndUpdate(socket.user._id, {
            lastSeen: lastSeenDate,
          });
        }
        io.emit("presence:offline", { userId, lastSeen: lastSeenDate.toISOString() });
      }
    });
  });
};

export default initSocket;
