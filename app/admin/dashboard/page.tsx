import { connectDB } from '@/lib/db';
import { Project, Experience, Skill, Service, ContactMessage, Review } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

async function getStats() {
  try {
    await connectDB();
    const [projects, experiences, skills, services, unreadMessages, pendingReviews] = await Promise.all([
      Project.countDocuments(),
      Experience.countDocuments(),
      Skill.countDocuments(),
      Service.countDocuments(),
      ContactMessage.countDocuments({ read: false }),
      Review.countDocuments({ status: 'pending' }),
    ]);
    return { projects, experiences, skills, services, unreadMessages, pendingReviews };
  } catch {
    return { projects: 0, experiences: 0, skills: 0, services: 0, unreadMessages: 0, pendingReviews: 0 };
  }
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const stats = await getStats();

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Welcome back, {session.email}</p>
        </div>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Projects', value: stats.projects, hint: 'Total in DB' },
          { label: 'Experiences', value: stats.experiences, hint: 'Work history entries' },
          { label: 'Skills', value: stats.skills, hint: 'Across all categories' },
          { label: 'Services', value: stats.services, hint: 'Offered services' },
          { label: 'Unread', value: stats.unreadMessages, hint: 'New messages', accent: true },
          { label: 'Pending Reviews', value: stats.pendingReviews, hint: 'Awaiting approval', accent: stats.pendingReviews > 0 },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div
              className="stat-value"
              style={s.accent && s.value > 0 ? { color: 'var(--accent)' } : undefined}
            >
              {s.value}
            </div>
            <div className="stat-hint">{s.hint}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Quick Navigation</span>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {[
            { href: '/admin/dashboard/projects', label: '+ New Project' },
            { href: '/admin/dashboard/experience', label: '+ New Experience' },
            { href: '/admin/dashboard/skills', label: '+ New Skill' },
            { href: '/admin/dashboard/services', label: '+ New Service' },
            { href: '/admin/dashboard/media', label: '↑ Upload Media' },
            { href: '/admin/dashboard/messages', label: '✉ View Messages' },
            { href: '/admin/dashboard/reviews', label: '★ Reviews' },
            { href: '/admin/dashboard/settings', label: '⚙ Site Settings' },
          ].map((q) => (
            <a key={q.href} href={q.href} className="btn btn-secondary">
              {q.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
