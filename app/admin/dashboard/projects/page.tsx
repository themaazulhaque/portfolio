import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Project } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ProjectsTable } from './projects-table';

async function getProjects() {
  try {
    await connectDB();
    const projects = await Project.find().sort({ order: 1, createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(projects));
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  const projects = await getProjects();

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">{projects.length} total · drag to reorder</p>
        </div>
        <Link href="/admin/dashboard/projects/new" className="btn btn-primary">
          + New Project
        </Link>
      </div>
      <ProjectsTable initialProjects={projects} />
    </div>
  );
}
