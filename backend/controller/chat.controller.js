import mongoose from "mongoose";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendNotification } from "../utils/notify.js";
import { decryptText, encryptText, isCipherHex } from "../utils/crypto.js";
import { isBlocked } from "../utils/blockGuard.js";
import { getIO } from "../utils/SocketManager.js";
import redisClient from "../config/redis.js";
import xss from "xss";

const PARTICIPANT_FIELDS = "name username profilePicture lastSeen";

export const toMessageDTO = (msgDoc) => {
  if (!msgDoc) return null;
  const m = msgDoc.toObject ? msgDoc.toObject() : { ...msgDoc };

  let sender = m.sender;
  if (sender && typeof sender === "object" && (sender._id || sender.id)) {
    sender = {
      _id: String(sender._id || sender.id),
      name: sender.name || "Developer",
      username: sender.username || "builder",
      profilePicture: sender.profilePicture || "",
    };
  } else {
    sender = {
      _id: String(sender || ""),
      name: "Developer",
      username: "builder",
      profilePicture: "",
    };
  }

  const isDel = Boolean(m.isDeleted || m.deletedForEveryone);
  let content = isDel ? "" : String(m.content || "");
  if (!isDel && content) {
    const dec = decryptText(content);
    if (dec) {
      content = dec;
    } else if (isCipherHex(content)) {
      content = "💬 Message";
    }
  }

  const chatId = String(m.chat?._id || m.chat || m.conversationId || "");

  return {
    _id: String(m._id || ""),
    id: String(m._id || ""),
    chat: chatId,
    chatId: chatId,
    conversationId: chatId,
    team: m.team ? String(m.team._id || m.team) : null,
    sender,
    content,
    isDeleted: isDel,
    deletedForEveryone: isDel,
    edited: Boolean(m.edited),
    editedAt: m.editedAt || null,
    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
    readBy: Array.isArray(m.readBy) ? m.readBy.map((id) => String(id?._id || id)) : [],
    deliveredTo: Array.isArray(m.deliveredTo) ? m.deliveredTo.map((id) => String(id?._id || id)) : [],
    mentions: Array.isArray(m.mentions) ? m.mentions.map((id) => String(id?._id || id)) : [],
  };
};

const getMyChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id })
    .populate("participants", PARTICIPANT_FIELDS)
    .populate("lastMessage.sender", "name username")
    .sort({ updatedAt: -1 });

  let onlineSet = new Set();
  try {
    const list = await redisClient.sMembers("online_users");
    onlineSet = new Set(list || []);
  } catch (_) {}

  const decorated = await Promise.all(
    chats.map(async (chat) => {
      const obj = chat.toObject();
      if (obj.lastMessage?.text) {
        const dec = decryptText(obj.lastMessage.text);
        if (dec) {
          obj.lastMessage.text = dec;
        } else if (isCipherHex(obj.lastMessage.text)) {
          obj.lastMessage.text = "💬 Message";
        }
      }

      // Annotate participants with live isOnline
      obj.participants = (obj.participants || []).map((p) => ({
        ...p,
        isOnline: Boolean(p._id && onlineSet.has(p._id.toString())),
      }));

      const myMeta = chat.participantsMeta.find(
        (pm) => pm.user.toString() === req.user._id.toString()
      );
      const lastReadAt = myMeta?.lastReadAt || chat.createdAt;

      obj.unreadCount = await Message.countDocuments({
        chat: chat._id,
        sender: { $ne: req.user._id },
        createdAt: { $gt: lastReadAt },
      });

      return obj;
    })
  );

  return res.status(200).json(new ApiResponse(200, "Chats fetched", decorated));
});

const getOrCreateDirectChat = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (userId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot start a chat with yourself");
  }

  const otherUser = await User.findById(userId);
  if (!otherUser) throw new ApiError(404, "User not found");

  if (await isBlocked(req.user._id, userId)) {
    throw new ApiError(403, "You cannot message this user");
  }

  let chat = await Chat.findOne({
    isGroup: false,
    participants: { $all: [req.user._id, userId], $size: 2 },
  });

  if (!chat) {
    chat = await Chat.create({
      participants: [req.user._id, userId],
      participantsMeta: [
        { user: req.user._id, joinedAt: new Date() },
        { user: userId, joinedAt: new Date() },
      ],
      isGroup: false,
    });
  }

  chat = await chat.populate("participants", PARTICIPANT_FIELDS);
  const obj = chat.toObject();

  let isOtherOnline = false;
  try {
    isOtherOnline = Boolean(await redisClient.sIsMember("online_users", userId));
  } catch (_) {}

  obj.participants = (obj.participants || []).map((p) => ({
    ...p,
    isOnline: p._id.toString() === userId ? isOtherOnline : false,
  }));

  return res.status(200).json(new ApiResponse(200, "Chat ready", obj));
});

