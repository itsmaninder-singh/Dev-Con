import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { toSafeUser } from "./auth.controller.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

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
    "phoneNumber",
    "gender",
  ];
  const ALLOWED_GENDER = ["male", "female", "other", "prefer-not-to-say"];

  const updates = {};
  for (const field of editable) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
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

  const result = await uploadOnCloudinary(req.file.path, "devconnect/profile-pictures");
  if (!result) {
    throw new ApiError(500, "Failed to upload image, please try again");
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
    .json(new ApiResponse(200, "Profile picture updated", { profilePicture: user.profilePicture }));
});

const uploadCoverPicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image file uploaded");
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const result = await uploadOnCloudinary(req.file.path, "devconnect/cover-pictures");
  if (!result) {
    throw new ApiError(500, "Failed to upload image, please try again");
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
    .json(new ApiResponse(200, "Cover picture updated", { coverPicture: user.coverPicture }));
});


export{
    getMe,
    getUserByUsername,
    updateProfile,
    toggleAvailability,
    updateAvailableFor,
    uploadProfilePicture,
    uploadCoverPicture
};
