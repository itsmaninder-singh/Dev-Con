import axios from "axios";

const defaultBase = import.meta.env.DEV ? "http://localhost:6969/api/v1" : "/api/v1";
const rawBase = import.meta.env.VITE_API_URL || defaultBase;
const BASE_URL = rawBase.endsWith("/api/v1")
  ? rawBase
  : `${rawBase.replace(/\/+$/, "")}/api/v1`;

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // required: refresh token travels as an httpOnly cookie
});

// Attach the in-memory access token to every request once it's set.
let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: automatically refresh expired access token and replay queued requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Global handling for incomplete profile: redirect to onboarding
    if (error.response?.status === 403 && error.response?.data?.code === "PROFILE_INCOMPLETE") {
      if (typeof window !== "undefined" && window.location.pathname !== "/onboarding") {
        window.location.href = "/onboarding";
      }
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (
      !error.response ||
      error.response.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/logout") ||
      !accessToken
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newSession = data?.data;
      const newToken = newSession?.accessToken;
      if (!newToken) {
        throw new Error("No token returned on refresh");
      }
      setAccessToken(newToken);
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      setAccessToken(null);
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// Normalizes ApiError responses ({ statusCode, message, ... }) into a plain message.
const extractMessage = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong. Please try again.";

export const authApi = {
  register: async (payload) => {
    try {
      const { data } = await api.post("/auth/register", payload);
      return data.data; // { user, accessToken }
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },

  login: async (payload) => {
    try {
      const { data } = await api.post("/auth/login", payload);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },

  google: async (payload) => {
    try {
      const body = typeof payload === "string" ? { idToken: payload } : payload;
      const { data } = await api.post("/auth/google", body);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },

  github: async (code) => {
    try {
      const { data } = await api.post("/auth/github", { code });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },

  refresh: async () => {
    const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
    return data.data;
  },

  logout: async () => {
    await api.post("/auth/logout");
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    try {
      const { data } = await api.post("/auth/change-password", { currentPassword, newPassword });
      return data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
};

export const userApi = {
  getMe: async () => {
    try {
      const { data } = await api.get("/users/me");
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  getUserByUsername: async (username) => {
    try {
      const { data } = await api.get(`/users/${username}`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  updateProfile: async (payload) => {
    try {
      const { data } = await api.patch("/users/me/profile", payload);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  toggleAvailability: async (isAvailable) => {
    try {
      const { data } = await api.patch("/users/me/availability", { isAvailable });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  updateAvailableFor: async (availableFor) => {
    try {
      const { data } = await api.patch("/users/me/available-for", { availableFor });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  uploadProfilePicture: async (formData) => {
    try {
      const { data } = await api.post("/users/me/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  uploadCoverPicture: async (formData) => {
    try {
      const { data } = await api.post("/users/me/cover-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  blockUser: async (userId) => {
    try {
      const { data } = await api.post(`/users/${userId}/block`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  unblockUser: async (userId) => {
    try {
      const { data } = await api.post(`/users/${userId}/unblock`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  sendConnectRequest: async (userId) => {
    try {
      const { data } = await api.post(`/users/${userId}/connect`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  acceptConnectRequest: async (notifId) => {
    try {
      const { data } = await api.post(`/users/connect/${notifId}/accept`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  getUserConnections: async (usernameOrId) => {
    try {
      const { data } = await api.get(`/users/${usernameOrId}/connections`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
};

export const reportApi = {
  createReport: async ({ reportedUserId, reason, description = "", chatId = null, messageId = null }) => {
    try {
      const { data } = await api.post("/reports", {
        reportedUserId,
        reason,
        description,
        chatId,
        messageId,
      });
      return data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  getMyReports: async () => {
    try {
      const { data } = await api.get("/reports/mine");
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
};

export const teamApi = {
  getTeams: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await api.get(`/teams${query ? `?${query}` : ""}`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  getTeamDetails: async (teamId) => {
    try {
      const { data } = await api.get(`/teams/${teamId}`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  createTeam: async (payload) => {
    try {
      const { data } = await api.post("/teams", payload);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  joinTeam: async (teamId, role = "Member") => {
    try {
      const { data } = await api.post(`/teams/${teamId}/join`, { role });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  removeMember: async (teamId, userId) => {
    try {
      const { data } = await api.delete(`/teams/${teamId}/members/${userId}`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  updateTeam: async (teamId, patch) => {
    try {
      const { data } = await api.patch(`/teams/${teamId}`, patch);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
};

export const projectApi = {
  getProjects: async () => {
    try {
      const { data } = await api.get("/projects");
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  getProjectDetails: async (projectId) => {
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  createProject: async (payload) => {
    try {
      const { data } = await api.post("/projects", payload);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  joinProject: async (projectId, role = "Collaborator") => {
    try {
      const { data } = await api.post(`/projects/${projectId}/join`, { role });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
};


export const aiApi = {
  analyzeTeamFit: async ({ teamId, candidateUserId }) => {
    try {
      const { data } = await api.post("/ai/analyze-team-fit", { teamId, candidateUserId });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  analyzeCompatibility: async ({ targetUserId }) => {
    try {
      const { data } = await api.post("/ai/analyze-compatibility", { targetUserId });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  generateIdeas: async (domain) => {
    try {
      const { data } = await api.post("/ai/generate-ideas", { domain });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  assignRoles: async ({ targetType = "team", targetId }) => {
    try {
      const { data } = await api.post("/ai/assign-roles", { targetType, targetId });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
};

export const chatApi = {
  getMyChats: async () => {
    try {
      const { data } = await api.get("/chats");
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  getOrCreateDirectChat: async (userId) => {
    try {
      const { data } = await api.get(`/chats/direct/${userId}`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  getMessages: async (chatId, page = 1, limit = 30) => {
    try {
      const { data } = await api.get(`/chats/${chatId}/messages?page=${page}&limit=${limit}`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  sendMessage: async (chatId, content, mentions = []) => {
    try {
      const { data } = await api.post(`/chats/${chatId}/messages`, { content, mentions });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  createGroupChat: async ({ name, participantIds, team = null, project = null }) => {
    try {
      const { data } = await api.post("/chats/group", { name, participantIds, team, project });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  promoteDemoteAdmin: async (chatId, userId, action) => {
    try {
      const { data } = await api.patch(`/chats/${chatId}/members/${userId}/role`, { action });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  kickGroupMember: async (chatId, userId) => {
    try {
      const { data } = await api.delete(`/chats/${chatId}/members/${userId}`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  leaveGroup: async (chatId) => {
    try {
      const { data } = await api.post(`/chats/${chatId}/leave`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  toggleAnnouncementOnly: async (chatId) => {
    try {
      const { data } = await api.patch(`/chats/${chatId}/announcement-only`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  toggleMute: async (chatId) => {
    try {
      const { data } = await api.patch(`/chats/${chatId}/mute`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  generateInviteLink: async (chatId) => {
    try {
      const { data } = await api.post(`/chats/${chatId}/invite`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  revokeInviteLink: async (chatId) => {
    try {
      const { data } = await api.delete(`/chats/${chatId}/invite`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  joinViaInvite: async (code) => {
    try {
      const { data } = await api.post(`/chats/join/${code}`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  editMessage: async (messageId, content) => {
    try {
      const { data } = await api.patch(`/messages/${messageId}`, { content });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  deleteMessage: async (messageId, forEveryone = false) => {
    try {
      const { data } = await api.delete(`/messages/${messageId}`, { data: { forEveryone } });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
};

export const notificationApi = {
  getNotifications: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await api.get(`/notifications${query ? `?${query}` : ""}`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  getUnreadCount: async () => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      return data.data; // { count }
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  markAsRead: async (id) => {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  markAllAsRead: async () => {
    try {
      const { data } = await api.patch("/notifications/read-all");
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  deleteNotification: async (id) => {
    try {
      const { data } = await api.delete(`/notifications/${id}`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
};

export const joinRequestApi = {
  sendJoinReq: async ({ targetType, targetId, message = "", roleAppliedFor = "Member" }) => {
    try {
      const { data } = await api.post("/join-requests", {
        targetType,
        targetId,
        message,
        roleAppliedFor,
      });
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  getReceivedRequests: async (status) => {
    try {
      const query = status ? `?status=${status}` : "";
      const { data } = await api.get(`/join-requests/received${query}`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  getSentRequests: async () => {
    try {
      const { data } = await api.get("/join-requests/sent");
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  acceptJoinReq: async (id) => {
    try {
      const { data } = await api.post(`/join-requests/${id}/accept`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  ignoreJoinRequest: async (id) => {
    try {
      const { data } = await api.post(`/join-requests/${id}/ignore`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
};

export const matchupApi = {
  getRecommendedUsers: async () => {
    try {
      const { data } = await api.get("/matchup/users");
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  getRecommendedTeams: async () => {
    try {
      const { data } = await api.get("/matchup/teams");
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
  getRecommendedProjects: async () => {
    try {
      const { data } = await api.get("/matchup/projects");
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
};

export const searchApi = {
  searchUsers: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await api.get(`/search/users${query ? `?${query}` : ""}`);
      return data.data;
    } catch (err) {
      throw new Error(extractMessage(err));
    }
  },
};


