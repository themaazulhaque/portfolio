import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Tech } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { TechTable } from './tech-table';

async function getTech() {
  await connectDB();
  const items = await Tech.find().sort({ order: 1 }).lean();
  return JSON.parse(JSON.stringify(items));
}

export default async function TechPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  const items = await getTech();
  return (
    <div className="admin-content">
      <div className="page-header">
        <div><h1 className="page-title">Tech Stack</h1><p className="page-sub">{items.length} tools shown on the portfolio</p></div>
        <Link href="/admin/dashboard/tech/new" className="btn btn-primary">+ Add Tool</Link>
      </div>
      <TechTable initialItems={items} />
    </div>
  );
}
