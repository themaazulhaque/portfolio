'use client';

import { useActionState, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProject, updateProject, type ProjectActionState } from '@/app/actions/projects';
import { MediaPicker } from '@/app/admin/components/media-picker';
import { GalleryPicker } from '@/app/admin/components/gallery-picker';
import type { AdminProject } from '@/lib/types';

interface Props {
  project?: AdminProject;
  projectId?: string;
}

const init: ProjectActionState = {};

function toStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function toProcessSteps(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((step): step is { step?: unknown; title?: unknown; desc?: unknown } => !!step && typeof step === 'object')
    .map((step) => ({
      step: typeof step.step === 'string' ? step.step : '',
      title: typeof step.title === 'string' ? step.title : '',
      desc: typeof step.desc === 'string' ? step.desc : '',
    }))
    .filter((step) => step.step.trim().length > 0 && step.title.trim().length > 0 && step.desc.trim().length > 0);
}

function toResultEntries(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((result): result is { metric?: unknown; label?: unknown } => !!result && typeof result === 'object')
    .map((result) => ({
      metric: typeof result.metric === 'string' ? result.metric : '',
      label: typeof result.label === 'string' ? result.label : '',
    }))
    .filter((result) => result.metric.trim().length > 0 && result.label.trim().length > 0);
}

