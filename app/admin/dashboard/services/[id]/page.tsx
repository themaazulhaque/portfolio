import { connectDB } from '@/lib/db';
import { Service } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { ServiceForm } from '../service-form';
interface Props { params: Promise<{ id: string }> }
export default async function EditServicePage({ params }: Props) {
  const session = await getSession(); if (!session) redirect('/admin/login');
  const { id } = await params;
  await connectDB();
  const item = await Service.findById(id).lean();
  if (!item) notFound();
  return <div className="admin-content"><div className="page-header"><h1 className="page-title">Edit Service</h1></div><ServiceForm item={JSON.parse(JSON.stringify(item))} itemId={id} /></div>;
}
