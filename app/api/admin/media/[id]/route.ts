import { type NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db';
import { Media } from '@/lib/models';
import { decrypt } from '@/lib/session';
import { auditLog } from '@/lib/audit';
import { isCloudinaryUrl, extractCloudinaryPublicId, deleteFromCloudinary } from '@/lib/cloudinary';
import { isValidOrigin } from '@/lib/csrf';

interface Params { params: Promise<{ id: string }> }

export async function DELETE(request: NextRequest, { params }: Params) {
  // Origin check to prevent CSRF
  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = request.cookies.get('admin_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await decrypt(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    await connectDB();
    const media = await Media.findById(id);
    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (isCloudinaryUrl(media.url)) {
      const publicId = extractCloudinaryPublicId(media.url);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
        } catch {
          // Cloudinary deletion failed — continue to remove DB record
        }
      }
    } else {
      // Legacy local file
      const filePath = path.join(process.cwd(), 'public', media.url);
      try {
        await unlink(filePath);
      } catch {
        // File may already be gone — continue
      }
    }

    await Media.findByIdAndDelete(id);
    await auditLog({ action: 'DELETE', resource: 'media', resourceId: id });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
