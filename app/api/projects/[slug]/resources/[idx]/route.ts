import { type NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Project } from '@/lib/models';

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  apk: 'application/vnd.android.package-archive',
  zip: 'application/zip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

function getMimeFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop()?.toLowerCase() || '';
    return MIME_MAP[ext] || 'application/octet-stream';
  } catch {
    return 'application/octet-stream';
  }
}

function getFilenameFromUrl(url: string, label: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1] || '';
    if (lastPart && lastPart.includes('.')) {
      return lastPart;
    }
  } catch { /* fallback */ }
  const safeLabel = label.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-');
  return safeLabel || 'download';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; idx: string }> }
) {
  const { slug, idx } = await params;
  const resourceIndex = parseInt(idx, 10);

  if (isNaN(resourceIndex) || resourceIndex < 0) {
    return NextResponse.json({ error: 'Invalid resource index' }, { status: 400 });
  }

  try {
    await connectDB();
    const project = await Project.findOne({ slug }).lean();
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const resources = Array.isArray(project.resources) ? project.resources : [];
    if (resourceIndex >= resources.length) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const resource = resources[resourceIndex];
    if (!resource || !resource.value) {
      return NextResponse.json({ error: 'Resource has no file' }, { status: 404 });
    }

    const fileUrl = resource.value;
    const label = resource.label || 'download';

    // Only proxy file downloads (pdf, apk, zip, image, download)
    const fileType = resource.type || 'link';
    if (fileType === 'link' || fileType === 'github' || fileType === 'figma' || fileType === 'video' || fileType === 'documentation') {
      return NextResponse.json({ error: 'This resource is not a downloadable file' }, { status: 400 });
    }

    // Fetch the file from storage
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 });
    }

    const fileBuffer = await response.arrayBuffer();
    const contentType = getMimeFromUrl(fileUrl);
    const filename = getFilenameFromUrl(fileUrl, label);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(fileBuffer.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
