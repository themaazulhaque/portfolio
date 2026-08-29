import { connectDB } from '@/lib/db';
import { Tech } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { TechForm } from '../tech-form';

interface Props { params: Promise<{ id: string }> }
export default async function EditTechPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  const { id } = await params;
  await connectDB();
  const item = await Tech.findById(id).lean();
  if (!item) notFound();
  return <div className="admin-content"><div className="page-header"><h1 className="page-title">Edit Tool</h1></div><TechForm item={JSON.parse(JSON.stringify(item))} itemId={id} /></div>;
}
