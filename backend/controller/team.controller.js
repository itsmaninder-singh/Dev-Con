import {Team } from "../models/team.model.js"
import {Project } from "../models/project.model.js"
import {User } from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import  {asyncHandler} from "../utils/asyncHandler.js"

const isSihTeam = async (team) => {
    if (!team.project) return false;
    const project = await Project.findById(team.project).select("event");
    return project?.event === "SIH";
};

const hasFemaleMember = async (memberUserIds) => {
    const femaleCount = await User.countDocuments({
        _id: { $in: memberUserIds },
        gender: "female",
    });
    return femaleCount > 0;
};

const createTeam = asyncHandler(async(req,res)=>{
    const {name, description, project, skillsNeeded, maxMembers, visibility, tags} = req.body;
    if(!name){
        throw new ApiError(400,"Team Name is requried");
    }
    const team = await Team.create({
      name,
      description,
      creator: req.user._id,
      project: project || null,
      skillsNeeded,
      maxMembers,
      visibility,
      tags,
      members: [{ user: req.user._id, role: "Creator" }],
    });

    const populatedTeam = await Team.findById(team._id)
      .populate("creator", "name username profilePicture")
      .populate("members.user", "name username profilePicture skills");

    return res.status(201).json(new ApiResponse(201, "Team created successfully", populatedTeam || team));
});

const editTeams = asyncHandler(async(req,res)=>{
    const team = await Team.findById(req.params.id);
    if(!team){
        throw new ApiError(404,"Team Not found");
    }
    if(team.creator.toString()!==req.user._id.toString()){
        throw new ApiError(403,"Only the team creator can edit this team");
    }
    const allowedFields = ["name","description","skillsNeeded", "maxMembers", "visibility", "tags", "status"]
    allowedFields.forEach((field)=>{
        if(req.body[field]!==undefined) team[field]= req.body[field];
    });
    team.refreshStatus();
    await team.save();
    return res.status(200).json(new ApiResponse(200,"Team updated successfully",team));
});

const getTeamDetails = asyncHandler(async(req,res)=>{
    const team= await Team.findById(req.params.id)
    .populate("creator", "name username profilePicture reputation")
    .populate("members.user", "name username profilePicture skills reputation")
    .populate("project", "title type status");

    if(!team){
        throw new ApiError(404,"Team Not found");
    }
    return res.status(200).json(new ApiResponse(200,"Team detaills fetched",team));
});

const getTeams = asyncHandler(async(req,res)=>{
    const {status , skill , search, page=1, limit=20} = req.query;
    const filter = {visibility: "public"};

    if(status) filter.status = status;
    if(skill) filter.skillsNeeded = {
        $in:[new RegExp(skill, "i")]
    };
    if (search) filter.name = {
        $regex: search ,
        $options: "i"
    };
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 50);

    const [teams, total] = await Promise.all([
        Team.find(filter)
            .populate("creator","name username profilePicture")
            .sort({createdAt: -1})
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        Team.countDocuments(filter),
    ]);

    return res.status(200).json(new ApiResponse(200,"Teams fetched successfully",{
        teams,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    }));
});

const joinTeam = asyncHandler(async(req,res)=>{
    const team = await Team.findById(req.params.id);
    if(!team){
        throw new ApiError(404,"Team not found");
    }
    if(team.status!=="recruiting"){
        throw new ApiError(400, "This team is not open for joining");
    }
    const alreadyMember = team.members.some(
        (m)=> m.user.toString() === req.user._id.toString()
    );
    if(alreadyMember){
        throw new ApiError(400,"You are already a member of this team");

    }
    if(team.members.length >= team.maxMembers){
        throw new ApiError(400,"Team is already full");
    }
    const willBeFull = team.members.length + 1 >= team.maxMembers;
    if (willBeFull && (await isSihTeam(team))) {
        const memberIdsAfterJoin = [...team.members.map((m) => m.user), req.user._id];
        if (!(await hasFemaleMember(memberIdsAfterJoin))) {
            throw new ApiError(400, "SIH requires at least one female teammate before the team can be finalized. Add a female teammate before this team fills up.");
        }
    }

    team.members.push({user: req.user._id,
        role : req.body.role || "Member"
    })
    team.refreshStatus();
    await team.save();

    return res.status(200).json(new ApiResponse(200,"Joined team successfully",team));

});

const removeMember = asyncHandler(async(req,res)=>{
    const team = await Team.findById(req.params.id);

    if(!team){
        throw new ApiError(404,"Team not found");
    }
    const isCreator = team.creator.toString() === req.user._id.toString();
  const isSelf = req.params.userId === req.user._id.toString();

  if (!isCreator && !isSelf) {
    throw new ApiError(403, "Not authorized to remove this member");
  }
  if (team.status === "full" && (await isSihTeam(team))) {
    const remainingIds = team.members
      .filter((m) => m.user.toString() !== req.params.userId)
      .map((m) => m.user);
    if (!(await hasFemaleMember(remainingIds))) {
      throw new ApiError(400, "Can't remove the only female teammate from a finalized SIH team");
    }
}

  team.members = team.members.filter((m) => m.user.toString() !== req.params.userId);
  team.refreshStatus();
  await team.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Member removed successfully", team));
});
export{
    createTeam,
    editTeams,
    getTeamDetails,
    getTeams,
    joinTeam,
    removeMember
};
