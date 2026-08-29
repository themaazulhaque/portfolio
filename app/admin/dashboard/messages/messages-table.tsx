'use client';
import { Fragment, useState, useTransition } from 'react';
import { markMessageRead, deleteMessage } from '@/app/actions/messages';

interface IMsg { _id: string; name: string; email: string; subject?: string; message: string; read: boolean; createdAt: string; }
export function MessagesTable({ initialItems }: { initialItems: IMsg[] }) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggleRead(id: string, current: boolean) {
    startTransition(async () => {
      await markMessageRead(id, !current);
      setItems((p) => p.map((x) => x._id === id ? { ...x, read: !current } : x));
    });
  }
  function handleDelete(id: string) {
    if (!confirm('Delete this message?')) return;
    startTransition(async () => { await deleteMessage(id); setItems((p) => p.filter((x) => x._id !== id)); });
  }

  if (!items.length) return <div className="empty"><div className="empty-icon">◳</div><div className="empty-text">No messages yet</div></div>;

  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th style={{ width: 12 }}></th><th>From</th><th>Subject</th><th>Date</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
        <tbody>
          {items.map((m) => (
            <Fragment key={m._id}>
              <tr key={m._id} style={!m.read ? { background: 'rgba(99,102,241,0.04)' } : undefined}>
                <td><div style={{ width: 8, height: 8, borderRadius: '50%', background: m.read ? 'transparent' : 'var(--accent)', flexShrink: 0 }} /></td>
                <td>
                  <div style={{ fontWeight: m.read ? 400 : 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.email}</div>
                </td>
                <td>
                  <button onClick={() => setExpanded(expanded === m._id ? null : m._id)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontWeight: m.read ? 400 : 600 }}>
                    {m.subject ?? '(no subject)'}
                  </button>
                </td>
                <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{new Date(m.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleRead(m._id, m.read)}>{m.read ? 'Unread' : 'Read'}</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m._id)}>Delete</button>
                  </div>
                </td>
              </tr>
              {expanded === m._id && (
                <tr key={`${m._id}-body`}>
                  <td colSpan={5} style={{ background: 'var(--bg-2)', padding: '16px 20px', fontSize: 13, color: 'var(--text-2)', whiteSpace: 'pre-wrap', borderBottom: '1px solid var(--border)' }}>
                    {m.message}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
