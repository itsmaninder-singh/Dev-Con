import {User } from "../models/user.model.js";

export const isBlocked = async(userAId, userBId)=>{
    const [userA,userB] = await Promise.all([
        User.findById(userAId).select("blockedUsers"),
        User.findById(userBId).select("blockedUsers"),
    ]);
    if(!userA || !userB) return false;
     const aBlockedB = userA.blockedUsers.some((id) => id.toString() === userBId.toString());
  const bBlockedA = userB.blockedUsers.some((id) => id.toString() === userAId.toString());

  return aBlockedB || bBlockedA;''
}
