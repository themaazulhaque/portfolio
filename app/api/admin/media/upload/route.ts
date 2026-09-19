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
  'application/zip',
  'application/x-zip-compressed',
]);

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
};

function guessExtFromName(name: string): string | null {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return null;
  return name.slice(dot + 1).toLowerCase();
}

function resolveExtension(mimeType: string, fileName: string): string {
  if (MIME_TO_EXT[mimeType]) return MIME_TO_EXT[mimeType];
  const fromName = guessExtFromName(fileName);
  if (fromName) return fromName;
  return 'bin';
}

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = request.cookies.get('admin_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await decrypt(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = request.headers.get('content-type') || 'unknown';
  const contentLength = request.headers.get('content-length') || 'unknown';
  console.log(`[upload] POST /api/admin/media/upload — Content-Type: ${contentType}, Content-Length: ${contentLength}`);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error('[upload] formData() parse failed:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: `Invalid multipart form data: ${err instanceof Error ? err.message : 'parse error'}` },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    const fields = Array.from(formData.keys());
    console.error('[upload] No file field. Fields present:', fields);
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  console.log(`[upload] File: name=${file.name}, type=${file.type}, size=${file.size}`);

  const effectiveMime = file.type || 'application/octet-stream';

  if (!ALLOWED_TYPES.has(effectiveMime)) {
    console.error(`[upload] Rejected MIME: ${effectiveMime}`);
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'Empty file' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    console.error(`[upload] File too large: ${file.size} bytes`);
    return NextResponse.json({ error: 'File is too large (max 10 MB)' }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let url: string;
  let filename: string;

  if (isCloudinaryConfigured()) {
    try {
      const resourceType = effectiveMime.startsWith('image/') ? 'image'
        : effectiveMime.startsWith('video/') ? 'video'
        : 'raw';
      const result = await uploadToCloudinary(buffer, {
        folder: 'portfolio/media',
        resource_type: resourceType,
      });
      url = result.secure_url;
      filename = result.public_id;
      console.log(`[upload] Cloudinary OK: ${url}`);
    } catch (cloudErr) {
      console.error('[upload] Cloudinary failed:', cloudErr instanceof Error ? cloudErr.message : cloudErr);
      return NextResponse.json({ error: 'Cloud storage upload failed' }, { status: 500 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('[upload] No Cloudinary in production');
    return NextResponse.json({ error: 'Cloud storage is not configured. Contact the administrator.' }, { status: 500 });
  } else {
    const ext = resolveExtension(effectiveMime, file.name);
    filename = `${uuidv4()}.${ext}`;
    const uploadPath = path.join(UPLOAD_DIR, filename);
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(uploadPath, buffer);
      console.log(`[upload] Local OK: ${uploadPath}`);
    } catch (fsErr) {
      console.error('[upload] Filesystem write failed:', fsErr instanceof Error ? fsErr.message : fsErr);
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }
    url = `/uploads/${filename}`;
  }

  const mediaType = effectiveMime.startsWith('image/') ? 'image'
    : effectiveMime.startsWith('video/') ? 'video'
    : 'document';

  try {
    await connectDB();
    const media = await Media.create({
      filename,
      originalName: file.name,
      mimeType: effectiveMime,
      size: file.size,
      url,
      type: mediaType,
    });

    await auditLog({ action: 'UPLOAD', resource: 'media', resourceId: media._id.toString(), details: safeFileName(file.name) });

    console.log(`[upload] Saved media record: ${media._id} → ${url}`);
    return NextResponse.json({ media: JSON.parse(JSON.stringify(media)) });
  } catch (dbErr) {
    console.error('[upload] Database error:', dbErr instanceof Error ? dbErr.message : dbErr);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
