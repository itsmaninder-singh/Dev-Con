import { Project } from "../../models/project.model.js";
import { CollabRoom } from "../../models/collabRoom.model.js";

const isProjectMember = (project, userId) => {
  if (project.owner.toString() === userId.toString()) return true;
  return project.members.some((m) => m.user.toString() === userId.toString());
};

const canJoinRoom = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { allowed: false, reason: "Project not found" };

  if (!isProjectMember(project, userId)) {
    return { allowed: false, reason: "Not a member of this project" };
  }

  return { allowed: true, project };
};

const canEditRoom = async (projectId, userId) => {
  const result = await canJoinRoom(projectId, userId);
  if (!result.allowed) return result;

  const room = await CollabRoom.findOne({ project: projectId });
  if (room && room.readOnly) {
    return { allowed: false, reason: "Workspace is currently read-only" };
  }

  return { allowed: true, project: result.project };
};

export { isProjectMember, canJoinRoom, canEditRoom };
