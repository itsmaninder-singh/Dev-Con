import {JoinRequest} from "../models/joinRequest.model.js";
import { Team } from "../models/team.model.js";
import { Project } from "../models/project.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";

const sendJoinReq = asyncHandler(async(req,res)=>{
    const {targetType,targetId,message,roleAppliedFor} = req.body;

    if(!["team","project"].includes(targetType)){
        throw new ApiError(400,'targetType must be "team" or "project"');
    }
    let target;
    let receiver;
    if(targetType==="team"){
        target = await Team.findById(targetId);
        if(!target){
            throw new ApiError(404,"team not found");
        }
        receiver = target.creator;
        if(target.status!=="open" || target.members.length>=target.maxMembers){
            throw new ApiError(400,"team is not open for join requests");
        }
    }else{
        target = await Project.findById(targetId);
        if(!target){
            throw new ApiError(404,"project not found");
        }
        receiver = target.creator;
        if(target.status!=="open" ){
            throw new ApiError(400,"project is not open for join requests");
        }
    }
    if(receiver.toString()===req.user._id.toString()){
        throw new ApiError(400,"you cannot send join request to your own team/project");
    }
    const existing = await JoinRequest.findOne({
        sender:req.user._id,
        [targetType]:targetId,
        status:"pending",
    });
    if (existing) {
    throw new ApiError(400, "You already have a pending request for this");
  }

    const JOINREQUEST= await JoinRequest.create({
        sender: req.user._id,
        targetType,
        [targetType]:targetId,
        receiver,
        message,
        roleAppliedFor,
    });
    return res.status(201).json(new ApiResponse(201,"Join Request SenT Successfully", JOINREQUEST))

});

const acceptJoinReq= asyncHandler(async(req,res)=>{
    const joinReq = await JoinRequest.findById(req.params.id);

    if(!joinReq){
        throw new ApiError(404,"Join request not found !");
    }
    if(joinReq.receiver.toString()!== req.user._id.toString()){
        throw new ApiError(403,"Not authorized to respond to this request");
    }
    if(joinReq.status!== "pending"){
        throw new ApiError(400.`Request already ${joinReq.status}`);

    }
    if(joinReq.targetType=== "team"){
        const team = await Team.findById(joinReq.team);
        if(!team){
            throw new ApiError(404,"Team no longer exists");
        }
        if(team.members.length >= team.maxMembers){
            throw new ApiError(400,"Team is already full");
        }
        const alreadyMember = team.members.some((m)=>m.user.toString()===joinReq.sender.toString());
        if(!alreadyMember){
            team.members.push({
                user: joinReq.sender,
                role: joinReq.roleAppliedFor || "Member",
            });
            team.refreshStatus();
            await team.save();
        }
    }else{
        const project = await Project.findById(joinReq.project);
        if(!project) throw new ApiError(404, "Project no longer exist");

        if(project.members.length >= project.maxTeamSize){
            throw new ApiError(400,"Project team ois already full");
        }
        const alreadyMember = project.members.some((m)=>m.user.toString() === joinReq.sender.toString())
         if (!alreadyMember) {
      project.members.push({
        user: joinRequest.sender,
        role: joinRequest.roleAppliedFor || "Contributor",
      });
      if (project.members.length >= project.maxTeamSize) {
        project.status = "in-progress";
      }
      await project.save();
    }
    }
    joinReq.status = "accepted";
    joinReq.respondedAt = new Date();
    await joinReq.save();

   return res
    .status(200)
    .json(new ApiResponse(200, "Request accepted successfully", joinRequest));
})

const ignoreJoinRequest = asyncHandler(async (req, res) => {
  const joinRequest = await JoinRequest.findById(req.params.id);

  if (!joinRequest) {
    throw new ApiError(404, "Join request not found");
  }

  if (joinRequest.receiver.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to respond to this request");
  }

  if (joinRequest.status !== "pending") {
    throw new ApiError(400, `Request already ${joinRequest.status}`);
  }

  joinRequest.status = "ignored";
  joinRequest.respondedAt = new Date();
  await joinRequest.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Request ignored", joinRequest));
});
const getReceivedRequests = asyncHandler(async(req,res)=>{
    const {status} = req.body;
    const filter = {receiver: req.user._id};
    if(status) filter.status = status;

    const reqs = await JoinRequest.find(filter)
    .populate("sender", "name username profilePicture skills reputatuion")
    .populate("team", "name")
    .populate("project", "title")
    .sort({ createdAt: -1 });
     return res
    .status(200)
    .json(new ApiResponse(200, "Received requests fetched", reqs));
});
const getSentReqs = asyncHandler(async(req,res)=>{
    const reqs = await JoinRequest.find({
        sender:req.user._id
    })
    .populate("team","name status")
    .populate("project", "title status")
    .sort({ createdAt: -1 });
    return res
    .status(200)
    .json(new ApiResponse(200, "Sent requests fetched", reqs));
})
export {
    getSentReqs,
    getReceivedRequests,
    ignoreJoinRequest,
    acceptJoinReq,
    sendJoinReq



    

}