'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteExperience, reorderExperiences } from '@/app/actions/experience';
import type { AdminExperience } from '@/lib/types';

export function ExperienceTable({ initialItems }: { initialItems: AdminExperience[] }) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return;
    startTransition(async () => {
      await deleteExperience(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
    });
  }

  function handleDragStart(i: number) { setDragIdx(i); }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const r = [...items]; const [m] = r.splice(dragIdx, 1); r.splice(i, 0, m);
    setItems(r); setDragIdx(i);
  }
  function handleDrop() {
    setDragIdx(null);
    startTransition(async () => { await reorderExperiences(items.map((x) => x._id)); });
  }

  if (!items.length) return <div className="empty"><div className="empty-icon">◫</div><div className="empty-text">No experience entries yet</div></div>;

  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th style={{ width: 30 }}></th><th>Company</th><th>Role</th><th>Period</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
        <tbody>
          {items.map((x, i) => (
            <tr key={x._id} draggable onDragStart={() => handleDragStart(i)} onDragOver={(e) => handleDragOver(e, i)} onDrop={handleDrop} style={dragIdx === i ? { opacity: 0.5 } : undefined}>
              <td><span className="drag-handle">⠿</span></td>
              <td><div style={{ fontWeight: 600 }}>{x.company}</div></td>
              <td style={{ color: 'var(--text-2)' }}>{x.role}</td>
              <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{x.period}</td>
              <td>{x.current ? <span className="badge badge-green">Current</span> : <span className="badge badge-gray">Past</span>}</td>
              <td>
                <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                  <Link href={`/admin/dashboard/experience/${x._id}`} className="btn btn-ghost btn-sm">Edit</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(x._id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
