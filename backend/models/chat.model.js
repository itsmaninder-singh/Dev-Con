import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    isGroup: { 
        type: Boolean,
         default: false },

    
    name: { type: String,
         trim: true,
        default: "" 
    },
    groupAdmin: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        default: null },
    team: {
         type: mongoose.Schema.Types.ObjectId, 
         ref: "Team", 
         default: null },
    project: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        default: null },

    status: {
      type: String,
      enum: ["pending", "active"],
      default: function () {
        return this.isGroup ? "active" : "pending";
      },
    },

    initiator: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: "User",
          default: null },
  
    awaitingReply: {
         type: Boolean,
          default: false
         },

    lastMessage: {
      text: { 
        type: String, default: "" 
    },
      sender: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: "User" },
      sentAt: {
         type: Date 
        },
    },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ team: 1 });
chatSchema.index({ project: 1 });

export const Chat = mongoose.model("Chat", chatSchema);
