import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a buffer (from multer memoryStorage) to Cloudinary.
 * @returns {Promise<{public_id:string, url:string}>}
 */
export const uploadToCloudinary = (buffer, folder = 'bookhaven') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ public_id: result.public_id, url: result.secure_url });
      }
    );
    stream.end(buffer);
  });

export const deleteFromCloudinary = (publicId) =>
  publicId ? cloudinary.uploader.destroy(publicId) : Promise.resolve();

export default cloudinary;
