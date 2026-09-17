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
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new ApiError(401, "Invalid or expired token");
    }
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

const requireCompleteProfile = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized, user not authenticated");
    }
    if (!req.user.isProfileComplete) {
        return res.status(403).json({
            statusCode: 403,
            success: false,
            code: "PROFILE_INCOMPLETE",
            message: "Please complete your profile onboarding before accessing this feature.",
            data: {
                isProfileComplete: false,
                missingFields: [
                    !req.user.name || req.user.name.length < 2 ? "name" : null,
                    !req.user.bio || req.user.bio.length < 10 ? "bio" : null,
                    !req.user.college ? "college" : null,
                    !req.user.skills || req.user.skills.length === 0 ? "skills" : null,
                ].filter(Boolean),
            }
        });
    }
    next();
});

export { protect, attachUserIfPresent, requireCompleteProfile };