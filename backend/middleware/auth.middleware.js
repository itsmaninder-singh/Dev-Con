import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js";

const protect = asyncHandler(async (req,res,next) => {
    let token;
    if(req.headers.authorization?.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
    }
    if(!token){
        throw new ApiError(401," Unauthorized , No Token");

    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if(!user){
        throw new ApiError(401, "User not found");
    }
    req.user = user;
    next();
})

const attachUserIfPresent = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (user) req.user = user;
    } catch (err) {
       
    }
    next();
});

export {protect, attachUserIfPresent};