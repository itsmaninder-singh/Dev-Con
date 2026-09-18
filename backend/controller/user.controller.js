import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { toSafeUser } from "./auth.controller.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { Notification } from "../models/notification.model.js";
import { sendNotification } from "../utils/notify.js";

const ALLOWED_EXPERIENCE = ["Fresher", "1-2 years", "2-5 years", "5+ years"];
const ALLOWED_AVAILABLE_FOR = [
  "Hackathon",
  "open source contribution",
  "college project",
  "startup",
  "freelance",
];

const getMe = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id);
    if(!user){
        throw new ApiError(404,"User Not Found");

    }
    return res.status(200).json(new ApiResponse(200,"Profile fetched successfully",toSafeUser(user)));
});

const getUserByUsername = asyncHandler(async (req, res) => {
  const param = req.params.username;
  let user = await User.findOne({ username: param.toLowerCase() });
  if (!user && mongoose.Types.ObjectId.isValid(param)) {
    user = await User.findById(param);
  }
  if (!user) {
    user = await User.findOne({ name: new RegExp('^' + param + '$', 'i') });
  }
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res.status(200).json(new ApiResponse(200, "Profile fetched successfully", toSafeUser(user)));
});

const updateProfile = asyncHandler(async (req, res) => {
  const editable = [
    "name",
    "bio",
    "college",
    "skills",
    "experience",
    "gender",
  ];
  const ALLOWED_GENDER = ["male", "female", "other", "prefer-not-to-say"];

  const updates = {};
  for (const field of editable) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (updates.experience && !ALLOWED_EXPERIENCE.includes(updates.experience)) {
    throw new ApiError(400, `experience must be one of: ${ALLOWED_EXPERIENCE.join(", ")}`);
  }
  if (updates.gender && !ALLOWED_GENDER.includes(updates.gender)) {
    throw new ApiError(400, `gender must be one of: ${ALLOWED_GENDER.join(", ")}`);
  }
  if (updates.skills && !Array.isArray(updates.skills)) {
    throw new ApiError(400, "skills must be an array of strings");
  }
  if (updates.bio && updates.bio.length > 200) {
    throw new ApiError(400, "bio must be 200 characters or fewer");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  for (const field of editable) {
    if (updates[field] !== undefined) {
      user[field] = updates[field];
    }
  }

  // Handle phone / phoneNumber as { countryCode, number }
  const rawPhone = req.body.phoneNumber !== undefined ? req.body.phoneNumber : req.body.phone;
  if (rawPhone !== undefined) {
    if (rawPhone && typeof rawPhone === "object") {
      user.phoneNumber = {
        countryCode: rawPhone.countryCode ? String(rawPhone.countryCode).trim() : (user.phoneNumber?.countryCode || "+91"),
        number: rawPhone.number !== undefined ? String(rawPhone.number).replace(/\D/g, "").trim() : (user.phoneNumber?.number || ""),
      };
    } else if (typeof rawPhone === "string") {
      user.phoneNumber = {
        countryCode: user.phoneNumber?.countryCode || "+91",
        number: rawPhone.replace(/\D/g, "").trim(),
      };
    } else {
      user.phoneNumber = { countryCode: "+91", number: "" };
    }
  }

  user.isProfileComplete = user.calculateIsProfileComplete();
  await user.save();

  return res.status(200).json(new ApiResponse(200, "Profile updated successfully", toSafeUser(user)));
});

const toggleAvailability = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (typeof req.body.isAvailable === "boolean") {
    user.isAvailable = req.body.isAvailable;
  } else {
    user.isAvailable = !user.isAvailable;
  }
  await user.save({ validateModifiedOnly: true });

  return res
    .status(200)
    .json(new ApiResponse(200, "Availability updated", { isAvailable: user.isAvailable }));
});

