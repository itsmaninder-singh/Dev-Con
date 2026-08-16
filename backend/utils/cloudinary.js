import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,

});

export const uploadOnCloudinary = async(localFilePath, folder="devconnect")=>{
    if(!localFilePath) return null;
    try {
        const ressponse = await cloudinary.uploader.upload(localFilePath,{
            folder,
            resource_type: "image",
        });
        fs.unlink(localFilePath,()=>{});
        return{
            url: response.secure_url,
            publicId: response.public_id,
        };

        
    } catch (error) {
        fs.unlink(localFilePath, ()=>{});
        console.error("cloudinary failed to upload babu:",err.message);
        return null;
        
    }

};
export const deleteFromCloudinary = async(publicId)=>{
    if(!publicId) return null;
    try {
        return await cloudinary.uploader.destroy(publicId,{
            resource_type: "image"
        });
    } catch (error) {
        console.error("cloudinary failed to delete babu:",err.message);
        return null;

        
    }

};
export default cloudinary;