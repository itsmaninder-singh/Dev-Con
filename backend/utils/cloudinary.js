import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,

});

const isConfigured = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

export const uploadOnCloudinary = async (localFilePath, folder = "devconnect") => {
  if (!localFilePath) return null;

  const cleanupLocal = () => {
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch {
      // non-fatal
    }
  };

  if (!isConfigured()) {
    console.warn("[cloudinary] Cloudinary is not configured in .env. Skipping image upload.");
    cleanupLocal();
    return null;
  }

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: "image",
    });
    cleanupLocal();
    return {
      url: response.secure_url,
      publicId: response.public_id,
    };
  } catch (error) {
    cleanupLocal();
    console.error("[cloudinary] Failed to upload image:", error?.message || error);
    return null;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId || !isConfigured()) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (error) {
    console.error("[cloudinary] Failed to delete image:", error?.message || error);
    return null;
  }
};

export default cloudinary;