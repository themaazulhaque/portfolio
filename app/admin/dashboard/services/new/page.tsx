import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ServiceForm } from '../service-form';
export default async function NewServicePage() {
  const session = await getSession(); if (!session) redirect('/admin/login');
  return <div className="admin-content"><div className="page-header"><h1 className="page-title">Add Service</h1></div><ServiceForm /></div>;
}
