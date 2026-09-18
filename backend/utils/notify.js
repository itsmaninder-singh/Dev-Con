import {Notification } from "../models/notification.model.js";
import { getIO } from "./SocketManager.js";
export const sendNotification = async ({
  recipient,
  sender = null,
  type,
  text,
  chat = null,
  message = null,
  joinRequest = null,
}) => {
  try {
    if (!recipient) return null;

    const recipientId = String(recipient._id || recipient.id || recipient);
    const senderId = sender ? String(sender._id || sender.id || sender) : null;

    // Strict guard: NEVER send or create a notification to self!
    if (senderId && recipientId === senderId) {
      console.warn(`[notify] Blocked notification to self: recipient=${recipientId}, sender=${senderId}`);
      return null;
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      text,
      chat,
      message,
      joinRequest,
    });
    const populated = await notification.populate("sender", "name username profilePicture");
    try {
      const io = getIO();
      io.to(recipientId).emit("notification:new", populated);
    } catch (err) {}
    return populated;
  } catch (err) {
    console.error("Failed to send notification: ->", err.message);
    return null;
  }
};

export const sendNotificationToMany = async (recipients, payload, excludeIds = []) => {
  const senderId = payload.sender ? String(payload.sender._id || payload.sender.id || payload.sender) : null;
  const allExcludes = new Set([
    ...excludeIds.map((id) => String(id._id || id.id || id)),
    ...(senderId ? [senderId] : []),
  ]);

  const targets = (recipients || []).filter((r) => {
    const rid = String(r._id || r.id || r);
    return !allExcludes.has(rid);
  });

  await Promise.all(targets.map((recipient) => sendNotification({ ...payload, recipient })));
};
