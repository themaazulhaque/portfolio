import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ProjectForm } from '../project-form';

export default async function NewProjectPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Project</h1>
          <p className="page-sub">Fill in the details below to add a project.</p>
        </div>
      </div>
      <ProjectForm />
    </div>
  );
}
