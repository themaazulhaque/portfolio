import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ExperienceForm } from '../experience-form';

export default async function NewExperiencePage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return (
    <div className="admin-content">
      <div className="page-header"><h1 className="page-title">Add Experience</h1></div>
      <ExperienceForm />
    </div>
  );
}
