import mongoose from "mongoose";
import { Notification } from "../model/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const isValidId =(id)=> mongoose.Types.ObjectId.isValid(id);