import { connectDB } from '@/lib/db';
import { ContactMessage } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { MessagesTable } from './messages-table';

async function getMessages() {
  try {
    await connectDB();
    const items = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

export default async function MessagesPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  const items = await getMessages();
  const unread = items.filter((m: { read: boolean }) => !m.read).length;

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-sub">{items.length} total · {unread} unread</p>
        </div>
      </div>
      <MessagesTable initialItems={items} />
    </div>
  );
}
