import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Experience } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ExperienceTable } from './experience-table';

async function getExperiences() {
  await connectDB();
  const items = await Experience.find().sort({ order: 1 }).lean();
  return JSON.parse(JSON.stringify(items));
}

export default async function ExperiencePage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  const items = await getExperiences();

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Experience</h1>
          <p className="page-sub">{items.length} entries · drag to reorder</p>
        </div>
        <Link href="/admin/dashboard/experience/new" className="btn btn-primary">+ Add Entry</Link>
      </div>
      <ExperienceTable initialItems={items} />
    </div>
  );
}
