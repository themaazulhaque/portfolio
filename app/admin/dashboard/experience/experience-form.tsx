'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createExperience, updateExperience } from '@/app/actions/experience';
import type { AdminExperience } from '@/lib/types';

/** All fields optional — used for both create (empty) and edit (pre-filled) forms. */
type ExperienceFormData = Partial<AdminExperience>;

interface Props { item?: ExperienceFormData; itemId?: string; }
const init = {};

function toTechArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function ExperienceForm({ item, itemId }: Props) {
  const router = useRouter();
  const bound = itemId ? updateExperience.bind(null, itemId) : createExperience;
  const [state, action, pending] = useActionState(bound, init);
  const [tech, setTech] = useState<string[]>(toTechArray(item?.tech));
  const [techInput, setTechInput] = useState('');
  function addTech() { const v = techInput.trim(); if (v) setTech([...tech, v]); setTechInput(''); }

  useEffect(() => {
    if (!(state as { success?: boolean }).success) return;
    const timeout = window.setTimeout(() => router.push('/admin/dashboard/experience'), 500);
    return () => window.clearTimeout(timeout);
  }, [router, state]);

  return (
    <form action={action}>
      {(state as { error?: string }).error && <div className="alert alert-error">{(state as { error?: string }).error}</div>}
      {(state as { success?: boolean }).success && <div className="alert alert-success">Saved!</div>}
      <input type="hidden" name="tech" value={JSON.stringify(tech)} />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="form-grid">
            <div className="field"><label>Company *</label><input name="company" defaultValue={item?.company} required /></div>
            <div className="field"><label>Role *</label><input name="role" defaultValue={item?.role} required /></div>
          </div>
          <div className="form-grid">
            <div className="field"><label>Period (display) *</label><input name="period" defaultValue={item?.period} placeholder="2023 – Present" required /></div>
            <div className="field"><label>Start Date *</label><input name="startDate" type="month" defaultValue={item?.startDate} required /></div>
          </div>
          <div className="form-grid">
            <div className="field"><label>End Date</label><input name="endDate" type="month" defaultValue={item?.endDate} /></div>
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              <label className="toggle" style={{ marginTop: 24 }}>
                <input type="checkbox" name="current" value="true" defaultChecked={item?.current} />
                <span className="toggle-track" />
                <span style={{ fontSize: 13 }}>Current Position</span>
              </label>
            </div>
          </div>
          <div className="field"><label>Description</label><textarea name="description" defaultValue={item?.description} rows={3} /></div>

          <div className="field">
            <label>Technologies</label>
            <div className="tag-input-wrap">
              {tech.map((t) => <span key={t} className="tag">{t}<button type="button" onClick={() => setTech(tech.filter((x) => x !== t))}>×</button></span>)}
              <input className="tag-input" value={techInput} onChange={(e) => setTechInput(e.target.value)} placeholder="Add tech…" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }} />
            </div>
          </div>
          <div className="field" style={{ maxWidth: 150 }}><label>Order</label><input type="number" name="order" defaultValue={item?.order ?? 0} min={0} /></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
        <Link href="/admin/dashboard/experience" className="btn btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
