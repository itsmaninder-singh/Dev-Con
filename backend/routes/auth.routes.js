import express from "express";
import {
  register,
  login,
  googleAuth,
  githubAuth,
  refreshAccessToken,
  logout,
} from "../controller/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/google", googleAuth);
authRouter.post("/github", githubAuth);
authRouter.post("/refresh", refreshAccessToken);
authRouter.post("/logout", protect, logout);

export { authRouter };
