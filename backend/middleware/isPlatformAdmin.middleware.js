import {ApiError} from "../utils/ApiError.js";

export const requirePlatformAdmin = (req,res,next)=>{
    if(!req.user?.isPlateformAdmin){
        throw new ApiError(403,"Admin access required");
    }
    next();
};