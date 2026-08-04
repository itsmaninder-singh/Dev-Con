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
        console.log(`socket-con established : ${userId}`);

        socket.join(userId);
        redisClient.sAdd("online_users",userId);
        io.emit("presence:online",{ userId});

        socket.on("chat:join",async (chatId,callback)=>{
            try {
                const chat = await Chat.findById(chatId);
                if(!chat) return callback?.({ok:false,
                    error: "chat not found"
                });
                const isParticipant = chat.participants.some((p)=> p.toString()=== userId);
                if(!isParticipant){
                    return callback?.({ ok: false,
                    error: "Not a participant" });
                }  
                socket.join(chatId);  
                const result = await Message.updateMany({
                    chat: chatId,
                    sender: {$ne: socket.user._id},
                    deliveredTo: { $ne: socket.user._id }
            },
        {
            $addToSet: {deliveredTo: socket.user._id}
        });
        if(result.modifiedCount > 0)  {
            io.to(chatId).emit("message:delivered", {chatId, userId});

        }    
        callback?.({ ok: true });
            } catch (error) {
                callback?.({ ok: false, error: "Server error" });
                
            }
        });

        socket.on("chat:read", async(chatId, callback) => {
            try{
                const chat = await Chat.findById(chatId);
                if(!chat) {
                    return callback?.({ok:false,error:"chat not found"});

                    const isParticipant = chat.participants.some((p)=>p.toString()=== userId);
                    if(!isParticipant){
                        return callback?.({ok:false,error: "not a participant"});
                    }

                    const result = await Message.updateMany({
                        chat:chatId,
                        sender:{$ne: socket.user._id},
                        readBy:{$ne: socket.user._id}
                    },{
                        $addToSet:{ readBy: socket.user._id,
                            deliveredTo: socket.user._id
                        }
                    });
                    if(result.modifiedCount > 0){
                        await invaliddatechatCaches(chat);
                        io.to(chatId).emit("message:read",{chatId,userId});
                    }
                    callback?.({ok:true, modifiedCount:result.modifiedCount});
                }
                    }catch(err){
                        callback?.({ ok: false, error: "Server error" });

                    }
                });

                socket.on("message:send",async(chatId, content, mentions=[],callback)=>{
                    try{
                        if(await isRateLimited(userId)){
                            return callback?.({ok:false, error: "Slow Down - too many message at once"});

                        }
                        if(!content || !content.trim()){
                            return callback?.({ok:false,error: "Message can not be empty"});

                        }
                        if(content.length > 2000){
                            return callback?.({ok:false, error :"Message too long"});
                        }
                        const chat = await Chat.findById(chatId);

                        if(!chat) return callback?.({ok:false, error:" chat not found"});
                        const isParticipant = caht.participants.some((p)=> p.toString()=== userId);
                        if (!isParticipant) {
                            return callback?.({ ok: false, error: "Not a participant" });
                        }
                        if(chat.isGroup){
                            if(!canSendInGroup(chat, socket.user._id)){
                                return callback?.({ ok: false, error: "Only the leader/admins can send messages right now" });

                            }
                        }else{
                            const otherId = chat.participants.find((p)=> p.toString()!== userId);
                            if(otherId && (await isBlocked(socekt.user._id,otherId))){
                                return callback?.({ ok: false, error: "This message could not be sent" });
                            }
                        }
                        const permission = evaluateSendPermission(chat,socket.user._id);
                        if (!permission.allowed) {
                            return callback?.({ ok: false, error: permission.reason });
                        }
                        

                    }catch(error){

                    }
                })


            });
        };
        

    