import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImageToCloudinary(imageBase64: string, folder = 'platevision/meals'): Promise<string> {
  try {
    const cleanBase64 = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;

    const result = await cloudinary.uploader.upload(cleanBase64, {
      folder: folder,
      resource_type: 'auto'
    });

    return result.secure_url;
  } catch (error) {
    console.error('[Backend] Cloudinary Upload Error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

export default cloudinary;