export function ProjectForm({ project, projectId }: Props) {
  const router = useRouter();
  const safeTechStack = toStringArray(project?.techStack);
  const safeOverview = toStringArray(project?.overview, ['']);
  const safeChallenge = toStringArray(project?.challenge, ['']);
  const safeSolution = toStringArray(project?.solution, ['']);
  const safeGallery = toStringArray(project?.gallery);
  const safeProcess = toProcessSteps(project?.process);
  const safeResults = toResultEntries(project?.results);

  const boundAction = projectId
    ? updateProject.bind(null, projectId)
    : createProject;

  const [state, action, pending] = useActionState(boundAction, init);

  const [techStack, setTechStack] = useState<string[]>(safeTechStack);
  const [techInput, setTechInput] = useState('');
  const [overview, setOverview] = useState<string[]>(safeOverview);
  const [challenge, setChallenge] = useState<string[]>(safeChallenge);
  const [solution, setSolution] = useState<string[]>(safeSolution);
  const [gallery, setGallery] = useState<string[]>(safeGallery);

  function addTech() {
    const v = techInput.trim();
    if (v && !techStack.includes(v)) setTechStack([...techStack, v]);
    setTechInput('');
  }
  function removeTech(t: string) { setTechStack(techStack.filter((x) => x !== t)); }

  useEffect(() => {
    if (state.success) {
      router.push('/admin/dashboard/projects');
    }
  }, [state.success, router]);

  return (
    <form action={action}>
      {state.error && <div className="alert alert-error">{state.error}</div>}
      {state.success && <div className="alert alert-success">Saved successfully!</div>}

      <input type="hidden" name="techStack" value={JSON.stringify(techStack)} />
      <input type="hidden" name="overview" value={JSON.stringify(overview.filter(Boolean))} />
      <input type="hidden" name="challenge" value={JSON.stringify(challenge.filter(Boolean))} />
      <input type="hidden" name="solution" value={JSON.stringify(solution.filter(Boolean))} />
      <input type="hidden" name="gallery" value={JSON.stringify(gallery)} />
      <input type="hidden" name="process" value={JSON.stringify(safeProcess)} />
      <input type="hidden" name="results" value={JSON.stringify(safeResults)} />

      {/* ─ BASICS ─ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">Basic Info</span></div>
        <div className="card-body">
          <div className="form-grid">
            <div className="field">
              <label>Title *</label>
              <input name="title" defaultValue={project?.title} required />
            </div>
            <div className="field">
              <label>Slug *</label>
              <input name="slug" defaultValue={project?.slug} placeholder="my-project" required pattern="[a-z0-9\-]+" title="Lowercase letters, numbers, and hyphens only" />
              <span className="field-hint">Lowercase, hyphens only</span>
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Category *</label>
              <input name="cat" defaultValue={project?.cat} placeholder="AI Product" required />
            </div>
            <div className="field">
              <label>Year</label>
              <input name="year" defaultValue={project?.year} placeholder="2025" />
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Client</label>
              <input name="client" defaultValue={project?.client} />
            </div>
            <div className="field">
              <label>Role</label>
              <input name="role" defaultValue={project?.role} />
            </div>
          </div>
          <div className="field">
            <label>Subtitle</label>
            <input name="subtitle" defaultValue={project?.subtitle} />
          </div>
          <div className="field">
            <label>Short Description</label>
            <textarea name="desc" defaultValue={project?.desc} rows={2} />
          </div>
          <div className="field">
            <label>Stack Label</label>
            <input name="stack" defaultValue={project?.stack} placeholder="Full-Stack · AI" />
          </div>
        </div>
      </div>

      {/* ─ MEDIA ─ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">Media</span></div>
        <div className="card-body">
          <MediaPicker name="coverImage" label="Cover Image" value={project?.coverImage || project?.image} />

          <GalleryPicker
            label="Gallery Images"
            value={safeGallery}
            onChange={setGallery}
            hint="JPEG, PNG, WebP · Max 10 MB each · Any aspect ratio supported"
          />
        </div>
      </div>

      {/* ─ TECH STACK ─ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">Tech Stack</span></div>
        <div className="card-body">
          <div className="field">
            <label>Technologies</label>
            <div className="tag-input-wrap">
              {techStack.map((t) => (
                <span key={t} className="tag">
                  {t}<button type="button" onClick={() => removeTech(t)}>×</button>
                </span>
              ))}
              <input
                className="tag-input"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                placeholder="Type tech and press Enter…"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } if (e.key === ',' || e.key === 'Tab') { e.preventDefault(); addTech(); } }}
              />
            </div>
            <span className="field-hint">Press Enter or Tab to add</span>
          </div>
        </div>
      </div>

      {/* ─ CONTENT ─ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">Case Study Content</span></div>
        <div className="card-body">
          {(['overview', 'challenge', 'solution'] as const).map((field) => {
            const map = { overview, challenge, solution };
            const setMap = { overview: setOverview, challenge: setChallenge, solution: setSolution };
            const vals = map[field];
            const setVals = setMap[field];
            return (
              <div key={field} className="field" style={{ marginBottom: 20 }}>
                <label style={{ textTransform: 'capitalize' }}>{field} Paragraphs</label>
                {vals.map((v, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <textarea
                      value={v}
                      rows={2}
                      onChange={(e) => {
                        const next = [...vals];
                        next[i] = e.target.value;
                        setVals(next);
                      }}
                      style={{ flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', padding: '9px 12px', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', resize: 'vertical' }}
                    />
                    <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => setVals(vals.filter((_, j) => j !== i))}>×</button>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setVals([...vals, ''])}>+ Add Paragraph</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─ FLAGS ─ */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><span className="card-title">Visibility</span></div>
        <div className="card-body" style={{ display: 'flex', gap: 24 }}>
          <label className="toggle">
            <input type="checkbox" name="published" value="true" defaultChecked={project?.published !== false} />
            <span className="toggle-track" />
            <span style={{ fontSize: 13 }}>Published</span>
          </label>
          <label className="toggle">
            <input type="checkbox" name="featured" value="true" defaultChecked={project?.featured ?? false} />
            <span className="toggle-track" />
            <span style={{ fontSize: 13 }}>Featured</span>
          </label>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <div className="field" style={{ maxWidth: 180 }}>
            <label>Order</label>
            <input type="number" name="order" defaultValue={project?.order ?? 0} min={0} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Saving…' : projectId ? 'Update Project' : 'Create Project'}
        </button>
        <Link href="/admin/dashboard/projects" className="btn btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}


