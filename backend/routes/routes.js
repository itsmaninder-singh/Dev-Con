import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requirePlatformAdmin } from "../middleware/isPlatformAdmin.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

import {
  register,
  login,
  googleAuth,
  githubAuth,
  refreshAccessToken,
  logout,
} from "../controller/auth.controller.js";

import {
  getMe,
  getUserByUsername,
  updateProfile,
  toggleAvailability,
  updateAvailableFor,
  uploadProfilePicture,
  uploadCoverPicture,
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
  createGroupChat,
} from "../controller/chat.controller.js";

export const router = express.Router();




router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/google", googleAuth);
router.post("/auth/github", githubAuth);
router.post("/auth/refresh", refreshAccessToken);
router.post("/auth/logout", protect, logout);


router.get("/users/me", protect, getMe);
router.get("/users/:username", getUserByUsername);
router.patch("/users/me/profile", protect, updateProfile);
router.patch("/users/me/availability", protect, toggleAvailability);
router.patch("/users/me/available-for", protect, updateAvailableFor);
router.post("/users/me/profile-picture", protect, upload.single("profilePicture"), uploadProfilePicture);
router.post("/users/me/cover-picture", protect, upload.single("coverPicture"), uploadCoverPicture);


router.post("/teams", protect, createTeam);
router.get("/teams", getTeams);
router.get("/teams/:id", getTeamDetails);
router.patch("/teams/:id", protect, editTeams);
router.post("/teams/:id/join", protect, joinTeam);
router.delete("/teams/:id/members/:userId", protect, removeMember);

router.post("/projects", protect, createProject);
router.get("/projects", getProjects);
router.get("/projects/:id", getProjectDetails);
router.patch("/projects/:id", protect, editProject);
router.post("/projects/:id/join", protect, joinProject);

router.post("/join-requests", protect, sendJoinReq);
router.get("/join-requests/received", protect, getReceivedRequests);
router.get("/join-requests/sent", protect, getSentReqs);
router.post("/join-requests/:id/accept", protect, acceptJoinReq);
router.post("/join-requests/:id/ignore", protect, ignoreJoinRequest);

router.get("/matchup/users", protect, getRecommendedUsers);
router.get("/matchup/teams", protect, getRecommendedTeams);
router.get("/matchup/aprojects", protect, getRecommendedProjects);

router.get("/notifications", protect, getNotifications);
router.get("/notifications/unread-count", protect, getUnreadCount);
router.patch("/notifications/:id/read", protect, markAsRead);
router.patch("/notifications/read-all", protect, markAllAsRead);
router.delete("/notifications/:id", protect, deleteNotification);


router.post("/reports", protect, createReport);
router.get("/reports/mine", protect, getMyReports);
router.get("/reports", protect, requirePlatformAdmin, getAllReports);
router.patch("/reports/:id/status", protect, requirePlatformAdmin, updateReportStatus);

router.post("/ai/generate-ideas", protect, generateIdeas);
router.post("/ai/assign-roles", protect, assignRoles);
router.post("/ai/analyze-compatibility", protect, analyzeCompatibility);
router.post("/ai/analyze-team-fit", protect, analyzeTeamFit);

router.get("/chats", protect, getMyChats);
router.get("/chats/direct/:userId", protect, getOrCreateDirectChat);
router.get("/chats/:chatId/messages", protect, getMessages);
router.post("/chats/group", protect, createGroupChat);

