import cloudinary from "./cloudinary.js";
import { env } from "../config/env.js";

export const uploadBufferToCloudinary = ({ buffer, filename, folder, resource_type = "image" }) => {
  const uploadFolder = folder || env.cloudinaryFolder;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        resource_type,
        public_id: filename ? filename.replace(/\.[^/.]+$/, "") : undefined,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};