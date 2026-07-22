import {Notification } from "../models/notification.model.js";
import { getIO } from "./SocketManager.js";
export const SendNotification = async({
    recipient,
    sender=null,
    type,
    text,
    chat=null,
    message=null,
    joinRequest = null,
})=>{
    try{
        if(sender && recipient.toString() === sender.toString()) return null;

        const notification = await Notification.create({
            recipient,
      sender,
      type,
      text,
      chat,
      message,
      joinRequest,
        });
        const populated = await notification.populate("sender", "name username profilePicture");
        try{
            const io=getIO();
            io.to(recipient.toString()).emit("notification:new",populated);

        }catch(err){

        }
        return populated;
    }catch(err){
        console.error("Failed to send notification: ->",err.message);
        return null;
    }


    
};
export const sendNotificationToMany = async (recipients, payload, excludeIds = []) => {
  const excludeSet = new Set(excludeIds.map((id) => id.toString()));
  const targets = recipients.filter((r) => !excludeSet.has(r.toString()));

  await Promise.all(targets.map((recipient) => sendNotification({ ...payload, recipient })));
}