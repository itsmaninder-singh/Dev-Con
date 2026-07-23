import {Chat} from "../models/chat.model.js"

export const addUsertoEntityChat = async(targetType,targetId,userId)=>{
    const filter=
    targetType === "team"?{team:targetId , isGroup:true}: { project: targetId, isGroup: true };

    const chat = await Chat.findOne(filter);
    if(!chat) return null;
    const already = chat.participants.some((p) => p.toString() === userId.toString());
  if (!already) {
    chat.participants.push(userId);
    chat.participantsMeta.push({ user: userId, joinedAt: new Date() });
    await chat.save();
  }
  return chat;

};

export const removeUserFromEntityChat = async (targetType, targetId, userId) => {
  const filter =
    targetType === "team" ? { team: targetId, isGroup: true } : { project: targetId, isGroup: true };

  const chat = await Chat.findOne(filter);
  if (!chat) return null;

  chat.participants = chat.participants.filter((p) => p.toString() !== userId.toString());
  chat.participantsMeta = chat.participantsMeta.filter((m) => m.user.toString() !== userId.toString());
  chat.admins = chat.admins.filter((a) => a.toString() !== userId.toString());

  await chat.save();
  return chat;
};
