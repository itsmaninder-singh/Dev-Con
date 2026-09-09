import { ProjectFile } from "../models/projectFile.model.js";
import { Project } from "../models/project.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isProjectMember } from "../services/collaboration/roomAuth.js";

const detectLanguage = (name) => {
  const ext = name.split(".").pop();
  const map = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    json: "json",
    md: "markdown",
    css: "css",
    html: "html",
  };
  return map[ext] || "plaintext";
};

const assertMember = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");
  if (!isProjectMember(project, userId)) {
    throw new ApiError(403, "You are not a member of this project");
  }
  return project;
};

const listFiles = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  await assertMember(projectId, req.user._id);

  const files = await ProjectFile.find({
    project: projectId,
    isDeleted: false,
  }).select("-content");

  res.status(200).json(new ApiResponse(200, "Files fetched", files));
});

const createFile = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { path, name, type, parent } = req.body;

  if (!path || !name) {
    throw new ApiError(400, "path and name are required");
  }

  await assertMember(projectId, req.user._id);

  const existing = await ProjectFile.findOne({ project: projectId, path });
  if (existing) throw new ApiError(409, "A file already exists at this path");

  const file = await ProjectFile.create({
    project: projectId,
    path,
    name,
    type: type === "folder" ? "folder" : "file",
    parent: parent || null,
    language: type === "folder" ? "plaintext" : detectLanguage(name),
    createdBy: req.user._id,
  });

  res.status(201).json(new ApiResponse(201, "File created", file));
});

const renameFile = asyncHandler(async (req, res) => {
  const { projectId, fileId } = req.params;
  const { name, path } = req.body;

  if (!name || !path) throw new ApiError(400, "name and path are required");

  await assertMember(projectId, req.user._id);

  const file = await ProjectFile.findOne({ _id: fileId, project: projectId });
  if (!file || file.isDeleted) throw new ApiError(404, "File not found");

  file.name = name;
  file.path = path;
  file.language = file.type === "file" ? detectLanguage(name) : file.language;
  await file.save();

  res.status(200).json(new ApiResponse(200, "File renamed", file));
});

const deleteFile = asyncHandler(async (req, res) => {
  const { projectId, fileId } = req.params;

  await assertMember(projectId, req.user._id);

  const file = await ProjectFile.findOne({ _id: fileId, project: projectId });
  if (!file) throw new ApiError(404, "File not found");

  file.isDeleted = true;
  await file.save();

  res.status(200).json(new ApiResponse(200, "File deleted", null));
});

const getFileContent = asyncHandler(async (req, res) => {
  const { projectId, fileId } = req.params;

  await assertMember(projectId, req.user._id);

  const file = await ProjectFile.findOne({ _id: fileId, project: projectId });
  if (!file || file.isDeleted) throw new ApiError(404, "File not found");

  res.status(200).json(new ApiResponse(200, "File fetched", file));
});

export { listFiles, createFile, renameFile, deleteFile, getFileContent };
