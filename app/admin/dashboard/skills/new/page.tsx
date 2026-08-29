import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { SkillForm } from '../skill-form';
export default async function NewSkillPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return <div className="admin-content"><div className="page-header"><h1 className="page-title">Add Skill</h1></div><SkillForm /></div>;
}
