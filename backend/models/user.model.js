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
        type:Number,
        unique:true,
        sparse:true, 
    },
    password:{
        type:String,
        select:false,
        required:function(){
            return !this.googleId && !this.githubId;
        },
        unique:true,
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
    coverPicturePublicId:{
        type:String,
        default:"",
    },
    coverPicture:{
        type:String,//cloudinary
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
        deault:Date.now
    },
    blockedUsers:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    isPlatformAdmin: { type: Boolean, default: false },
    AvailableFor:[{
        type:String,
        enum:[
            "Hackarthon",
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
        enum:["newcomer","ccontributor","builder","expert","legend"],
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
userSchema.pre("save",async function(next){
    if(!this.isModified("password") || !this.password) return next();
    this.password=await bcrypt.hash(this.password,10);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    if(!this.password) return false;
    return await bcrypt.compare(enteredPassword,this.password);
};



export const User = mongoose.model("User",userSchema);