import {Project } from "../models/project.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"

const createProject = asyncHandler(async(req,res)=>{
    const {title, description, type, event, techStack, rolesNeeded, maxTeamSize, deadline, github, tags} = req.body;
    if(!title || !description || !type){
        throw new ApiError(400,"These are mandatory fields. Please fill to proceed :)");

    }
    const project = await Project.create({
    title,
    description,
    owner: req.user._id,
    type,
    event: event || "none",
    techStack,
    rolesNeeded,
    maxTeamSize,
    deadline,
    github,
    tags,
    members: [{ user: req.user._id, role: "Owner" }],

    });
    return res.status(201).json(new ApiResponse(201,"Project created succesfully !", project));

});

const editProject = asyncHandler(async(req,res)=>{
    const project = await Project.findById(req.params.id);
    if(!project){
        throw new ApiError(404,"Project Not Found ");

    }
    if(project.owner.toString() !==req.user._id.toString()){
        throw new ApiError(403,"Sorry, Only the project owner can edit this project :)")
    }
    const allowedFields = ["title", "description","type","event","status","techStack","rolesNeeded","maxTeamSize","deadline","github","tags"];
    allowedFields.forEach((field)=>{
        if(req.body[field] !== undefined) project[field]=req.body[field];
    });
    await project.save();
    return res.status(200).json(new ApiResponse(200,"Project updated successfully", project));
});

const getProjectDetails = asyncHandler(async(req,res)=>{
    const project = await Project.findById(req.params.id)
    .populate("owner","name username profilePicture reputation")
    .populate("members.user","name username profilePicture skills reputation");

    if(!project){
        throw new ApiError(404,"Project Not Found");

    }
    project.views+=1;
    await project.save();
    return res.status(200)
    .json(new ApiResponse(200, "Project details fetched",project));

});
const getProjects = asyncHandler(async(req,res)=>{
    const {type, event, status, tech, search, page=1, limit=20} =  req.query;
    const filter = {};
    if(type) filter.type = type;
    if(event) filter.event = event;
    if(status) filter.status = status;
    if(tech) filter.techStack = {
        $in:[new RegExp(tech, "i")]
    };
    if(search) filter.title = {
        $regex: search,
        $options: "i"
    };
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 50);

    const [projects, total] = await Promise.all([
        Project.find(filter)
            .populate("owner", "name username profilePicture")
            .sort({createdAt: -1})
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        Project.countDocuments(filter),
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200,"Project fetched succesfully",{
        projects,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    }));
});
const joinProject  = asyncHandler(async(req,res)=>{
    const project = await Project.findById(req.params.id);
    if(!project){
        throw new ApiError(404,"Project Not Found");
    }
    const ownerId = String(project.owner?._id || project.owner || "");
    if(ownerId && ownerId === req.user._id.toString()){
        throw new ApiError(400, "You cannot join your own project as you are already the owner");
    }
    if(project.status!=="recruiting"){
        throw new ApiError(403,"this project is not currently recruiting any members");
    }
    const alreadyMember = project.members.some((m)=> m.user.toString() ===req.user._id.toString()
    );
    if(alreadyMember){
        throw new ApiError(400,"you are already a member of this project");
    }
    if(project.members.length>=project.maxTeamSize){
        throw new ApiError(400,"project team is already full");

    }
    project.members.push({user: req.user._id,
        role: req.body.role || "contributor"
    });
    if(project.members.length>=project.maxTeamSize){
        project.status = "in-progress";
    }
    await project.save();

    return res
    .status(200).json(new ApiResponse(200,"Joined project successfully",project));
})


export {
    createProject,
    editProject,
    getProjectDetails,
    getProjects,
    joinProject




}
