import mongoose from "mongoose";
const projectSchema = new mongoose.Schema({
    title:{
        type: String,
        required:[true,"Project title is required"],
        maxlength:100,
        trim :true,
    },
    description:{
        type:String,
        required:[true, "Description is required"],
        maxlength: 1000,
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true,

    },
    type:{
        type:String,
        enum:["hackathon" ,"open-source","startup","college-project","freelance","other"],
        required: true,
        
    },
    event:{
        type:String,
        enum:["SIH","Gsoc","none"],
        default:"none",
    },
    status:{
        type: String,
        enum: ["recruiting","in-progress","completed","on-hold"],
        default: "recruiting",
    },
    techStack:[{
        type:String,
        trim:true,
    }],
    rolesNeeded:[{
        role:{ 
            type:String,
            required:true
        },
        skills:[String],
        filled:{
            type:Boolean,
            default:false
        },
    },
],
members:[
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
        },
        role: String,
        joinedAt:{
            type:Date,
            default:Date.now
        },
    },
],
maxTeamSize:{
    type:Number,
    default:4,
    min:1,
    max:20
},
deadline:{
    type:Date
},
github:{
    type:String,
    trim:true,
    default:""
},
tags:[String],
likes:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
}],
views:{
    type:Number,
    default:0
},

},{
    timestamps:true
});

projectSchema.index({ techStack: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ type: 1 });
projectSchema.index({ event: 1 });
projectSchema.index({ owner: 1 });
export const Project= mongoose.model("Project",projectSchema);