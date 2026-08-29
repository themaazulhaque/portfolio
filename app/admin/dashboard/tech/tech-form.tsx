'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createTech, updateTech } from '@/app/actions/tech';

interface ITech { name?: string; category?: string; logo?: string; order?: number; }
interface Props { item?: ITech; itemId?: string; }
const init = {};

export function TechForm({ item, itemId }: Props) {
  const router = useRouter();
  const bound = itemId ? updateTech.bind(null, itemId) : createTech;
  const [state, action, pending] = useActionState(bound, init);
  useEffect(() => {
    if (!(state as { success?: boolean }).success) return;
    const timeout = window.setTimeout(() => router.push('/admin/dashboard/tech'), 500);
    return () => window.clearTimeout(timeout);
  }, [router, state]);

  return (
    <form action={action}>
      {(state as { error?: string }).error && <div className="alert alert-error">{(state as { error?: string }).error}</div>}
      {(state as { success?: boolean }).success && <div className="alert alert-success">Saved!</div>}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="form-grid">
            <div className="field"><label>Name *</label><input name="name" defaultValue={item?.name} placeholder="React" required /></div>
            <div className="field"><label>Category</label><input name="category" defaultValue={item?.category} placeholder="UI library, Framework, Language…" /></div>
          </div>
          <div className="form-grid">
            <div className="field"><label>Logo (URL)</label><input name="logo" defaultValue={item?.logo} placeholder="/logos/react.svg" /></div>
            <div className="field" style={{ maxWidth: 150 }}><label>Order</label><input type="number" name="order" defaultValue={item?.order ?? 0} min={0} /></div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
        <Link href="/admin/dashboard/tech" className="btn btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
