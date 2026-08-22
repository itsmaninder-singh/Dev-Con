import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js";
//verify jwt mtlb we will check whehter the user has already loginned or not!!

const protect = asyncHandler(async (req,res,next) => {
    let token;
    if(req.header.authorization?.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
    }
    if(!token){
        throw new ApiError(401," Unauthorized , No Token");

    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findbyId(decoded.id).select("-password");
    if(!user){
        throw new ApiError(401, "User not found");
    }
    req.user = user;
    next();
})
export {protect};