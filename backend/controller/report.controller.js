import mongoose from "mongoose";
import { Report } from "../model/report.model.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const isValidId = (id) =>mongoose.Types.ObjectId.isValid(id);
const VALID_REASONS=["harrasment", "fake_profile", "spam", "inappropriate_content", "other"];

const createReport = asyncHandler(async(req,res)=>{

    const{reportedUserId,reason,description = "",chatId=null,messageId=null}=req.body;
    if (!isValidId(reportedUserId)) throw new ApiError(400, "Valid reportedUserId is required");
    if (reportedUserId === req.user._id.toString()) throw new ApiError(400, "Are u out of ur mind! psycho");
    if (!VALID_REASONS.includes(reason)) {
    throw new ApiError(400, `reason must be one of: ${VALID_REASONS.join(", ")}`);

    
  }
  const targetExists = await User.exists({ _id: reportedUserId });
  if (!targetExists) throw new ApiError(404, "Reported user not found");

   const report = await Report.create({
    reporter: req.user._id,
    reportedUser: reportedUserId,
    reason,
    description: description.slice(0, 500),
    chat: chatId && isValidId(chatId) ? chatId : null,
    message: messageId && isValidId(messageId) ? messageId : null,
  });
  return res.status(201).json(new ApiResponse(201, "Report submitted - our team will review it and get your issue done within 24 hours , so please smile ", report));

});
const getMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ reporter: req.user._id })
    .populate("reportedUser", "name username profilePicture")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, "Your reports fetched", reports));
});
const getAllReports = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const reports = await Report.find(filter)
    .populate("reporter", "name username profilePicture")
    .populate("reportedUser", "name username profilePicture")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, "Reports fetched", reports));
});
const updateReportStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reviewNote = "" } = req.body;

  if (!isValidId(id)) throw new ApiError(400, "Invalid report id");
  if (!["reviewed", "action_taken", "dismissed"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const report = await Report.findById(id);
  if (!report) throw new ApiError(404, "Report not found");

  report.status = status;
  report.reviewNote = reviewNote.slice(0, 500);
  report.reviewedBy = req.user._id;
  await report.save();

  return res.status(200).json(new ApiResponse(200, "Report updated", report));
});
export { createReport, getMyReports, getAllReports, updateReportStatus };