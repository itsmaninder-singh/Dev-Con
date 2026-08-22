import { User } from "../models/user.model.js";
import { Team } from "../models/team.model.js";
import { Project } from "../models/project.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rankMatches } from "../utils/matchingEngine.js";


const getRecommendedUsers = asyncHandler(async(req,res)=>{
    const me = req.user;

    const candidates = await User.find({
        _id: {$ne: me._id},
        isAvailable: true,

    }).select("name username profilePicture skills reputation bio college");

    const formatted =  candidates.map((u)=>({
        user:u,
        skills: u.skills,
        reputationScore: u.reputation?.score || 0,
        completedProjectsCount: 0,


    }));
    const target ={
        skills: me.skills,
        sharedPastCollaborators: 0,
        techStackOverlapWithPastProjects: 0,
    };
    const ranked = rankMatches(formatted,target,20);

    return res
    .status(200)
    .json(new ApiResponse(200,"Recommended users fetched successfully",ranked));
});
const getRecommendedTeams = asyncHandler(async(req,res)=>{
    const me = req.user;
    const teams = await Team.find({status:"recruiting", visibility:"public"})
    .populate("creator","name username profilePicture reputation")
    .select("name description skillsNeeded maxMembers members creator");

    const formatted = teams.map((t)=>({
        team:t,
        skills:t.skillsNeeded,
        reputationScore:t.creator?.reputation?.score || 0,
        completedProjectsCount:0,

    }));
    const target = {
        skills: me.skills,
        sharedPastCollaborators:0,
        techStackOverlapWithPastProjects:0,
    }
    const ranked = rankMatches(formatted,target,20);
    return res
    .status(200)
    .json(new ApiResponse(200,"Recommended teams fetched successfully",ranked));
});
const getRecommendedProjects = asyncHandler(async(req,res)=>{
    const me = req.user;
    const projects = await Project.find({status:"recruiting"})
    .populate("owner","name username profilePicture reputation")
    .select("title description techStack rolesNeeded maxTeamSize members owner type");

    const formatted = projects.map((p)=>({
        project:p,
        skills:p.techStack,
        reputationScore:p.owner?.reputation?.score || 0,
        completedProjectsCount:0,
    }));
    const target = {
        skills: me.skills,
        sharedPastCollaborators:0,
        techStackOverlapWithPastProjects:0,

    }
    const ranked = rankMatches(formatted,target,20);
    return res
    .status(200)
    .json(new ApiResponse(200,"Recommended projects fetched successfully",ranked));
});

export {getRecommendedUsers,getRecommendedTeams,getRecommendedProjects};
