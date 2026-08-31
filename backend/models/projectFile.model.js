import mongoose from "mongoose";

const projectFileSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    
    path: {
      type: String,
      required: true,
      trim: true,
    },

    
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["file", "folder"],
      required: true,
      default: "file",
    },

    
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectFile",
      default: null,
    },

    
    language: {
      type: String,
      default: "plaintext",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    
    size: {
      type: Number,
      default: 0,
    },

    
    githubSha: {
      type: String,
      default: null,
    },

    
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


projectFileSchema.index({ project: 1, path: 1 }, { unique: true });
projectFileSchema.index({ project: 1, parent: 1 });
projectFileSchema.index({ project: 1, isDeleted: 1 });

export const ProjectFile = mongoose.model("ProjectFile", projectFileSchema);
