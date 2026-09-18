import { type NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Project } from '@/lib/models';
import { buildCaseStudyResources } from '@/lib/sanitize';

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

    // Build the same resource list the public page uses (handles both new + legacy)
    const resources = buildCaseStudyResources({
      liveUrl: project.liveUrl,
      githubUrl: project.githubUrl,
      repository: project.repository,
      documentationUrl: project.documentationUrl,
      figmaUrl: project.figmaUrl,
      casePdfUrl: project.casePdfUrl,
      videoUrl: project.videoUrl,
      demoCredentials: project.demoCredentials,
      clientWebsite: project.clientWebsite,
      additionalLinks: Array.isArray(project.additionalLinks) ? project.additionalLinks : [],
      resources: Array.isArray(project.resources) ? project.resources : [],
    });

    if (resourceIndex >= resources.length) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const resource = resources[resourceIndex];
    if (!resource || !resource.value) {
      return NextResponse.json({ error: 'Resource has no file' }, { status: 404 });
    }

    const fileUrl = resource.value;
    const label = resource.label || 'download';

    // Only proxy file downloads (pdf, apk, zip, image, download, other)
    const fileType = resource.type || 'link';
    if (['link', 'github', 'figma', 'video', 'documentation'].includes(fileType)) {
      return NextResponse.json({ error: 'This resource is not a downloadable file' }, { status: 400 });
    }

    console.log(`[download] Proxying ${fileType} file: ${fileUrl.substring(0, 120)}`);

    // Fetch the file from storage with redirect following
    const response = await fetch(fileUrl, {
      redirect: 'follow',
      headers: { 'Accept': '*/*' },
    });

    if (!response.ok) {
      console.error(`[download] Upstream fetch failed: ${response.status} ${response.statusText} for ${fileUrl.substring(0, 120)}`);
      return NextResponse.json({ error: `Failed to fetch file (${response.status})` }, { status: 502 });
    }

    const upstreamType = response.headers.get('content-type') || '';
    console.log(`[download] Upstream response: ${response.status}, Content-Type: ${upstreamType}`);

    // Check if upstream returned HTML (error page) instead of the actual file
    if (upstreamType.includes('text/html')) {
      console.error(`[download] Upstream returned HTML instead of file for ${fileUrl.substring(0, 120)}`);
      return NextResponse.json({ error: 'File not available at storage URL' }, { status: 502 });
    }

    const fileBuffer = await response.arrayBuffer();
    if (fileBuffer.byteLength === 0) {
      console.error(`[download] Upstream returned empty file for ${fileUrl.substring(0, 120)}`);
      return NextResponse.json({ error: 'File is empty' }, { status: 502 });
    }

    // Use the resource type to determine MIME if URL-based detection is ambiguous
    let contentType = getMimeFromUrl(fileUrl);
    if (fileType === 'apk' && contentType !== 'application/vnd.android.package-archive') {
      contentType = 'application/vnd.android.package-archive';
    }

    const filename = getFilenameFromUrl(fileUrl, label);

    console.log(`[download] Serving ${filename} (${fileBuffer.byteLength} bytes, ${contentType})`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(fileBuffer.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('[download] Route error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
