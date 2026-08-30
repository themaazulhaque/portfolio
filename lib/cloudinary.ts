import 'server-only';
import { v2 as cloudinary } from 'cloudinary';

let configured = false;

function configureCloudinary() {
  if (configured) return;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  configured = true;
}

export function isCloudinaryConfigured(): boolean {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resource_type?: string;
    public_id?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  configureCloudinary();
  const folder = options.folder ?? 'portfolio/media';
  const resourceType = options.resource_type ?? 'auto';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: options.public_id,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('No result from Cloudinary'));
        resolve(result as CloudinaryUploadResult);
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  configureCloudinary();
  await cloudinary.uploader.destroy(publicId);
}

export function extractCloudinaryPublicId(url: string): string | null {
  // Cloudinary URLs look like:
  // https://res.cloudinary.com/{cloud_name}/{type}/{version}/{folder}/{public_id}.{format}
  // or without version: https://res.cloudinary.com/{cloud_name}/{type}/{folder}/{public_id}.{format}
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('cloudinary.com')) return null;
    const parts = parsed.pathname.split('/').filter(Boolean);
    // parts: [type, version?, ...folder parts, file]
    if (parts.length < 3) return null;
    const typeIndex = parts.findIndex((p) => ['image', 'video', 'raw'].includes(p));
    if (typeIndex === -1) return null;
    const remaining = parts.slice(typeIndex + 1);
    // Skip version segment if present (starts with 'v')
    const start = remaining[0]?.startsWith('v') && /^v\d+$/.test(remaining[0]) ? 1 : 0;
    const publicIdParts = remaining.slice(start);
    // Remove the file extension from the last part
    if (publicIdParts.length > 0) {
      const last = publicIdParts[publicIdParts.length - 1];
      const dotIndex = last.lastIndexOf('.');
      if (dotIndex > 0) {
        publicIdParts[publicIdParts.length - 1] = last.substring(0, dotIndex);
      }
    }
    return publicIdParts.join('/');
  } catch {
    return null;
  }
}

export function isCloudinaryUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('cloudinary.com');
  } catch {
    return false;
  }
}

export { cloudinary };
