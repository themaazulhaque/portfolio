'use client';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createService, updateService } from '@/app/actions/services';
interface ISvc { title?: string; description?: string; icon?: string; order?: number; }
interface Props { item?: ISvc; itemId?: string; }
const init = {};
export function ServiceForm({ item, itemId }: Props) {
  const router = useRouter();
  const bound = itemId ? updateService.bind(null, itemId) : createService;
  const [state, action, pending] = useActionState(bound, init);
  useEffect(() => {
    if (!(state as { success?: boolean }).success) return;
    const timeout = window.setTimeout(() => router.push('/admin/dashboard/services'), 500);
    return () => window.clearTimeout(timeout);
  }, [router, state]);
  return (
    <form action={action}>
      {(state as { error?: string }).error && <div className="alert alert-error">{(state as { error?: string }).error}</div>}
      {(state as { success?: boolean }).success && <div className="alert alert-success">Saved!</div>}
      <div className="card" style={{ marginBottom: 16 }}><div className="card-body">
        <div className="form-grid">
          <div className="field"><label>Title *</label><input name="title" defaultValue={item?.title} required /></div>
          <div className="field"><label>Icon (emoji)</label><input name="icon" defaultValue={item?.icon} placeholder="⚡" /></div>
        </div>
        <div className="field"><label>Description</label><textarea name="description" defaultValue={item?.description} rows={4} /></div>
        <div className="field" style={{ maxWidth: 150 }}><label>Order</label><input type="number" name="order" defaultValue={item?.order ?? 0} /></div>
      </div></div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
        <Link href="/admin/dashboard/services" className="btn btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
