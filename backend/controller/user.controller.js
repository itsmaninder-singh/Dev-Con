import mongoose from 'mongoose';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { toSafeUser } from "./auth.controller.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { Notification } from "../models/notification.model.js";
import { sendNotification } from "../utils/notify.js";
import { syncGithubProfileForUser } from "../utils/githubSync.js";

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
    "profilePicture",
    "avatarUrl",
    "coverPicture",
    "coverUrl",
  ];
  const ALLOWED_GENDER = ["male", "female", "other", "prefer-not-to-say"];

  const updates = {};
  for (const field of editable) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (updates.avatarUrl && !updates.profilePicture) {
    updates.profilePicture = updates.avatarUrl;
  }
  if (updates.coverUrl && !updates.coverPicture) {
    updates.coverPicture = updates.coverUrl;
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
    let countryCode = "+91";
    let number = "";

    if (rawPhone && typeof rawPhone === "object") {
      countryCode = rawPhone.countryCode ? String(rawPhone.countryCode).trim() : (user.phoneNumber?.countryCode || "+91");
      number = rawPhone.number !== undefined ? String(rawPhone.number).replace(/\D/g, "").trim() : (user.phoneNumber?.number || "");
    } else if (typeof rawPhone === "string") {
      countryCode = user.phoneNumber?.countryCode || "+91";
      number = rawPhone.replace(/\D/g, "").trim();
    }

    if (number && (number.length < 6 || number.length > 15)) {
      throw new ApiError(400, "Invalid phone number format. Phone number should be between 7 and 15 digits.");
    }

    user.phoneNumber = {
      countryCode,
      number,
    };
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

  let result = await uploadOnCloudinary(req.file.path, "devconnect/profile-pictures");
  if (!result) {
    // Cloudinary not configured or failed - store locally in public/uploads/profile-pictures
    try {
      const uploadDir = path.resolve("public/uploads/profile-pictures");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const ext = path.extname(req.file.originalname || req.file.path) || ".jpg";
      const filename = `avatar-${user._id}-${Date.now()}${ext}`;
      const destPath = path.join(uploadDir, filename);

      if (fs.existsSync(req.file.path)) {
        fs.copyFileSync(req.file.path, destPath);
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }
      result = {
        url: `/uploads/profile-pictures/${filename}`,
        publicId: null,
      };
    } catch (localErr) {
      console.error("[uploadProfilePicture] Local storage fallback failed:", localErr);
      throw new ApiError(500, "Failed to save uploaded image");
    }
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
    .json(new ApiResponse(200, "Profile picture updated", { profilePicture: user.profilePicture, avatarUrl: user.profilePicture }));
});

const uploadCoverPicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image file uploaded");
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let result = await uploadOnCloudinary(req.file.path, "devconnect/cover-pictures");
  if (!result) {
    // Cloudinary not configured or failed - store locally in public/uploads/cover-pictures
    try {
      const uploadDir = path.resolve("public/uploads/cover-pictures");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const ext = path.extname(req.file.originalname || req.file.path) || ".jpg";
      const filename = `cover-${user._id}-${Date.now()}${ext}`;
      const destPath = path.join(uploadDir, filename);

      if (fs.existsSync(req.file.path)) {
        fs.copyFileSync(req.file.path, destPath);
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }
      result = {
        url: `/uploads/cover-pictures/${filename}`,
        publicId: null,
      };
    } catch (localErr) {
      console.error("[uploadCoverPicture] Local storage fallback failed:", localErr);
      throw new ApiError(500, "Failed to save uploaded cover image");
    }
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
    .json(new ApiResponse(200, "Cover picture updated", { coverPicture: user.coverPicture, coverUrl: user.coverPicture }));
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
  notif.status = "accepted";
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

const rejectConnectRequest = asyncHandler(async (req, res) => {
  const { notifId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(notifId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notif = await Notification.findOne({ _id: notifId, recipient: req.user._id });
  if (!notif) {
    throw new ApiError(404, "Notification not found");
  }

  notif.read = true;
  notif.status = "rejected";
  await notif.save();

  return res.status(200).json(
    new ApiResponse(200, "Connection request ignored", notif)
  );
});

const getUserConnections = asyncHandler(async (req, res) => {
  const { usernameOrId } = req.params;
  let user;
  if (!usernameOrId || usernameOrId === "me" || usernameOrId === req.user?.username) {
    user = await User.findById(req.user._id).populate(
      "connections",
      "name username profilePicture college skills bio experience isAvailable"
    );
  } else if (mongoose.Types.ObjectId.isValid(usernameOrId)) {
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

const syncGithubProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const usernameParam = req.body?.githubUsername?.trim();

  // If user has not connected their GitHub account via OAuth yet
  if (!req.user.githubId && !req.user.githubUsername) {
    throw new ApiError(
      400,
      "Please connect your GitHub account using GitHub login first before syncing."
    );
  }

  // Prevent users from syncing someone else's GitHub username without authenticating
  if (req.user.githubUsername && usernameParam) {
    const cleanParam = usernameParam
      .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
      .replace(/\/$/, "")
      .toLowerCase()
      .trim();

    if (cleanParam && cleanParam !== req.user.githubUsername.toLowerCase()) {
      throw new ApiError(
        400,
        `Your account is linked to GitHub as @${req.user.githubUsername}. To connect a different GitHub account, please use "Connect GitHub" to log in.`
      );
    }
  }

  let targetGithubUsername = req.user.githubUsername || usernameParam;

  if (!targetGithubUsername) {
    throw new ApiError(400, "GitHub username is required to sync profile");
  }

  targetGithubUsername = targetGithubUsername
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\/$/, "")
    .trim();

  if (!targetGithubUsername) {
    throw new ApiError(400, "Invalid GitHub username provided");
  }

  try {
    await syncGithubProfileForUser(userId, targetGithubUsername);

    const updatedUser = await User.findById(userId);

    return res.status(200).json(
      new ApiResponse(200, "GitHub profile synchronized successfully", {
        githubProfile: updatedUser.githubProfile,
        badges: updatedUser.badges,
        githubUsername: updatedUser.githubUsername,
        user: toSafeUser(updatedUser),
      })
    );
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      throw new ApiError(404, `GitHub user "${targetGithubUsername}" was not found.`);
    }
    if (err.code === "RATE_LIMITED") {
      throw new ApiError(429, "GitHub API rate limit reached. Please wait a moment and try again.");
    }
    if (err.code === "INVALID_INPUT") {
      throw new ApiError(400, err.message);
    }
    throw new ApiError(500, err.message || "Failed to synchronize GitHub profile.");
  }
});

const connectGithubWithOAuth = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { code, targetUsername } = req.body;

  if (!code) {
    throw new ApiError(400, "Authorization code is required to connect GitHub");
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = req.body.redirect_uri || process.env.GITHUB_REDIRECT_URI || "http://localhost:5173/auth/github/callback";

  if (!clientId || !clientSecret) {
    throw new ApiError(500, "GitHub OAuth credentials are not configured on the server");
  }

  // 1. Exchange code for GitHub access token
  let accessToken;
  try {
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      },
      { headers: { Accept: "application/json" } }
    );

    if (tokenRes.data?.error) {
      throw new ApiError(401, tokenRes.data.error_description || tokenRes.data.error || "GitHub verification failed");
    }

    accessToken = tokenRes.data?.access_token;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, "Failed to exchange GitHub authorization code: " + err.message);
  }

  if (!accessToken) {
    throw new ApiError(401, "GitHub did not return an access token");
  }

  // 2. Fetch authenticated GitHub user
  let ghUserRes;
  try {
    ghUserRes = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "DevConnect-App",
      },
    });
  } catch (err) {
    throw new ApiError(401, "Failed to fetch GitHub profile: " + err.message);
  }

  const profile = ghUserRes.data;
  const authenticatedLogin = (profile.login || "").toLowerCase().trim();
  const githubId = String(profile.id);

  if (!authenticatedLogin) {
    throw new ApiError(400, "Unable to determine username of authenticated GitHub account");
  }

  // 3. Verify target username matches authenticated account if specified
  if (targetUsername) {
    const cleanTarget = targetUsername
      .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
      .replace(/\/$/, "")
      .toLowerCase()
      .trim();

    if (cleanTarget && cleanTarget !== authenticatedLogin) {
      throw new ApiError(
        400,
        `You signed in on GitHub as @${profile.login}, but entered @${targetUsername}. Please log into the corresponding GitHub account.`
      );
    }
  }

  // 4. Check if another user already linked this GitHub account
  const existingUser = await User.findOne({
    githubId,
    _id: { $ne: userId },
  });

  if (existingUser) {
    throw new ApiError(
      409,
      `This GitHub account (@${profile.login}) is already linked to another DevConnect user (@${existingUser.username}).`
    );
  }

  // 5. Update user
  req.user.githubId = githubId;
  req.user.githubUsername = authenticatedLogin;
  await req.user.save({ validateModifiedOnly: true });

  // 6. Run sync immediately
  let syncedProfile = null;
  try {
    syncedProfile = await syncGithubProfileForUser(userId, authenticatedLogin);
  } catch (syncErr) {
    console.warn(`[connectGithubWithOAuth] Initial sync warning for @${authenticatedLogin}:`, syncErr.message);
  }

  const updatedUser = await User.findById(userId);

  return res.status(200).json(
    new ApiResponse(200, "GitHub account connected and synchronized successfully", {
      user: toSafeUser(updatedUser),
      githubProfile: updatedUser.githubProfile || syncedProfile,
      badges: updatedUser.badges,
      githubUsername: updatedUser.githubUsername,
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
  rejectConnectRequest,
  getUserConnections,
  syncGithubProfile,
  connectGithubWithOAuth,
};

