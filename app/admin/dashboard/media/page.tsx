import { connectDB } from '@/lib/db';
import { Media } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { MediaGallery } from './media-gallery';

async function getMedia() {
  try {
    await connectDB();
    const items = await Media.find().sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

export default async function MediaPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  const items = await getMedia();

  return (
    <div className="admin-content">
      <div className="page-header">
        <div><h1 className="page-title">Media</h1><p className="page-sub">{items.length} files uploaded</p></div>
      </div>
      <MediaGallery initialItems={items} />
    </div>
  );
}
