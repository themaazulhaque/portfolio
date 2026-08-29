import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { Service } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { ServicesTable } from './services-table';

async function getServices() {
  await connectDB();
  const items = await Service.find().sort({ order: 1 }).lean();
  return JSON.parse(JSON.stringify(items));
}

export default async function ServicesPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  const items = await getServices();
  return (
    <div className="admin-content">
      <div className="page-header">
        <div><h1 className="page-title">Services</h1><p className="page-sub">{items.length} services</p></div>
        <Link href="/admin/dashboard/services/new" className="btn btn-primary">+ Add Service</Link>
      </div>
      <ServicesTable initialItems={items} />
    </div>
  );
}
