import User from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { toSafeUser } from "./auth.controller.js";

const ALLOWED_EXPERIENCE = ["Fresher", "1-2 years", "2-5 years", "5+ years"];
const ALLOWED_AVAILABLE_FOR = [
  "Hackathon",
  "open source contribution",
  "college project",
  "startup",
  "freelance",
];

const getMe = asyncHandler(async(req,res)=>{
    const user = await User.findbyId(req.user._id);
    if(!user){
        throw new ApiError(404,"User Not Found");

    }
    return res.status(200).json(new ApiResponse(200,"Profile fetched successfully",user));
});

const getUserByUsername = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });
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
    "profilePicture",
    "coverPicture",
    "phoneNumber",
  ];

  const updates = {};
  for (const field of editable) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (updates.experience && !ALLOWED_EXPERIENCE.includes(updates.experience)) {
    throw new ApiError(400, `experience must be one of: ${ALLOWED_EXPERIENCE.join(", ")}`);
  }
  if (updates.skills && !Array.isArray(updates.skills)) {
    throw new ApiError(400, "skills must be an array of strings");
  }
  if (updates.bio && updates.bio.length > 200) {
    throw new ApiError(400, "bio must be 200 characters or fewer");
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

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
    { AvailableFor: availableFor },
    { new: true, runValidators: true }
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Available-for options updated", { AvailableFor: user.AvailableFor }));
});


export{
    getMe,
    getUserByUsername,
    updateProfile,
    toggleAvailability,
    updateAvailableFor
};