import { type NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from '@/lib/db';
import { Media } from '@/lib/models';
import { decrypt } from '@/lib/session';
import { auditLog } from '@/lib/audit';
import { isCloudinaryConfigured, uploadToCloudinary } from '@/lib/cloudinary';
import { isValidOrigin } from '@/lib/csrf';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm',
  'application/pdf',
]);
const SAFE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'application/pdf': 'pdf',
};

export async function POST(request: NextRequest) {
  // Origin check to prevent CSRF
  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Auth check
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await decrypt(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let url: string;
  let filename: string;

  if (isCloudinaryConfigured()) {
    try {
      const resourceType = file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('video/') ? 'video'
        : 'raw';
      const result = await uploadToCloudinary(buffer, {
        folder: 'portfolio/media',
        resource_type: resourceType,
      });
      url = result.secure_url;
      filename = result.public_id;
    } catch {
      return NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 500 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Cloudinary production storage is not configured. Contact the administrator.' }, { status: 500 });
  } else {
    // Fallback to local filesystem for development only
    const ext = SAFE_EXTENSIONS[file.type] ?? 'bin';
    filename = `${uuidv4()}.${ext}`;
    const uploadPath = path.join(UPLOAD_DIR, filename);
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(uploadPath, buffer);
    } catch {
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }
    url = `/uploads/${filename}`;
  }

  const mediaType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document';

  try {
    await connectDB();
    const media = await Media.create({
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url,
      type: mediaType,
    });

    await auditLog({ action: 'UPLOAD', resource: 'media', resourceId: media._id.toString(), details: file.name });

    return NextResponse.json({ media: JSON.parse(JSON.stringify(media)) });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
