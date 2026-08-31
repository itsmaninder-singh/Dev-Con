import mongoose from "mongoose";

const collabRoomSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["active", "idle"],
      default: "idle",
    },

    readOnly: {
      type: Boolean,
      default: false,
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    sessionLog: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date, default: null },
      },
    ],
  },
  { timestamps: true }
);

collabRoomSchema.index({ project: 1 });
collabRoomSchema.index({ status: 1 });

export const CollabRoom = mongoose.model("CollabRoom", collabRoomSchema);
