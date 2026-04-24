import streamifier from "streamifier";
import AppError from "../middlewares/AppError.js";
import cloudinary from "../config/cloudinary.js";

const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw AppError.internalError(
      "Cloudinary configuration is missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
};

const uploadImageBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    configureCloudinary();

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "eventify/events",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            AppError.internalError("Failed to upload image to Cloudinary."),
          );
        }
        resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return;
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

export { uploadImageBuffer, deleteCloudinaryImage };
