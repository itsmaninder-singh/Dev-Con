import { User } from "../model/user.model.js";
import { Team } from "../model/team.model.js";
import { Project } from "../model/project.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const GetRecommendedUsers = asyncHandler(async(req,res)=>{
    const me = req.user;

    const candidates = await User.find({
        _id: {$ne: me._id},
        isAvialable: true,

    }).select("name username profilePicture skills reputation bio college");

    const formatted =  candidates.map((u)=>({
        user:u,
        skills: u.skills,
        reputation: u.reputation?.score || 0,
        completedProjectsCount: 0,


    }));
    const target ={
        skills: me.skills,
        sharedPastCollaborators: 0,
        techStackOverlapwithPastProjects: 0,
    };
    const ranked = rankMatches(formatted,target,20);
    
    return res
    .status(200)
    .json(new ApiResponse(200,"Recommended users fetched successfully",ranked));
});