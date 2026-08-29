import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/admin/dashboard');
  }

  redirect('/admin/login');
}
