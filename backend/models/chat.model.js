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
     participantsMeta: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    isGroup: { 
        type: Boolean,
         default: false },

    
    name: { type: String,
         trim: true,
        default: "" 
    },
     leader: { 
      type: mongoose.Schema.Types.ObjectId,
       ref: "User", 
       default: null
       },
    groupAdmin: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        default: null },
    team: {
         type: mongoose.Schema.Types.ObjectId, 
         ref: "Team", 
         default: null },
    announcementOnly: { 
      type: Boolean,
       default: false 
      },
    project: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        default: null },
    mutedBy: [{ 
      type: mongoose.Schema.Types.ObjectId,
       ref: "User" 
      }
    ],
    inviteCode: { 
      type: String,
      default: null 
      },
    inviteEnabled: {
       type: Boolean, 
       default: false
      },

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
chatSchema.index({ inviteCode: 1 });

chatSchema.methods.topAuthorityLabel = function () {
  return this.team || this.project ? "Leader" : "Admin";
};
export const Chat = mongoose.model("Chat", chatSchema);
