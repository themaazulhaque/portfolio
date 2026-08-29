'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSkill, updateSkill } from '@/app/actions/skills';

interface ISkill { name?: string; category?: string; proficiency?: number; icon?: string; order?: number; }
interface Props { item?: ISkill; itemId?: string; }
const init = {};

export function SkillForm({ item, itemId }: Props) {
  const router = useRouter();
  const bound = itemId ? updateSkill.bind(null, itemId) : createSkill;
  const [state, action, pending] = useActionState(bound, init);
  useEffect(() => {
    if (!(state as { success?: boolean }).success) return;
    const timeout = window.setTimeout(() => router.push('/admin/dashboard/skills'), 500);
    return () => window.clearTimeout(timeout);
  }, [router, state]);

  return (
    <form action={action}>
      {(state as { error?: string }).error && <div className="alert alert-error">{(state as { error?: string }).error}</div>}
      {(state as { success?: boolean }).success && <div className="alert alert-success">Saved!</div>}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="form-grid">
            <div className="field"><label>Name *</label><input name="name" defaultValue={item?.name} required /></div>
            <div className="field"><label>Category *</label><input name="category" defaultValue={item?.category} placeholder="Frontend, Backend, DevOps…" required /></div>
          </div>
          <div className="form-grid">
            <div className="field"><label>Proficiency (0–100)</label><input type="number" name="proficiency" defaultValue={item?.proficiency ?? 100} min={0} max={100} /></div>
            <div className="field"><label>Icon (emoji or URL)</label><input name="icon" defaultValue={item?.icon} /></div>
          </div>
          <div className="field" style={{ maxWidth: 150 }}><label>Order</label><input type="number" name="order" defaultValue={item?.order ?? 0} min={0} /></div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
        <Link href="/admin/dashboard/skills" className="btn btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
