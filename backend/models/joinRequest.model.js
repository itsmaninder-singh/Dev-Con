import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema({
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    targetType:{
        type:String,
        enum:["team","project"],
        required:true,
    },
    team:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Team",
        default:null,
    },
    project :{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Project",
        default:null,
    },
    receiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    message:{
        type:String,
        maxlength:300,
        default:"",

    },
    roleAppliedFor:{
        type:String,
        default:"",
    },
    status:{
        type:String,
        enum:["pending","accepted","rejected","ignored"],
        default:"pending",
    },
    respondedAt:{
        type:Date,
        default:null,

    },

          

},{timestamps:true});
joinRequestSchema.index({sender:1,team:1,project:1,status:1});
joinRequestSchema.index({receiver:1, status:1});

export const JoinRequest = mongoose.model("JoinRequest",joinRequestSchema);