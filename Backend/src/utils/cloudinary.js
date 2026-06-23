import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const removeLocalFile = async (localFilePath) => {
  if (!localFilePath) return;
  try {
    await fs.promises.unlink(localFilePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
  if (!localFilePath) return null;
  try {
    const options = {
      resource_type: resourceType,
      folder: resourceType === "video" ? "vidflow/videos" : "vidflow/images",
    };

    if (resourceType === "video") {
      const { size } = await fs.promises.stat(localFilePath);
      if (size < 20 * 1024 * 1024) {
        return await cloudinary.uploader.upload(localFilePath, options);
      }
      return await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(
          localFilePath,
          { ...options, chunk_size: 6 * 1024 * 1024 },
          (error, result) => error ? reject(error) : resolve(result)
        );
      });
    }

    return await cloudinary.uploader.upload(localFilePath, options);
  } finally {
    await removeLocalFile(localFilePath);
  }
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

const extractPublicId = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return null;
  const uploadMarker = "/upload/";
  const uploadIndex = cloudinaryUrl.indexOf(uploadMarker);
  if (uploadIndex === -1) return null;
  const pathWithVersion = cloudinaryUrl.slice(uploadIndex + uploadMarker.length);
  const withoutVersion = pathWithVersion.replace(/^v\d+\//, "");
  return withoutVersion.replace(/\.[^/.]+$/, "");
};

export { uploadOnCloudinary, deleteFromCloudinary, extractPublicId, removeLocalFile };
