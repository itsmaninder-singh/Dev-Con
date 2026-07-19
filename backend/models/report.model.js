import mongoose from "mongoose"
const reportSchema = new mongoose.Schema({
    reporter:{
        type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,

    },
    reportedUser:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,

    },
    reason:{
        type: String,
      enum: ["harassment", "fake_profile", "spam", "inappropriate_content", "other"],
      required: true,

    },
    description:{
        type:String,
        maxlength: 500,
        default:""
    },
    chat: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: "Chat",
          default: null
         },
    message: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: "Message",
          default: null
         },
    status: {
      type: String,
      enum: ["pending", "reviewed", "action_taken", "dismissed"],
      default: "pending",
    },
     reviewedBy: {
         type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
     },
    reviewNote: {
        type: String,
        maxlength: 500,
        default: "" 
    },
},
{timestamps:true});
reportSchema.index({ reportedUser: 1, status: 1 });
reportSchema.index({ reporter: 1 });

export const Report = mongoose.model("Report", reportSchema);