const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 30 } = req.query;

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");

  const isParticipant = chat.participants.some((p) => p.toString() === req.user._id.toString());
  if (!isParticipant) throw new ApiError(403, "Not a participant of this chat");

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 30));

  const filter = {
    chat: chatId,
    deletedFor: { $ne: req.user._id },
  };

  const total = await Message.countDocuments(filter);
  const messages = await Message.find(filter)
    .populate("sender", "name username profilePicture")
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const dtoList = messages.map((m) => toMessageDTO(m));

  // Return chronological order (oldest to newest for current page slice)
  const chronological = dtoList.reverse();

  return res.status(200).json(
    new ApiResponse(200, "Messages fetched", {
      messages: chronological,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: pageNum * limitNum < total,
      },
    })
  );
});

const createGroupChat = asyncHandler(async (req, res) => {
  const { name, participantIds = [], team = null, project = null } = req.body;

  // 1. Check if a group chat already exists for this team
  if (team) {
    const isTeamObjectId = mongoose.isValidObjectId(team);
    const query = isTeamObjectId ? { isGroup: true, team } : { isGroup: true, name: name?.trim() };
    let existingChat = await Chat.findOne(query);

    if (existingChat) {
      // Sync any missing participants into the existing group chat
      const currentParticipantIds = new Set(existingChat.participants.map((p) => p.toString()));
      const incomingParticipants = [...new Set([...participantIds, req.user._id.toString()])]
        .filter(Boolean)
        .filter((id) => mongoose.isValidObjectId(id));
      const newParticipants = incomingParticipants.filter((id) => !currentParticipantIds.has(id.toString()));

      if (newParticipants.length > 0) {
        existingChat.participants.push(...newParticipants);
        existingChat.participantsMeta.push(
          ...newParticipants.map((id) => ({ user: id, joinedAt: new Date(), lastReadAt: new Date() }))
        );
        await existingChat.save();
      }

      existingChat = await existingChat.populate("participants", PARTICIPANT_FIELDS);
      return res.status(200).json(new ApiResponse(200, "Group chat ready", existingChat));
    }
  }

  // 2. Check if a group chat already exists for this project (if project specified without team)
  if (project && !team) {
    const isProjectObjectId = mongoose.isValidObjectId(project);
    const query = isProjectObjectId ? { isGroup: true, project } : { isGroup: true, name: name?.trim() };
    let existingChat = await Chat.findOne(query);

    if (existingChat) {
      const currentParticipantIds = new Set(existingChat.participants.map((p) => p.toString()));
      const incomingParticipants = [...new Set([...participantIds, req.user._id.toString()])]
        .filter(Boolean)
        .filter((id) => mongoose.isValidObjectId(id));
      const newParticipants = incomingParticipants.filter((id) => !currentParticipantIds.has(id.toString()));

      if (newParticipants.length > 0) {
        existingChat.participants.push(...newParticipants);
        existingChat.participantsMeta.push(
          ...newParticipants.map((id) => ({ user: id, joinedAt: new Date(), lastReadAt: new Date() }))
        );
        await existingChat.save();
      }

      existingChat = await existingChat.populate("participants", PARTICIPANT_FIELDS);
      return res.status(200).json(new ApiResponse(200, "Group chat ready", existingChat));
    }
  }

  if (!name || !name.trim()) {
    throw new ApiError(400, "Group name is required");
  }

  const uniqueParticipants = [...new Set([...participantIds, req.user._id.toString()])]
    .filter(Boolean)
    .filter((id) => mongoose.isValidObjectId(id));

  // If it's a standalone group without team/project, require at least 2 participants
  if (!team && !project && uniqueParticipants.length < 2) {
    throw new ApiError(400, "A group needs at least 2 participants");
  }

  const isTeamObjectId = team && mongoose.isValidObjectId(team);
  const isProjectObjectId = project && mongoose.isValidObjectId(project);

  let chat = await Chat.create({
    name: name.trim(),
    isGroup: true,
    participants: uniqueParticipants.length > 0 ? uniqueParticipants : [req.user._id],
    participantsMeta: (uniqueParticipants.length > 0 ? uniqueParticipants : [req.user._id]).map((id) => ({
      user: id,
      joinedAt: new Date(),
      lastReadAt: new Date(),
    })),
    leader: req.user._id,
    admins: [req.user._id],
    team: isTeamObjectId ? team : null,
    project: isProjectObjectId ? project : null,
  });

  chat = await chat.populate("participants", PARTICIPANT_FIELDS);

  return res.status(201).json(new ApiResponse(201, "Group chat created", chat));
});


const markChatAsRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");

  const isParticipant = chat.participants.some((p) => p.toString() === req.user._id.toString());
  if (!isParticipant) throw new ApiError(403, "Not a participant of this chat");

  await Chat.updateOne(
    { _id: chatId, "participantsMeta.user": req.user._id },
    { $set: { "participantsMeta.$.lastReadAt": new Date() } }
  );

  return res.status(200).json(new ApiResponse(200, "Marked as read", { chatId }));
});

const notifyForNewMessage = async (chat, message, sender, mentionedUserIds = []) => {
  // Only notify when users are explicitly mentioned, not on regular messages.
  // This keeps chat messages in the chat panel and keeps the notification bell clean for events.
  if (!mentionedUserIds || mentionedUserIds.length === 0) return;

  const recipients = chat.participants
    .map((p) => p.toString())
    .filter((id) => id !== sender._id.toString() && mentionedUserIds.includes(id));

  const plainText = message.content || "Mentioned you in chat";

  await Promise.all(
    recipients.map((recipientId) =>
      sendNotification({
        recipient: recipientId,
        sender: sender._id,
        type: "mention",
        text: `${sender.name || "Teammate"} mentioned you: ${plainText.slice(0, 100)}`,
        chat: chat._id,
        message: message._id,
      })
    )
  );
};

const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { content, mentions = [] } = req.body;

  if (!content || !content.trim()) {
    throw new ApiError(400, "Message content is required");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");

  const isParticipant = chat.participants.some((p) => p.toString() === req.user._id.toString());
  if (!isParticipant) throw new ApiError(403, "Not a participant of this chat");

  const clean = xss(content.trim());
  const validMentions = [
    ...new Set(mentions.filter((id) => typeof id === "string")),
  ].filter((id) => chat.participants.some((p) => p.toString() === id));

  const message = await Message.create({
    chat: chatId,
    conversationId: chatId,
    team: chat.team || null,
    sender: req.user._id,
    content: clean,
    mentions: validMentions,
  });

  chat.lastMessage = {
    text: clean,
    sender: req.user._id,
    sentAt: new Date(),
  };
  await chat.save();

  await notifyForNewMessage(chat, message, req.user, validMentions);

  const populatedDoc = await message.populate(
    "sender",
    "name username profilePicture"
  );
  const dto = toMessageDTO(populatedDoc);

  try {
    const io = getIO();
    io.to(chatId).emit("message:new", dto);
    if (Array.isArray(chat.participants)) {
      chat.participants.forEach((p) => {
        const pId = p.toString();
        if (pId !== chatId) {
          io.to(pId).emit("message:new", dto);
        }
      });
    }
  } catch (err) {}

  return res.status(201).json(new ApiResponse(201, "Message sent", dto));
});

const editMessage = asyncHandler(async (req, res) => {
  const { chatId, messageId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw new ApiError(400, "Content cannot be empty");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");

  const message = await Message.findOne({ _id: messageId, chat: chatId });
  if (!message) throw new ApiError(404, "Message not found");

  if (message.sender.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only edit your own messages");
  }

  if (message.isDeleted || message.deletedForEveryone) {
    throw new ApiError(400, "Cannot edit a deleted message");
  }

  const clean = xss(content.trim());
  message.content = clean;
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  const populatedDoc = await message.populate("sender", "name username profilePicture");
  const dto = toMessageDTO(populatedDoc);

  try {
    const io = getIO();
    io.to(chatId).emit("message:edited", dto);
    if (Array.isArray(chat.participants)) {
      chat.participants.forEach((p) => {
        const pId = p.toString();
        if (pId !== chatId) {
          io.to(pId).emit("message:edited", dto);
        }
      });
    }
  } catch (err) {}

  return res.status(200).json(new ApiResponse(200, "Message edited", dto));
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { chatId, messageId } = req.params;

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");

  const message = await Message.findOne({ _id: messageId, chat: chatId });
  if (!message) throw new ApiError(404, "Message not found");

  const isSender = message.sender.toString() === req.user._id.toString();
  const isLeader = chat.leader && chat.leader.toString() === req.user._id.toString();
  const isAdmin = (chat.admins || []).some((a) => a.toString() === req.user._id.toString()) ||
                  (chat.groupAdmin && chat.groupAdmin.toString() === req.user._id.toString());

  if (!isSender && !isLeader && !isAdmin) {
    throw new ApiError(403, "Not authorized to delete this message");
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

  try {
    const io = getIO();
    io.to(chatId).emit("message:deleted", payload);
    if (Array.isArray(chat.participants)) {
      chat.participants.forEach((p) => {
        const pId = p.toString();
        if (pId !== chatId) {
          io.to(pId).emit("message:deleted", payload);
        }
      });
    }
  } catch (err) {}

  return res.status(200).json(new ApiResponse(200, "Message deleted", payload));
});

export {
  getMyChats,
  getOrCreateDirectChat,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  createGroupChat,
  markChatAsRead,
  notifyForNewMessage,
};