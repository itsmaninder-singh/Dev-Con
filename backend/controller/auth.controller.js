import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from "../utils/generateTokens.js";

import { syncGithubProfileForUser } from "../utils/githubSync.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const toSafeUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  githubUsername: user.githubUsername,
  githubProfile: user.githubProfile,
  badges: user.badges,
  profilePicture: user.profilePicture,
  coverPicture: user.coverPicture,
  bio: user.bio,
  college: user.college,
  skills: user.skills,
  experience: user.experience,
  isAvailable: user.isAvailable,
  availableFor: user.availableFor,
  authProvider: user.authProvider,
  isPlatformAdmin: user.isPlatformAdmin,
  isProfileComplete: Boolean(user.isProfileComplete),
  phoneNumber: user.phoneNumber || { countryCode: "+91", number: "" },
  phone: user.phoneNumber || { countryCode: "+91", number: "" },
  connections: user.connections || [],
  reputation: user.reputation,
  createdAt: user.createdAt,
});


const sendAuthResponse = (res, statusCode, user, message) => {
  const isProfileComplete = Boolean(user.isProfileComplete);
  const accessToken = generateAccessToken(user._id, {
    userId: user._id,
    isProfileComplete,
    email: user.email,
    username: user.username,
  });
  const refreshToken = generateRefreshToken(user._id);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  return res.status(statusCode).json(
    new ApiResponse(statusCode, message, {
      user: toSafeUser(user),
      accessToken,
    })
  );
};

const deriveUniqueUsernameFromEmail = async (email) => {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    email = "user@devconnect.local";
  }
  const rawPrefix = email.split("@")[0].toLowerCase().trim();

  // Sanitize: lowercase, strip +, convert spaces, keep letters, numbers, dots, underscores, hyphens
  let sanitized = rawPrefix
    .replace(/\+/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_.-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 24);

  if (!sanitized || sanitized.length < 2) {
    sanitized = "dev";
  }

  // Check if base candidate is free
  if (!(await User.exists({ username: sanitized }))) {
    return sanitized;
  }

  // Handle collisions: append -2, -3, -4, etc.
  let suffixNum = 2;
  while (suffixNum <= 50) {
    const candidate = `${sanitized}-${suffixNum}`;
    if (!(await User.exists({ username: candidate }))) {
      return candidate;
    }
    suffixNum += 1;
  }

  // Random fallback for extreme collisions
  while (true) {
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const candidate = `${sanitized.slice(0, 18)}-${randomSuffix}`;
    if (!(await User.exists({ username: candidate }))) {
      return candidate;
    }
  }
};

const generateUniqueUsername = deriveUniqueUsernameFromEmail;

const register = asyncHandler(async (req, res) => {
  const { name, username, email, password, phoneNumber } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Full name is required");
  }
  if (name.trim().length < 2) {
    throw new ApiError(400, "Full name must be at least 2 characters");
  }

  if (!username || !username.trim()) {
    throw new ApiError(400, "Username is required");
  }
  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3 || cleanUsername.length > 30) {
    throw new ApiError(400, "Username must be between 3 and 30 characters");
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
    throw new ApiError(400, "Invalid username! Username can only contain letters, numbers, underscores, dots, and hyphens");
  }

  if (!email || !email.trim()) {
    throw new ApiError(400, "Email address is required");
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new ApiError(400, "Invalid email address! Please enter a valid email (e.g. user@gmail.com)");
  }
  if (cleanEmail.includes("@gmail") && !/@gmail\.com$/i.test(cleanEmail)) {
    throw new ApiError(400, "Invalid gmail! Please check your email domain (e.g. @gmail.com)");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  let formattedPhone = { countryCode: "+91", number: "" };
  if (phoneNumber) {
    if (typeof phoneNumber === "object") {
      const code = phoneNumber.countryCode ? String(phoneNumber.countryCode).trim() : "+91";
      const num = phoneNumber.number !== undefined ? String(phoneNumber.number).replace(/\D/g, "").trim() : "";
      if (num && (num.length < 6 || num.length > 15)) {
        throw new ApiError(400, "Invalid phone number format. Phone number should be between 7 and 15 digits.");
      }
      formattedPhone = { countryCode: code, number: num };
    } else if (typeof phoneNumber === "string" && phoneNumber.trim()) {
      const num = phoneNumber.replace(/\D/g, "").trim();
      if (num && (num.length < 6 || num.length > 15)) {
        throw new ApiError(400, "Invalid phone number format. Phone number should be between 7 and 15 digits.");
      }
      formattedPhone = { countryCode: "+91", number: num };
    }
  }

  const existingEmail = await User.findOne({ email: cleanEmail });
  if (existingEmail) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const existingUsername = await User.findOne({ username: cleanUsername.toLowerCase() });
  if (existingUsername) {
    throw new ApiError(409, "This username is already taken");
  }

  const user = await User.create({
    name: name.trim(),
    username: cleanUsername.toLowerCase(),
    email: cleanEmail,
    password,
    phoneNumber: formattedPhone,
    authProvider: "local",
  });

  return sendAuthResponse(res, 201, user, "Account created successfully");
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body; 

  if (!identifier || !password) {
    throw new ApiError(400, "email/username and password are required");
  }

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase().trim() }, { username: identifier.toLowerCase().trim() }],
  }).select("+password");

  if (!user) {
    throw new ApiError(404, "Account does not exist. Please register first.");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid password. Please check your credentials and try again.");
  }

  return sendAuthResponse(res, 200, user, "Logged in successfully");
});


