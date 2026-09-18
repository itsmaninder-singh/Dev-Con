import {JoinRequest} from "../models/joinRequest.model.js";
import { Team } from "../models/team.model.js";
import { Project } from "../models/project.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { sendNotification } from "../utils/notify.js";
import { addUsertoEntityChat } from "../utils/SynchChatMessage.js";

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
        receiver = target.creator?._id || target.creator;
        if(target.status === "closed" || target.status === "full" || (target.members && target.members.length >= target.maxMembers)){
            throw new ApiError(400,"team is not open for join requests");
        }
    }else{
        target = await Project.findById(targetId);
        if(!target){
            throw new ApiError(404,"project not found");
        }
        receiver = target.owner?._id || target.owner || target.creator?._id || target.creator;
        if(target.status === "completed" || target.status === "on-hold"){
            throw new ApiError(400,"project is not open for join requests");
        }
    }

    if(!receiver){
        throw new ApiError(400, "Could not determine recipient/owner for this team or project");
    }

    const receiverIdStr = String(receiver._id || receiver);
    const senderIdStr = String(req.user._id);

    // Strict self-join guard
    if(receiverIdStr === senderIdStr){
        throw new ApiError(400, "You cannot send a join request to your own team/project as you are the owner");
    }

    // Check if already a member
    const isAlreadyMember = Array.isArray(target.members) && target.members.some((m) => {
        const uid = String(m?.user?._id || m?.user || m || "");
        return uid === senderIdStr;
    });
    if (isAlreadyMember) {
        throw new ApiError(400, "You are already a member of this team/project");
    }

    const existing = await JoinRequest.findOne({
        sender: req.user._id,
        [targetType]: targetId,
        status: "pending",
    });
    if (existing) {
        throw new ApiError(400, "You already have a pending request for this");
    }

    const JOINREQUEST = await JoinRequest.create({
        sender: req.user._id,
        targetType,
        [targetType]: targetId,
        receiver: receiverIdStr,
        message: message || `I would like to join your ${targetType}`,
        roleAppliedFor: roleAppliedFor || "Member",
    });

    await sendNotification({
      recipient: receiverIdStr,
      sender: req.user._id,
      type: "join_request",
      text: `wants to join your ${targetType} "${target.name || target.title}"`,
      joinRequest: JOINREQUEST._id,
    });
    return res.status(201).json(new ApiResponse(201,"Join Request Sent Successfully", JOINREQUEST));

});

const acceptJoinReq= asyncHandler(async(req,res)=>{
    const joinReq = await JoinRequest.findById(req.params.id);

    if(!joinReq){
        throw new ApiError(404,"Join request not found !");
    }
    if(joinReq.receiver.toString()!== req.user._id.toString()){
        throw new ApiError(403,"Not authorized to respond to this request");
    }
    if(joinReq.status !== "pending"){
        throw new ApiError(400, `Request already ${joinReq.status}`);
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
            await addUsertoEntityChat("team",team.id,joinReq.sender);
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
        user: joinReq.sender,
        role: joinReq.roleAppliedFor || "Contributor",
      });
      if (project.members.length >= project.maxTeamSize) {
        project.status = "in-progress";
      }
      await project.save();
      await addUsertoEntityChat("project", project._id, joinReq.sender);

    }
    }
    joinReq.status = "accepted";
    joinReq.respondedAt = new Date();
    await joinReq.save();

    await sendNotification({
      recipient: joinReq.sender,
      sender: req.user._id,
      type: "join_request_accepted",
      text: `accepted your request to join ${joinReq.targetType || "team"}`,
      joinRequest: joinReq._id,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Request accepted successfully", joinReq));
});

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

const getReceivedRequests = asyncHandler(async (req, res) => {
  const status = req.query.status || req.body?.status;
  const filter = { receiver: req.user._id };
  if (status) filter.status = status;

  const reqs = await JoinRequest.find(filter)
    .populate("sender", "name username profilePicture skills reputation")
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