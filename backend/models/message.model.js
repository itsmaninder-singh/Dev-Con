import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    chat:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Chat",
        required:true,
    },
    sender:{
    type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
        
    },
    content:{
        type:String,
        required:true,
        maxlength: 4200
    },
     mentions: [{
         type: mongoose.Schema.Types.ObjectId, 
         ref: "User" 
    }],
     deliveredTo: [{
         type: mongoose.Schema.Types.ObjectId,
          ref: "User"
    }],
     deletedFor: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User"
     }],
      deletedForEveryone: {
        type: Boolean,
        default: false
         },
    readBy:[{
        type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    edited: { 
        type: Boolean,
         default: false 
        },
    editedAt: {
         type: Date,
          default: null
         },
},
{timestamps:true}
);
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