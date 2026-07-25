import jwt from "jsonwebtoken";
import xss from "xss"
import { User } from "../model/user.model.js";
import { Chat } from "../model/chat.model.js";
import { Message } from "../model/message.model.js";
import { evaluateSendPermission } from "../utils/chatGuard.js";
import { canSendInGroup } from "../utils/chatPermissions.js";
import { isBlocked } from "../utils/blockGuard.js";
import { notifyForNewMessage } from "../controller/chat.controller.js";
import redisClient from "../config/redis.js";

const MAX_MESSAGES= 10;
const WINDOW_SECONDS =10;
const isRateLimited = async(userId)=>{
    const key = `ratelimit:msg${userId}`;
    const count = await redisClient.incr(key);
    if(count ===1){
        await redisClient.expire(key,WINDOW_SECONDS);

    }
    return count > MAX_MESSAGES;
};

const chatListKey = (userId) => `chatlist:${userId}`;
const invaliddatechatCaches = async(chat)=>{
    const keys = chat.participants.map((p)=>chatListKey(p.toString()));
    keys.push(`messages:${chat._id.toString()}:p1:l30`);
    if(keys.length) await redisClient.del(keys);
};
const initSocket = (io) =>{
    io.use(async(socket,next)=>{
        try{
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
            if(!token) {
                return next(new Error("Not authorized, no token"));

            }
            const decoded = jwt.verify(token,process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("-password");
            if (!user) return next(new Error("User not found"));

            socket.user = user;
            next();

        }catch(err){
            next(new Error("Not authorized, invalid token"));

        }
    });

    io.on("connection", (socket)=>{
        const  userId = socket.user._id.toString();
        console.log(`socket con establish : ${userId}`);
    })
}