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
        trim: true,
        maxlength: 2000
    },
    readBy:[{
        type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }]
},
{timestamps:true}
);
messageSchema.index({ chat: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);