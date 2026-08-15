import express from "express";
import {
  getMe,
  getUserByUsername,
  updateProfile,
  toggleAvailability,
  updateAvailableFor,
} from "../controller/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const userRouter = express.Router();

userRouter.use(protect);

userRouter.get("/me", getMe);
userRouter.get("/:username", getUserByUsername);
userRouter.put("/me", updateProfile);
userRouter.put("/me/availability", toggleAvailability);
userRouter.put("/me/available-for", updateAvailableFor);

export default userRouter;