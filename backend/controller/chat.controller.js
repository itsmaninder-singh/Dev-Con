import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendNotification } from "../utils/notify.js";
import { decryptText } from "../utils/crypto.js";
import { isBlocked } from "../utils/blockGuard.js";

const getMyChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id })
    .populate("participants", "name username profilePicture lastSeen")
    .populate("lastMessage.sender", "name username")
    .sort({ updatedAt: -1 });

  const decorated = chats.map((chat) => {
    const obj = chat.toObject();
    if (obj.lastMessage?.text) {
      obj.lastMessage.text = decryptText(obj.lastMessage.text) || obj.lastMessage.text;
    }
    return obj;
  });

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

  return res.status(200).json(new ApiResponse(200, "Chat ready", chat));
});

const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 30 } = req.query;

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");

  const isParticipant = chat.participants.some((p) => p.toString() === req.user._id.toString());
  if (!isParticipant) throw new ApiError(403, "Not a participant of this chat");

  const messages = await Message.find({
    chat: chatId,
    deletedFor: { $ne: req.user._id },
  })
    .populate("sender", "name username profilePicture")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const decorated = messages.map((m) => {
    const obj = m.toObject();
    obj.content = decryptText(obj.content) || obj.content;
    return obj;
  });

  return res.status(200).json(new ApiResponse(200, "Messages fetched", decorated.reverse()));
});

const createGroupChat = asyncHandler(async (req, res) => {
  const { name, participantIds = [], team = null, project = null } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Group name is required");
  }
  const uniqueParticipants = [...new Set([...participantIds, req.user._id.toString()])];
  if (uniqueParticipants.length < 2) {
    throw new ApiError(400, "A group needs at least 2 participants");
  }

  const chat = await Chat.create({
    name: name.trim(),
    isGroup: true,
    participants: uniqueParticipants,
    participantsMeta: uniqueParticipants.map((id) => ({ user: id, joinedAt: new Date() })),
    leader: req.user._id,
    admins: [req.user._id],
    team,
    project,
  });

  return res.status(201).json(new ApiResponse(201, "Group chat created", chat));
});

const notifyForNewMessage = async (chat, message, sender, mentionedUserIds = []) => {
  const recipients = chat.participants
    .map((p) => p.toString())
    .filter((id) => id !== sender._id.toString());

  const plainText = decryptText(message.content) || message.content;

  await Promise.all(
    recipients.map((recipientId) =>
      sendNotification({
        recipient: recipientId,
        sender: sender._id,
        type: mentionedUserIds.includes(recipientId) ? "mention" : "message",
        text: `${sender.name}: ${plainText.slice(0, 100)}`,
        chat: chat._id,
        message: message._id,
      })
    )
  );
};

export {
  getMyChats,
  getOrCreateDirectChat,
  getMessages,
  createGroupChat,
  notifyForNewMessage,
};
