'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteTech } from '@/app/actions/tech';

interface ITech { _id: string; name: string; category: string; logo: string; featured: boolean; }

export function TechTable({ initialItems }: { initialItems: ITech[] }) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm('Delete this tool?')) return;
    startTransition(async () => {
      await deleteTech(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
    });
  }

  if (!items.length) return <div className="empty"><div className="empty-icon">◈</div><div className="empty-text">No tools yet</div></div>;

  return (
    <div className="card">
      <div className="table-wrap">
        <table>
          <thead><tr><th>Logo</th><th>Name</th><th>Category</th><th>Featured</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t._id}>
                <td>
                  {t.logo ? (
                    <img src={t.logo} alt="" width={28} height={28} style={{ objectFit: 'contain' }} />
                  ) : (
                    <span style={{ color: 'var(--text-2)' }}>—</span>
                  )}
                </td>
                <td style={{ fontWeight: 500 }}>{t.name}</td>
                <td style={{ color: 'var(--text-2)' }}>{t.category || '—'}</td>
                <td style={{ color: t.featured ? 'var(--primary)' : 'var(--text-3)' }}>{t.featured ? '★' : '—'}</td>
                <td>
                  <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                    <Link href={`/admin/dashboard/tech/${t._id}`} className="btn btn-ghost btn-sm">Edit</Link>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
