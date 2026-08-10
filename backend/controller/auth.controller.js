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

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Builds the object we're willing to send back to the client - never the password hash.
const toSafeUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
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
  reputation: user.reputation,
  createdAt: user.createdAt,
});

// Issues both tokens for a user, sets the refresh token as an httpOnly cookie,
// and sends the access token + user back in the response body.
const sendAuthResponse = (res, statusCode, user, message) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  return res.status(statusCode).json(
    new ApiResponse(statusCode, message, {
      user: toSafeUser(user),
      accessToken,
    })
  );
};

// Turns "some name" / "some.name@mail.com" into a unique, schema-valid username.
const generateUniqueUsername = async (seed) => {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) || "user";

  let candidate = base;
  let suffix = 0;
  while (await User.exists({ username: candidate })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
};

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password, phoneNumber } = req.body;

  if (!name || !username || !email || !password) {
    throw new ApiError(400, "name, username, email and password are required");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
  });
  if (existing) {
    throw new ApiError(409, "An account with this email or username already exists");
  }

  const user = await User.create({
    name,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    phoneNumber,
    authProvider: "local",
  });

  return sendAuthResponse(res, 201, user, "Account created successfully");
});

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body; // identifier = email or username

  if (!identifier || !password) {
    throw new ApiError(400, "email/username and password are required");
  }

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
  }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid credentials");
  }

  return sendAuthResponse(res, 200, user, "Logged in successfully");
});

// POST /api/v1/auth/google
// Body: { idToken } - the credential string from Google Identity Services on the frontend
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    throw new ApiError(400, "idToken is required");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    throw new ApiError(401, "Invalid Google token");
  }

  if (!payload?.email) {
    throw new ApiError(401, "Google account has no verified email");
  }

  let user = await User.findOne({
    $or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }],
  });

  if (!user) {
    const username = await generateUniqueUsername(payload.email.split("@")[0]);
    user = await User.create({
      name: payload.name || username,
      username,
      email: payload.email.toLowerCase(),
      googleId: payload.sub,
      authProvider: "google",
      profilePicture: payload.picture || "",
    });
  } else if (!user.googleId) {
    // Existing local/github account signing in with Google for the first time -> link it
    user.googleId = payload.sub;
    await user.save({ validateModifiedOnly: true });
  }

  return sendAuthResponse(res, 200, user, "Logged in with Google successfully");
});

// POST /api/v1/auth/github
// Body: { code } - the ?code= query param GitHub redirected back to the frontend with
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
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      axios.get("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);
  } catch (err) {
    throw new ApiError(401, "Failed to fetch GitHub profile");
  }

  const profile = githubProfile.data;
  const primaryEmail =
    githubEmails.data.find((e) => e.primary && e.verified)?.email ||
    githubEmails.data.find((e) => e.verified)?.email ||
    profile.email;

  if (!primaryEmail) {
    throw new ApiError(401, "GitHub account has no accessible verified email");
  }

  let user = await User.findOne({
    $or: [{ githubId: String(profile.id) }, { email: primaryEmail.toLowerCase() }],
  });

  if (!user) {
    const username = await generateUniqueUsername(profile.login || primaryEmail.split("@")[0]);
    user = await User.create({
      name: profile.name || profile.login,
      username,
      email: primaryEmail.toLowerCase(),
      githubId: String(profile.id),
      githubUsername: (profile.login || "").toLowerCase() || null,
      authProvider: "github",
      profilePicture: profile.avatar_url || "",
    });
  } else if (!user.githubId) {
    user.githubId = String(profile.id);
    if (profile.login) user.githubUsername = profile.login.toLowerCase();
    await user.save({ validateModifiedOnly: true });
  } else if (profile.login && !user.githubUsername) {
    user.githubUsername = profile.login.toLowerCase();
    await user.save({ validateModifiedOnly: true });
  }

  return sendAuthResponse(res, 200, user, "Logged in with GitHub successfully");
});

// POST /api/v1/auth/refresh
// Reads the refresh token cookie and issues a fresh access token (and rotates the refresh token).
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

// POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  return res.status(200).json(new ApiResponse(200, "Logged out successfully"));
});

export { register, login, googleAuth, githubAuth, refreshAccessToken, logout, toSafeUser };
