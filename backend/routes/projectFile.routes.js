import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  listFiles,
  createFile,
  renameFile,
  deleteFile,
  getFileContent,
} from "../controller/projectFile.controller.js";

const projectFileRouter = express.Router();

projectFileRouter.use(protect);

projectFileRouter.get("/:projectId/files", listFiles);
projectFileRouter.post("/:projectId/files", createFile);
projectFileRouter.get("/:projectId/files/:fileId", getFileContent);
projectFileRouter.patch("/:projectId/files/:fileId", renameFile);
projectFileRouter.delete("/:projectId/files/:fileId", deleteFile);

export { projectFileRouter };
