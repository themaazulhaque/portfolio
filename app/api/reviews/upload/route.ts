import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { isCloudinaryConfigured, uploadToCloudinary } from '@/lib/cloudinary';
import { isValidOrigin } from '@/lib/csrf';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'reviews');
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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
    return NextResponse.json({ error: 'Only JPG, PNG, and WebP images are accepted.' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let url: string;

  if (isCloudinaryConfigured()) {
    try {
      const result = await uploadToCloudinary(buffer, {
        folder: 'portfolio/reviews',
        resource_type: 'image',
      });
      url = result.secure_url;
    } catch {
      return NextResponse.json({ error: 'Cloudinary upload failed.' }, { status: 500 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Cloudinary production storage is not configured. Contact the administrator.' }, { status: 500 });
  } else {
    // Local fallback for development only
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filename = `${uuidv4()}.${ext}`;
    const uploadPath = path.join(UPLOAD_DIR, filename);
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(uploadPath, buffer);
    } catch {
      return NextResponse.json({ error: 'Failed to save file.' }, { status: 500 });
    }
    url = `/uploads/reviews/${filename}`;
  }

  return NextResponse.json({ url });
}
