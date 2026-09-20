import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      index: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
      maxlength: 4200,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deliveredTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

messageSchema.pre("save", function (next) {
  if (!this.conversationId && this.chat) {
    this.conversationId = this.chat;
  }
  if (this.isDeleted || this.deletedForEveryone) {
    this.isDeleted = true;
    this.deletedForEveryone = true;
  }
  next();
});
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.methods.computeStatus = function (participantIds = []) {
  const others = participantIds
    .map((p) => p.toString())
    .filter((p) => p !== this.sender.toString());

  if (others.length === 0) return "sent";

  const readSet = new Set(this.readBy.map((id) => id.toString()));
  const deliveredSet = new Set(this.deliveredTo.map((id) => id.toString()));

  const allRead = others.every((id) => readSet.has(id));
  if (allRead) return "read";

  const anyDelivered = others.some((id) => deliveredSet.has(id));
  if (anyDelivered) return "delivered";

  return "sent";
};

export const Message = mongoose.model("Message", messageSchema);