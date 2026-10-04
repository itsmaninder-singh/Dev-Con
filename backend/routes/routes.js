import express from "express";
import { protect, requireCompleteProfile } from "../middleware/auth.middleware.js";
import { requirePlatformAdmin } from "../middleware/isPlatformAdmin.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { authLimiter, sensitiveActionLimiter } from "../middleware/rateLimiter.middleware.js";
import { projectFileRouter } from "./projectFile.routes.js";
import { searchRouter } from "./search.routes.js";

import {
  register,
  login,
  googleAuth,
  githubAuth,
  refreshAccessToken,
  logout,
  changePassword,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} from "../controller/auth.controller.js";

import {
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
} from "../controller/user.controller.js";

import {
  createTeam,
  editTeams,
  getTeamDetails,
  getTeams,
  joinTeam,
  removeMember,
} from "../controller/team.controller.js";

import {
  createProject,
  editProject,
  getProjectDetails,
  getProjects,
  joinProject,
} from "../controller/project.controller.js";

import {
  getSentReqs,
  getReceivedRequests,
  ignoreJoinRequest,
  acceptJoinReq,
  sendJoinReq,
} from "../controller/joinreq.controller.js";

import {
  getRecommendedUsers,
  getRecommendedTeams,
  getRecommendedProjects,
} from "../controller/matchup.controller.js";

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controller/notification.controller.js";

import {
  createReport,
  getMyReports,
  getAllReports,
  updateReportStatus,
} from "../controller/report.controller.js";

import { generateIdeas, assignRoles, analyzeCompatibility, analyzeTeamFit } from "../controller/ai.controller.js";

import {
  getMyChats,
  getOrCreateDirectChat,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  createGroupChat,
  markChatAsRead,
} from "../controller/chat.controller.js";

export const router = express.Router();

router.post("/auth/register", authLimiter, register);
router.post("/auth/login", authLimiter, login);
router.post("/auth/google", authLimiter, googleAuth);
router.post("/auth/github", authLimiter, githubAuth);
router.post("/auth/refresh", authLimiter, refreshAccessToken);
router.post("/auth/logout", protect, logout);
router.post("/auth/change-password", protect, sensitiveActionLimiter, changePassword);
router.post("/auth/forgot-password", sensitiveActionLimiter, forgotPassword);
router.get("/auth/verify-reset-token", verifyResetToken);
router.post("/auth/reset-password", sensitiveActionLimiter, resetPassword);

router.get("/users/me", protect, getMe);
router.get("/users/:username", getUserByUsername);
router.patch("/users/me/profile", protect, updateProfile);
router.patch("/users/me/availability", protect, requireCompleteProfile, toggleAvailability);
router.patch("/users/me/available-for", protect, requireCompleteProfile, updateAvailableFor);
router.post("/users/me/profile-picture", protect, upload.single("profilePicture"), uploadProfilePicture);
router.post("/users/me/cover-picture", protect, upload.single("coverPicture"), uploadCoverPicture);
router.post("/users/:userId/block", protect, requireCompleteProfile, blockUser);
router.post("/users/:userId/unblock", protect, requireCompleteProfile, unblockUser);
router.post("/users/:userId/connect", protect, requireCompleteProfile, sendConnectRequest);
router.post("/users/connect/:notifId/accept", protect, requireCompleteProfile, acceptConnectRequest);
router.post("/users/connect/:notifId/reject", protect, requireCompleteProfile, rejectConnectRequest);
router.get("/users/:usernameOrId/connections", protect, getUserConnections);
router.post("/users/sync-github", protect, syncGithubProfile);
router.post("/users/connect-github", protect, connectGithubWithOAuth);

router.post("/teams", protect, requireCompleteProfile, createTeam);
router.get("/teams", getTeams);
router.get("/teams/:id", getTeamDetails);
router.patch("/teams/:id", protect, requireCompleteProfile, editTeams);
router.post("/teams/:id/join", protect, requireCompleteProfile, joinTeam);
router.delete("/teams/:id/members/:userId", protect, requireCompleteProfile, removeMember);

router.post("/projects", protect, requireCompleteProfile, createProject);
router.get("/projects", getProjects);
router.get("/projects/:id", getProjectDetails);
router.patch("/projects/:id", protect, requireCompleteProfile, editProject);
router.post("/projects/:id/join", protect, requireCompleteProfile, joinProject);

router.post("/join-requests", protect, requireCompleteProfile, sendJoinReq);
router.get("/join-requests/received", protect, requireCompleteProfile, getReceivedRequests);
router.get("/join-requests/sent", protect, requireCompleteProfile, getSentReqs);
router.post("/join-requests/:id/accept", protect, requireCompleteProfile, acceptJoinReq);
router.post("/join-requests/:id/ignore", protect, requireCompleteProfile, ignoreJoinRequest);

router.get("/matchup/users", protect, getRecommendedUsers);
router.get("/matchup/teams", protect, requireCompleteProfile, getRecommendedTeams);
router.get("/matchup/projects", protect, requireCompleteProfile, getRecommendedProjects);

router.use("/search", searchRouter);

router.get("/notifications", protect, requireCompleteProfile, getNotifications);
router.get("/notifications/unread-count", protect, requireCompleteProfile, getUnreadCount);
router.patch("/notifications/:id/read", protect, requireCompleteProfile, markAsRead);
router.patch("/notifications/read-all", protect, requireCompleteProfile, markAllAsRead);
router.delete("/notifications/:id", protect, requireCompleteProfile, deleteNotification);

router.post("/reports", protect, requireCompleteProfile, sensitiveActionLimiter, createReport);
router.get("/reports/mine", protect, requireCompleteProfile, getMyReports);
router.get("/reports", protect, requirePlatformAdmin, getAllReports);
router.patch("/reports/:id/status", protect, requirePlatformAdmin, updateReportStatus);

router.post("/ai/generate-ideas", protect, requireCompleteProfile, generateIdeas);
router.post("/ai/assign-roles", protect, requireCompleteProfile, assignRoles);
router.post("/ai/analyze-compatibility", protect, requireCompleteProfile, analyzeCompatibility);
router.post("/ai/analyze-team-fit", protect, requireCompleteProfile, analyzeTeamFit);

router.get("/chats", protect, requireCompleteProfile, getMyChats);
router.get("/chats/direct/:userId", protect, requireCompleteProfile, getOrCreateDirectChat);
router.get("/chats/:chatId/messages", protect, requireCompleteProfile, getMessages);
router.post("/chats/:chatId/messages", protect, requireCompleteProfile, sendMessage);
router.patch("/chats/:chatId/messages/:messageId", protect, requireCompleteProfile, editMessage);
router.delete("/chats/:chatId/messages/:messageId", protect, requireCompleteProfile, deleteMessage);
router.post("/chats/group", protect, requireCompleteProfile, createGroupChat);
router.patch("/chats/:chatId/read", protect, requireCompleteProfile, markChatAsRead);
router.use("/projects", projectFileRouter);