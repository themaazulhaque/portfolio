import { connectDB } from '@/lib/db';
import { Skill } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { SkillForm } from '../skill-form';

interface Props { params: Promise<{ id: string }> }
export default async function EditSkillPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  const { id } = await params;
  await connectDB();
  const item = await Skill.findById(id).lean();
  if (!item) notFound();
  return <div className="admin-content"><div className="page-header"><h1 className="page-title">Edit Skill</h1></div><SkillForm item={JSON.parse(JSON.stringify(item))} itemId={id} /></div>;
}
