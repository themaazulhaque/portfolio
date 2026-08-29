import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Skill } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { SkillsTable } from './skills-table';

async function getSkills() {
  await connectDB();
  const items = await Skill.find().sort({ category: 1, order: 1 }).lean();
  return JSON.parse(JSON.stringify(items));
}

export default async function SkillsPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  const items = await getSkills();
  return (
    <div className="admin-content">
      <div className="page-header">
        <div><h1 className="page-title">Skills</h1><p className="page-sub">{items.length} skills across all categories</p></div>
        <Link href="/admin/dashboard/skills/new" className="btn btn-primary">+ Add Skill</Link>
      </div>
      <SkillsTable initialItems={items} />
    </div>
  );
}
