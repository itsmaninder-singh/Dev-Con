import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
{
    name:{
        type:String,
        required:true,
        trim:true,
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        unique:true,
        trim:true,
    },
    phoneNumber:{
        countryCode: {
            type: String,
            default: "+91",
            trim: true,
        },
        number: {
            type: String,
            default: "",
            trim: true,
        },
    },
    password:{
        type:String,
        select:false,
        required:function(){
            return !this.googleId && !this.githubId;
        },
        minlength:8,
        trim:true,
    },
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    profilePicture:{
        type:String,//cloudinary
        default:"",
    },
    profilePicturePublicId:{
        type:String,
        default:"",
    },
    coverPicture:{
        type:String,//cloudinary
        default:"",
    },
    coverPicturePublicId:{
        type:String,
        default:"",
    },
    //Oauths
    googleId:{
        type:String,
        default:null,
    },
    githubId:{
        type:String,
        default:null,
    },
    githubUsername:{
        type:String,
        default:null,
    },
    authProvider:{
        type:String,
        enum:["local","google","github"],
        default:"local",
    },

    bio:{
        type:String,
        default:"",
        maxlength:200,
    },
    gender:{
        type:String,
        enum:["male","female","other"],
        default:"other",
    },
    college:{
        type:String,
        default:"",
        trim:true,
    },
    skills:[{
        type:String,
        trim:true,
    }],
    experience:{
        type:String,
        enum:["Fresher","1-2 years","2-5 years","5+ years"],
        default:"Fresher",
    },
    experienceLevel:{
        type:String,
        default:"",
    },
    timezone:{
        type:String,
        default:"",
    },
    availability:{
        type:String,
        default:"",
    },
    preferredRole:{
        type:String,
        default:"",
    },
    personality:{
        type:String,
        default:"",
    },
    isAvailable:{
        type:Boolean,
        default:true,
    },
    lastSeen:{
        type:Date,
        default:Date.now
    },
    blockedUsers:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    connections:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    isPlatformAdmin: { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },
    availableFor:[{
        type:String,
        enum:[
            "Hackathon",
            "open source contribution",
            "college project",
            "startup",
            "freelance",
        ],
    },
],
 reputation:{
    score:{type: Number,
        default:0
    },
    level:{
        type:String,
        enum:["newcomer","contributor","builder","expert","legend"],
        default:"newcomer",
    },
 },
 githubProfile:{
    publicRepoCount:{ type:Number, default:0 },
    topRepos:[{
        name:String,
        description:String,
        url:String,
        stars:Number,
        language:String,
    }],
    streak:{
        current:{ type:Number, default:0 },
        longest:{ type:Number, default:0 },
    },
    lastSyncedAt:{ type:Date, default:null },
 },
 badges:{
    github:{ type:Number, default:0 },
    devconnectActivity:{ type:Number, default:0 },
    projectCount:{ type:Number, default:0 },
 },

},{
    timestamps:true
});
userSchema.methods.calculateIsProfileComplete = function () {
    const hasName = Boolean(this.name && String(this.name).trim().length >= 2);
    const hasBio = Boolean(this.bio && String(this.bio).trim().length >= 10);
    const hasCollege = Boolean(this.college && String(this.college).trim().length >= 2);
    const hasSkills = Boolean(Array.isArray(this.skills) && this.skills.filter(Boolean).length >= 1);

    return Boolean(hasName && hasBio && hasCollege && hasSkills);
};

userSchema.pre("save", async function(next){
    this.isProfileComplete = this.calculateIsProfileComplete();
    if(!this.isModified("password") || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    if(!this.password) return false;
    return await bcrypt.compare(enteredPassword,this.password);
};



export const User = mongoose.model("User",userSchema);
