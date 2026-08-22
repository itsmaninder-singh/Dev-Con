import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Team name is required"],
        trim:true,
        maxlength: 50,
    },
    description:{
        type:String,
        maxlength: 500,
        default:"",
    },
    creator:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    project:
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Project",
        default:null,

    },
    members:[{
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
        },
        role: String,
        joinedAt:{
            type:Date,
            default:Date.now
        },
    }],
    skillsNeeded:[{
        type:String,
        trim:true,
    }],
    maxMembers:{
        type:Number,
        default:4,
        min:1,
        max:20},
    status:{
        type:String,
        enum:["full","recruiting","closed"],
        default:"recruiting",
    },
    visibility:{
        type:String,
        enum:["public","private"],
        default:"public",
    },
    tags:[String],




},
{timestamps:true});
teamSchema.index({skillsNeeded:1});
teamSchema.index({status:1});
teamSchema.index({creator:1});

teamSchema.methods.refreshStatus = function() {
    if(this.status !== "closed"){
        this.status = this.members.length >= this.maxMembers ? "full" : "recruiting";
    }
};



export const Team = mongoose.model("Team",teamSchema)
