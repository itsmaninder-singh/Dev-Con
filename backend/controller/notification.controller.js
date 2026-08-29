import mongoose from "mongoose";
import { Notification } from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const isValidId =(id)=> mongoose.Types.ObjectId.isValid(id);

const getNotifications = asyncHandler(async (req, res) => {
  const { read, page = 1, limit = 30 } = req.query;
  const filter = { recipient: req.user._id };
  if (read !== undefined) filter.read = read === "true";

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 30, 1), 100);

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .populate("sender", "name username profilePicture")
      .populate({
        path: "joinRequest",
        select: "message roleAppliedFor status team project",
        populate: [
          { path: "team", select: "name" },
          { path: "project", select: "title" },
        ],
      })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Notification.countDocuments(filter),
  ]);

  return res.status(200).json(new ApiResponse(200, "Notifications fetched", {
    notifications,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  }));
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
  return res.status(200).json(new ApiResponse(200, "Unread count fetched", { count }));
});

const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new ApiError(400, "Invalid notification id");

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, "Notification not found");

  return res.status(200).json(new ApiResponse(200, "Notification marked as read", notification));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  return res.status(200).json(new ApiResponse(200, "All notifications marked as read"));
});

const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) throw new ApiError(400, "Invalid notification id");

  const notification = await Notification.findOneAndDelete({ _id: id, recipient: req.user._id });
  if (!notification) throw new ApiError(404, "Notification not found");

  return res.status(200).json(new ApiResponse(200, "Notification deleted"));
});

export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
