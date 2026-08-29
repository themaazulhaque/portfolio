import { connectDB } from '@/lib/db';
import { Project } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { ProjectForm } from '../project-form';

interface Props {
  params: Promise<{ id: string }>;
}

async function getProject(id: string) {
  await connectDB();
  try {
    const project = await Project.findById(id).lean();
    if (!project) return null;
    return JSON.parse(JSON.stringify(project));
  } catch {
    return null;
  }
}

export default async function EditProjectPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Project</h1>
          <p className="page-sub">{project.title}</p>
        </div>
      </div>
      <ProjectForm project={project} projectId={id} />
    </div>
  );
}
