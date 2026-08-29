import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { TechForm } from '../tech-form';
export default async function NewTechPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return <div className="admin-content"><div className="page-header"><h1 className="page-title">Add Tool</h1></div><TechForm /></div>;
}
