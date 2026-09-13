import jwt from "jsonwebtoken";
import xss from "xss";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { evaluateSendPermission } from "../utils/chatGuard.js";
import { canSendInGroup } from "../utils/chatPermission.js";
import { isBlocked } from "../utils/blockGuard.js";
import { notifyForNewMessage } from "../controller/chat.controller.js";
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
        const guestName = socket.handshake.auth?.name || `Dev_${socket.id.slice(0, 4)}`;
        socket.user = {
          _id: `guest_${socket.id}`,
          name: guestName,
          isGuest: true,
        };
        return next();
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
          socket.user = user;
          return next();
        }
      } catch {}

      const guestName = socket.handshake.auth?.name || `Dev_${socket.id.slice(0, 4)}`;
      socket.user = {
        _id: `guest_${socket.id}`,
        name: guestName,
        isGuest: true,
      };
      next();
    } catch (err) {
      next();
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`socket-con established : ${userId}`);

    socket.join(userId);
    redisClient.sAdd("online_users", userId);
    io.emit("presence:online", { userId });

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
            sender: socket.user._id,
            content: encryptText(clean), 
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
            text: encryptText(clean),
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
          const populated = populatedDoc.toObject();
          populated.content = clean;

          io.to(chatId).emit("message:new", populated);
          callback?.({ ok: true, message: populated });
        } catch (error) {
          console.error("message:send error:", error);
          callback?.({ ok: false, error: "Server error" });
        }
      },
    );

    socket.on("typing:start", (chatId) => {
      socket.to(chatId).emit("typing:start", { chatId, userId });
    });
    socket.on("typing:stop", (chatId) => {
      socket.to(chatId).emit("typing:stop", { chatId, userId });
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
        if (!socket.user.isGuest) {
          await User.findByIdAndUpdate(socket.user._id, {
            lastSeen: new Date(),
          });
        }
        io.emit("presence:offline", { userId, lastSeen: new Date() });
      }
    });
  });
};

export default initSocket;
