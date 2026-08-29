'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteSkill } from '@/app/actions/skills';

interface ISkill { _id: string; name: string; category: string; proficiency: number; }

export function SkillsTable({ initialItems }: { initialItems: ISkill[] }) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm('Delete this skill?')) return;
    startTransition(async () => {
      await deleteSkill(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
    });
  }

  const grouped = items.reduce<Record<string, ISkill[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  if (!items.length) return <div className="empty"><div className="empty-icon">◎</div><div className="empty-text">No skills yet</div></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(grouped).map(([cat, skills]) => (
        <div key={cat} className="card">
          <div className="card-header"><span className="card-title">{cat}</span><span className="badge badge-gray">{skills.length}</span></div>
          <div className="table-wrap" style={{ borderRadius: 0, border: 'none', borderTop: '1px solid var(--border)' }}>
            <table>
              <thead><tr><th>Skill</th><th>Proficiency</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {skills.map((s) => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--bg-3)', borderRadius: 2, maxWidth: 120 }}>
                          <div style={{ width: `${s.proficiency}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-2)', minWidth: 30 }}>{s.proficiency}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        <Link href={`/admin/dashboard/skills/${s._id}`} className="btn btn-ghost btn-sm">Edit</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
