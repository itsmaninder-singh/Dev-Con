import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema({
    recipient:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    sender:{
         type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    
    },
    type:{
        type:String,
        enum:[
            "message",
            "mention",
            "connect_request",
            "connect_accepted",
            "join_request",
            "join_request_accepted",
            "group_promotion",
            "group_demotion",
            "group_kick",
            "group_leadership_transfer",
        ],
        required:true,
    },
    text: { 
        type: String,
        required: true,
        maxlength: 300
     },
    chat: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: "Chat",
          default: null
         },
    message: {
         type: mongoose.Schema.Types.ObjectId, 
         ref: "Message", 
         default: null },
    joinRequest: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "JoinRequest", 
        default: null },

    read: { 
        type: Boolean,
        default: false },

},
{timestamps:true});
notificationSchema.index({recipient:1,read:1,createdAt: -1})
export const Notification = mongoose.model("Notification", notificationSchema);