const googleAuth = asyncHandler(async (req, res) => {
  const { idToken, accessToken } = req.body;
  if (!idToken && !accessToken) {
    throw new ApiError(400, "idToken or accessToken is required");
  }

  let payload;
  if (idToken) {
    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error("[googleAuth] verifyIdToken failed:", err?.message);
      throw new ApiError(401, "Invalid Google ID token");
    }
  } else if (accessToken) {
    try {
      const userinfoRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      payload = userinfoRes.data;
    } catch (err) {
      console.error("[googleAuth] userinfo fetch failed:", err?.response?.data || err?.message);
      throw new ApiError(401, "Failed to verify Google access token");
    }
  }

  if (!payload?.email) {
    throw new ApiError(401, "Google account has no verified email");
  }

  const normalizedEmail = payload.email.toLowerCase().trim();
  const googleId = payload.sub || payload.id;

  // Match on email first for linking, fallback to googleId
  let user = await User.findOne({ email: normalizedEmail });
  if (!user && googleId) {
    user = await User.findOne({ googleId });
  }

  if (!user) {
    // Auto-create account on the spot without separate registration step
    const username = await deriveUniqueUsernameFromEmail(normalizedEmail);
    user = await User.create({
      name: (payload.name && payload.name.trim()) || username,
      username,
      email: normalizedEmail,
      googleId,
      authProvider: "google",
      profilePicture: payload.picture || "",
      isProfileComplete: false,
    });
  } else {
    // Existing user -> Link OAuth details
    let needsSave = false;
    if (!user.googleId && googleId) {
      user.googleId = googleId;
      needsSave = true;
    }
    if (payload.picture && !user.profilePicture) {
      user.profilePicture = payload.picture;
      needsSave = true;
    }
    if (needsSave) {
      await user.save({ validateModifiedOnly: true });
    }
  }

  return sendAuthResponse(res, 200, user, "Logged in with Google successfully");
});

const githubAuth = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    throw new ApiError(400, "code is required");
  }

  let accessToken;
  try {
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
      },
      { headers: { Accept: "application/json" } }
    );
    accessToken = tokenRes.data.access_token;
  } catch (err) {
    throw new ApiError(401, "Failed to exchange GitHub code");
  }

  if (!accessToken) {
    throw new ApiError(401, "GitHub did not return an access token");
  }

  let githubProfile, githubEmails;
  try {
    [githubProfile, githubEmails] = await Promise.all([
      axios.get("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "DevConnect-App" },
      }),
      axios.get("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "DevConnect-App" },
      }),
    ]);
  } catch (err) {
    throw new ApiError(401, "Failed to fetch GitHub profile: " + (err.response?.data?.message || err.message));
  }

  const profile = githubProfile.data;
  const emailsList = Array.isArray(githubEmails.data) ? githubEmails.data : [];
  const primaryEmail =
    emailsList.find((e) => e.primary && e.verified)?.email ||
    emailsList.find((e) => e.verified)?.email ||
    emailsList[0]?.email ||
    profile.email;

  if (!primaryEmail) {
    throw new ApiError(401, "GitHub account has no accessible verified email");
  }

  const normalizedEmail = primaryEmail.toLowerCase().trim();
  const githubId = String(profile.id);

  // Match on email first for linking, fallback to githubId
  let user = await User.findOne({ email: normalizedEmail });
  if (!user && githubId) {
    user = await User.findOne({ githubId });
  }

  if (!user) {
    // Auto-create account on the spot without separate registration step
    const username = await deriveUniqueUsernameFromEmail(normalizedEmail);
    user = await User.create({
      name: (profile.name && profile.name.trim()) || profile.login || username,
      username,
      email: normalizedEmail,
      githubId,
      githubUsername: (profile.login || "").toLowerCase() || null,
      authProvider: "github",
      profilePicture: profile.avatar_url || "",
      isProfileComplete: false,
    });
  } else {
    // Existing user -> Link OAuth details
    let needsSave = false;
    if (!user.githubId) {
      user.githubId = githubId;
      needsSave = true;
    }
    if (profile.login && !user.githubUsername) {
      user.githubUsername = profile.login.toLowerCase();
      needsSave = true;
    }
    if (profile.avatar_url && !user.profilePicture) {
      user.profilePicture = profile.avatar_url;
      needsSave = true;
    }
    if (needsSave) {
      await user.save({ validateModifiedOnly: true });
    }
  }

  // Automatically sync GitHub profile stats (repos, streak, badges) in background
  if (user?.githubUsername) {
    syncGithubProfileForUser(user._id, user.githubUsername).catch((err) =>
      console.warn(`[githubAuth] Background sync notice for @${user.githubUsername}:`, err.message)
    );
  }

  return sendAuthResponse(res, 200, user, "Logged in with GitHub successfully");
});


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!incomingToken) {
    throw new ApiError(401, "No refresh token provided");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingToken);
  } catch (err) {
    throw new ApiError(401, "Refresh token expired or invalid, please log in again");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  return sendAuthResponse(res, 200, user, "Access token refreshed");
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  return res.status(200).json(new ApiResponse(200, "Logged out successfully"));
});
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "currentPassword and newPassword are required");
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, "newPassword must be at least 8 characters");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user || !user.password) {
    throw new ApiError(400, "Password change is not available for this account");
  }
  const matches = await user.matchPassword(currentPassword);
  if (!matches) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, "Password updated successfully"));
});

export {
  register,
  login,
  googleAuth,
  githubAuth,
  refreshAccessToken,
  logout,
  toSafeUser,
  changePassword,
  deriveUniqueUsernameFromEmail,
};