const updateAvailableFor = asyncHandler(async (req, res) => {
  const { availableFor } = req.body;
  if (!Array.isArray(availableFor)) {
    throw new ApiError(400, "availableFor must be an array of strings");
  }
  const invalid = availableFor.filter((v) => !ALLOWED_AVAILABLE_FOR.includes(v));
  if (invalid.length) {
    throw new ApiError(
      400,
      `Invalid values: ${invalid.join(", ")}. Allowed: ${ALLOWED_AVAILABLE_FOR.join(", ")}`
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { availableFor },
    { new: true, runValidators: true }
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Available-for options updated", { availableFor: user.availableFor }));
});

const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image file uploaded");
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const result = await uploadOnCloudinary(req.file.path, "devconnect/profile-pictures");
  if (!result) {
    throw new ApiError(500, "Failed to upload image, please try again");
  }

  const oldPublicId = user.profilePicturePublicId;
  user.profilePicture = result.url;
  user.profilePicturePublicId = result.publicId;
  await user.save({ validateModifiedOnly: true });

  if (oldPublicId) {
    await deleteFromCloudinary(oldPublicId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile picture updated", { profilePicture: user.profilePicture }));
});

const uploadCoverPicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image file uploaded");
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const result = await uploadOnCloudinary(req.file.path, "devconnect/cover-pictures");
  if (!result) {
    throw new ApiError(500, "Failed to upload image, please try again");
  }

  const oldPublicId = user.coverPicturePublicId;
  user.coverPicture = result.url;
  user.coverPicturePublicId = result.publicId;
  await user.save({ validateModifiedOnly: true });

  if (oldPublicId) {
    await deleteFromCloudinary(oldPublicId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Cover picture updated", { coverPicture: user.coverPicture }));
});

const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  if (userId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot block yourself");
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  const user = await User.findById(req.user._id);
  const alreadyBlocked = user.blockedUsers.some(
    (id) => id.toString() === userId.toString()
  );

  if (!alreadyBlocked) {
    user.blockedUsers.push(userId);
    await user.save({ validateModifiedOnly: true });
  }

  return res.status(200).json(
    new ApiResponse(200, "User blocked successfully", {
      blockedUserId: userId,
      blockedUsers: user.blockedUsers,
    })
  );
});

const unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(req.user._id);
  user.blockedUsers = user.blockedUsers.filter(
    (id) => id.toString() !== userId.toString()
  );
  await user.save({ validateModifiedOnly: true });

  return res.status(200).json(
    new ApiResponse(200, "User unblocked successfully", {
      unblockedUserId: userId,
      blockedUsers: user.blockedUsers,
    })
  );
});

const sendConnectRequest = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  if (userId.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot send a connection request to yourself");
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new ApiError(404, "User not found");
  }

  const currentUser = await User.findById(req.user._id);
  if (
    currentUser?.blockedUsers?.some((id) => id.toString() === userId.toString()) ||
    targetUser?.blockedUsers?.some((id) => id.toString() === req.user._id.toString())
  ) {
    throw new ApiError(403, "Cannot connect with this user");
  }

  if (currentUser?.connections?.some((id) => id.toString() === userId.toString())) {
    throw new ApiError(400, "You are already connected with this user");
  }

  // Create or refresh connect_request notification
  const notification = await sendNotification({
    recipient: targetUser._id,
    sender: req.user._id,
    type: "connect_request",
    text: "sent you a connection request",
  });

  return res.status(200).json(
    new ApiResponse(200, `Connection request sent to ${targetUser.name}`, {
      recipientId: targetUser._id,
      notification,
    })
  );
});

const acceptConnectRequest = asyncHandler(async (req, res) => {
  const { notifId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(notifId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notif = await Notification.findOne({ _id: notifId, recipient: req.user._id });
  if (!notif) {
    throw new ApiError(404, "Notification not found");
  }

  notif.read = true;
  await notif.save();

  if (notif.sender) {
    // Add each other to mutual connections list
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { connections: notif.sender },
    });
    await User.findByIdAndUpdate(notif.sender, {
      $addToSet: { connections: req.user._id },
    });

    // Send real-time notification to the sender that it was accepted
    await sendNotification({
      recipient: notif.sender,
      sender: req.user._id,
      type: "connect_accepted",
      text: "accepted your connection request",
    });
  }

  return res.status(200).json(
    new ApiResponse(200, "Connection request accepted successfully", notif)
  );
});

const getUserConnections = asyncHandler(async (req, res) => {
  const { usernameOrId } = req.params;
  let user;
  if (mongoose.Types.ObjectId.isValid(usernameOrId)) {
    user = await User.findById(usernameOrId).populate(
      "connections",
      "name username profilePicture college skills bio experience isAvailable"
    );
  }
  if (!user) {
    user = await User.findOne({ username: usernameOrId.toLowerCase() }).populate(
      "connections",
      "name username profilePicture college skills bio experience isAvailable"
    );
  }
  if (!user && (usernameOrId === "me" || usernameOrId === req.user?.username)) {
    user = await User.findById(req.user._id).populate(
      "connections",
      "name username profilePicture college skills bio experience isAvailable"
    );
  }
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, "Connections fetched successfully", {
      connections: user.connections || [],
      count: (user.connections || []).length,
    })
  );
});

export {
  getMe,
  getUserByUsername,
  updateProfile,
  toggleAvailability,
  updateAvailableFor,
  uploadProfilePicture,
  uploadCoverPicture,
  blockUser,
  unblockUser,
  sendConnectRequest,
  acceptConnectRequest,
  getUserConnections,
};

