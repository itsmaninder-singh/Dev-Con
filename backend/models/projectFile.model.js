import path from "node:path";
import mongoose from "mongoose";

const MAX_PATH_LENGTH = 1024;
const MAX_PATH_SEGMENT_LENGTH = 255;
const MAX_FILE_CONTENT_BYTES = 1024 * 1024;

const normalizeProjectPath = (input) => {
  if (typeof input !== "string") {
    throw new Error("path must be a string");
  }

  const value = input.trim();
  if (!value || value.length > MAX_PATH_LENGTH) {
    throw new Error("path must be between 1 and 1024 characters");
  }
  if (value.includes("\\") || value.includes("\0") || path.posix.isAbsolute(value)) {
    throw new Error("path must be a relative POSIX path");
  }

  const segments = value.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("path contains an invalid segment");
  }
  if (
    segments.some(
      (segment) =>
        segment.length > MAX_PATH_SEGMENT_LENGTH || /[\x00-\x1F\x7F]/.test(segment),
    )
  ) {
    throw new Error("path contains an invalid filename segment");
  }

  return path.posix.normalize(value);
};

const projectFileSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_PATH_LENGTH,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_PATH_SEGMENT_LENGTH,
    },
    kind: {
      type: String,
      enum: ["file", "directory"],
      required: true,
    },
    language: {
      type: String,
      default: "plaintext",
      trim: true,
      maxlength: 100,
    },

    content: {
      type: String,
      default: "",
      validate: {
        validator: (value) => Buffer.byteLength(value || "", "utf8") <= MAX_FILE_CONTENT_BYTES,
        message: `content must not exceed ${MAX_FILE_CONTENT_BYTES} bytes`,
      },
    },
    contentVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
    size: {
      type: Number,
      default: 0,
      min: 0,
      max: MAX_FILE_CONTENT_BYTES,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

projectFileSchema.index({ project: 1, path: 1 }, { unique: true });
projectFileSchema.index({ project: 1, kind: 1, path: 1 });

projectFileSchema.pre("validate", function prepareProjectFile(next) {
  try {
    this.path = normalizeProjectPath(this.path);
    this.name = this.path.split("/").at(-1);

    if (this.kind === "directory") {
      this.content = "";
      this.language = "plaintext";
      this.size = 0;
    } else {
      this.size = Buffer.byteLength(this.content || "", "utf8");
    }

    next();
  } catch (error) {
    next(error);
  }
});

export const ProjectFile = mongoose.model("ProjectFile", projectFileSchema);
export { MAX_FILE_CONTENT_BYTES, normalizeProjectPath };
