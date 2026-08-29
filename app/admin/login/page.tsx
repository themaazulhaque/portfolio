import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { LoginForm } from '../login-form';

export default async function AdminLoginRoute() {
  const session = await getSession();
  if (session) {
    redirect('/admin/dashboard');
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-dot" />
          <span className="login-logo-text">Portfolio CMS</span>
        </div>
        <h1 className="login-title">Sign In</h1>
        <p className="login-sub">Admin access only. This page is not publicly listed.</p>
        <LoginForm />
      </div>
    </div>
  );
}
