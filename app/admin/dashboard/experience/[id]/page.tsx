import { connectDB } from '@/lib/db';
import { Experience } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { ExperienceForm } from '../experience-form';

interface Props { params: Promise<{ id: string }> }

export default async function EditExperiencePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  const { id } = await params;
  await connectDB();
  const item = await Experience.findById(id).lean();
  if (!item) notFound();
  return (
    <div className="admin-content">
      <div className="page-header"><h1 className="page-title">Edit Experience</h1></div>
      <ExperienceForm item={JSON.parse(JSON.stringify(item))} itemId={id} />
    </div>
  );
}
