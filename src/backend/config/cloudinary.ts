import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'sjjuhyrg',
  api_key: process.env.CLOUDINARY_API_KEY || '935594826276186',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'fTa9rz6U_KznwY9pU_1mcCclJ1A',
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
