import { ApiError } from "./ApiError.js";


export const evaluateSendPermission = (chat,senderId)=>{
    const senderStr = senderId.toString();

    if(chat.isGroup){
        return {allowed:true,updates:{}};


    }
    if(!chat.initiator){
        return{
            allowed:true,
            updates:{initiator:senderId,status:"pending",awaitingReply:true},
        };
    }
    if (chat.status === "active") {
    return { allowed: true, updates: {} };
  }
  const isInitiator = chat.initiator.toString() === senderStr;
  if (isInitiator) {
    if (chat.awaitingReply) {
      return {
        allowed: false,
        reason: "You've already sent a message. Wait for them to reply before sending another.",
      };
    }
     return { allowed: true, updates: { awaitingReply: true } };
}
return { allowed: true, updates: { status: "active", awaitingReply: false } };
};
export const assertSendAllowed = (chat, senderId) => {
  const result = evaluateSendPermission(chat, senderId);
  if (!result.allowed) {
    throw new ApiError(403, result.reason);
  }
  return result.updates;
};
