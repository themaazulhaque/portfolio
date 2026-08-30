import { type NextRequest, NextResponse } from 'next/server';
import { readFile, existsSync } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db';
import { Project, SiteSettings, Media, Review } from '@/lib/models';
import { decrypt } from '@/lib/session';
import { auditLog } from '@/lib/audit';
import { isCloudinaryConfigured, uploadToCloudinary } from '@/lib/cloudinary';

function isLocalUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('/uploads/') || url.includes('/uploads/');
}

function getLocalFilePath(url: string): string {
  const clean = url.replace(/^\//, '');
  return path.join(process.cwd(), 'public', clean);
}

interface MigrationEntry {
  oldUrl: string;
  newUrl: string;
  status: 'success' | 'skipped' | 'error';
  error?: string;
}

export async function POST(request: NextRequest) {
  // Origin check
  const origin = request.headers.get('origin');
  if (origin) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `http://${request.headers.get('host') ?? 'localhost:3000'}`;
    let allowedHost: string;
    try { allowedHost = new URL(appUrl).host; } catch { allowedHost = ''; }
    if (allowedHost && origin && new URL(origin).host !== allowedHost) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Auth
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await decrypt(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
  }

  await connectDB();

  const results: MigrationEntry[] = [];
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  async function migrateOne(url: string, folder: string): Promise<MigrationEntry> {
    if (!url || !isLocalUrl(url)) {
      return { oldUrl: url, newUrl: url, status: 'skipped' };
    }
    const localPath = getLocalFilePath(url);
    if (!existsSync(localPath)) {
      return { oldUrl: url, newUrl: url, status: 'skipped', error: 'File not found locally' };
    }
    try {
      const buffer = await readFile(localPath);
      const ext = path.extname(localPath).toLowerCase().replace('.', '');
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
        webp: 'image/webp', gif: 'image/gif', avif: 'image/avif',
        mp4: 'video/mp4', webm: 'video/webm', pdf: 'application/pdf',
      };
      const mime = mimeMap[ext] || 'application/octet-stream';
      const resourceType = mime.startsWith('image/') ? 'image'
        : mime.startsWith('video/') ? 'video' : 'raw';

      const result = await uploadToCloudinary(buffer, {
        folder,
        resource_type: resourceType,
      });
      return { oldUrl: url, newUrl: result.secure_url, status: 'success' };
    } catch (err) {
      return { oldUrl: url, newUrl: url, status: 'error', error: String(err) };
    }
  }

  // --- Projects ---
  const projects = await Project.find({}).lean();
  for (const project of projects) {
    const updates: Record<string, unknown> = {};
    const fields = [
      'image', 'coverImage', 'thumbnailImage', 'logoImage',
      'featureBanner', 'mobileScreenshot', 'desktopScreenshot',
      'tabletScreenshot', 'casePdfUrl',
    ];
    for (const field of fields) {
      const url = (project as Record<string, unknown>)[field];
      if (typeof url === 'string' && isLocalUrl(url)) {
        const r = await migrateOne(url, 'portfolio/projects');
        results.push(r);
        if (r.status === 'success') { updates[field] = r.newUrl; successCount++; }
        else if (r.status === 'error') errorCount++;
        else skipCount++;
      }
    }
    if (Array.isArray(project.gallery)) {
      let changed = false;
      const newGallery: string[] = [];
      for (const gUrl of project.gallery) {
        if (isLocalUrl(gUrl)) {
          const r = await migrateOne(gUrl, 'portfolio/projects/gallery');
          results.push(r);
          if (r.status === 'success') { newGallery.push(r.newUrl); changed = true; successCount++; }
          else if (r.status === 'error') { newGallery.push(gUrl); errorCount++; }
          else { newGallery.push(gUrl); skipCount++; }
        } else {
          newGallery.push(gUrl);
        }
      }
      if (changed) updates.gallery = newGallery;
    }
    if (Object.keys(updates).length > 0) {
      await Project.updateOne({ _id: project._id }, { $set: updates });
    }
  }

  // --- Settings ---
  const settings = await SiteSettings.findOne({}).lean();
  if (settings) {
    const updates: Record<string, string> = {};
    for (const field of ['ogImageUrl', 'faviconUrl', 'aboutPortrait']) {
      const url = (settings as Record<string, unknown>)[field];
      if (typeof url === 'string' && isLocalUrl(url)) {
        const r = await migrateOne(url, 'portfolio/settings');
        results.push(r);
        if (r.status === 'success') { updates[field] = r.newUrl; successCount++; }
        else if (r.status === 'error') errorCount++;
        else skipCount++;
      }
    }
    if (Object.keys(updates).length > 0) {
      await SiteSettings.updateOne({ _id: settings._id }, { $set: updates });
    }
  }

  // --- Media ---
  const mediaItems = await Media.find({}).lean();
  for (const media of mediaItems) {
    if (isLocalUrl(media.url)) {
      const r = await migrateOne(media.url, 'portfolio/media');
      results.push(r);
      if (r.status === 'success') {
        await Media.updateOne({ _id: media._id }, { $set: { url: r.newUrl, filename: r.newUrl } });
        successCount++;
      } else if (r.status === 'error') errorCount++;
      else skipCount++;
    }
  }

  // --- Reviews ---
  const reviews = await Review.find({}).lean();
  for (const review of reviews) {
    if (isLocalUrl(review.image)) {
      const r = await migrateOne(review.image, 'portfolio/reviews');
      results.push(r);
      if (r.status === 'success') {
        await Review.updateOne({ _id: review._id }, { $set: { image: r.newUrl } });
        successCount++;
      } else if (r.status === 'error') errorCount++;
      else skipCount++;
    }
  }

  await auditLog({ action: 'MIGRATION', resource: 'media', details: `Cloudinary migration: ${successCount} uploaded, ${skipCount} skipped, ${errorCount} errors` });

  return NextResponse.json({
    success: true,
    summary: { total: results.length, success: successCount, skipped: skipCount, errors: errorCount },
    mapping: results.filter((r) => r.status === 'success'),
    errors: results.filter((r) => r.status === 'error'),
  });
}
