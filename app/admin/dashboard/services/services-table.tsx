'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteService } from '@/app/actions/services';

interface ISvc { _id: string; title: string; description: string; icon?: string; }
export function ServicesTable({ initialItems }: { initialItems: ISvc[] }) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  function handleDelete(id: string) {
    if (!confirm('Delete?')) return;
    startTransition(async () => { await deleteService(id); setItems((p) => p.filter((x) => x._id !== id)); });
  }
  if (!items.length) return <div className="empty"><div className="empty-icon">◇</div><div className="empty-text">No services yet</div></div>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Title</th><th>Description</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
        <tbody>{items.map((s) => (
          <tr key={s._id}>
            <td style={{ fontWeight: 600 }}>{s.icon && <span style={{ marginRight: 8 }}>{s.icon}</span>}{s.title}</td>
            <td style={{ color: 'var(--text-2)', maxWidth: 320 }}><span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.description}</span></td>
            <td><div className="row-actions" style={{ justifyContent: 'flex-end' }}>
              <Link href={`/admin/dashboard/services/${s._id}`} className="btn btn-ghost btn-sm">Edit</Link>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>Delete</button>
            </div></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
