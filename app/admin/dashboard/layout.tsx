import type { ReactNode } from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/app/admin/admin-sidebar';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
