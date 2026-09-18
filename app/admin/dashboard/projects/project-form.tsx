'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
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

interface ResourceEntry {
  type: string;
  label: string;
  value: string;
}

const RESOURCE_TYPES = [
  { value: 'link', label: 'Link', inputType: 'url' },
  { value: 'github', label: 'GitHub', inputType: 'url' },
  { value: 'figma', label: 'Figma', inputType: 'url' },
  { value: 'video', label: 'Video', inputType: 'url' },
  { value: 'pdf', label: 'PDF', inputType: 'file' },
  { value: 'apk', label: 'APK', inputType: 'file' },
  { value: 'image', label: 'Image', inputType: 'file' },
  { value: 'zip', label: 'ZIP', inputType: 'file' },
  { value: 'download', label: 'Download', inputType: 'file' },
  { value: 'documentation', label: 'Documentation', inputType: 'url' },
  { value: 'other', label: 'Other', inputType: 'url' },
];

const RESOURCE_ACCEPT: Record<string, string> = {
  pdf: '.pdf',
  apk: '.apk',
  image: 'image/*',
  zip: '.zip',
  download: '.pdf,.zip,.apk,.doc,.docx,.txt',
};

const init: ProjectActionState = {};

function toStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function toResourceEntries(value: unknown): ResourceEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((r): r is { type?: unknown; label?: unknown; value?: unknown } => !!r && typeof r === 'object')
    .map((r) => ({
      type: typeof r.type === 'string' ? r.type : 'link',
      label: typeof r.label === 'string' ? r.label : '',
      value: typeof r.value === 'string' ? r.value : '',
    }))
    .filter((r) => r.label.trim().length > 0 && r.value.trim().length > 0);
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
  const safeResources = toResourceEntries(project?.resources);
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
  const [resources, setResources] = useState<ResourceEntry[]>(safeResources);

  function addTech() {
    const v = techInput.trim();
    if (v && !techStack.includes(v)) setTechStack([...techStack, v]);
    setTechInput('');
  }
  function removeTech(t: string) { setTechStack(techStack.filter((x) => x !== t)); }

  function addResource() {
    setResources([...resources, { type: 'link', label: '', value: '' }]);
  }
  function updateResource(index: number, field: keyof ResourceEntry, val: string) {
    setResources(resources.map((r, i) => i === index ? { ...r, [field]: val } : r));
  }
  function removeResource(index: number) {
    setResources(resources.filter((_, i) => i !== index));
  }

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
      <input type="hidden" name="resources" value={JSON.stringify(resources.filter(r => r.label && r.value))} />
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

      {/* ─ RESOURCES ─ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Resources</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addResource}>+ Add Resource</button>
        </div>
        <div className="card-body">
          {resources.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>No resources added. Click "+ Add Resource" to add links, files, or downloads.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resources.map((resource, i) => {
              const typeConfig = RESOURCE_TYPES.find(t => t.value === resource.type) || RESOURCE_TYPES[0];
              const isFileType = typeConfig.inputType === 'file';
              return (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr 2fr auto',
                  gap: 8,
                  alignItems: 'start',
                  padding: '12px',
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}>
                  <select
                    value={resource.type}
                    onChange={(e) => updateResource(i, 'type', e.target.value)}
                    style={{
                      background: 'var(--bg-3)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--text)',
                      padding: '8px 10px',
                      fontSize: 13,
                      fontFamily: 'var(--font)',
                      outline: 'none',
                    }}
                  >
                    {RESOURCE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    value={resource.label}
                    onChange={(e) => updateResource(i, 'label', e.target.value)}
                    placeholder="Label (e.g. Live Demo, Case Study)"
                    style={{
                      background: 'var(--bg-3)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--text)',
                      padding: '8px 10px',
                      fontSize: 13,
                      fontFamily: 'var(--font)',
                      outline: 'none',
                    }}
                  />
                  {isFileType ? (
                    <ResourceFileUpload
                      type={resource.type}
                      accept={RESOURCE_ACCEPT[resource.type] || '*'}
                      value={resource.value}
                      onChange={(val) => updateResource(i, 'value', val)}
                    />
                  ) : (
                    <input
                      value={resource.value}
                      onChange={(e) => updateResource(i, 'value', e.target.value)}
                      placeholder="https://..."
                      type="url"
                      style={{
                        background: 'var(--bg-3)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--text)',
                        padding: '8px 10px',
                        fontSize: 13,
                        fontFamily: 'var(--font)',
                        outline: 'none',
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeResource(i)}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 'var(--radius)',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      fontSize: 14,
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Remove resource"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
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

function ResourceFileUpload({ type, accept, value, onChange }: { type: string; accept: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (file: File) => {
    setUploading(true);
    setProgress(0);
    setError('');

    const fd = new FormData();
    fd.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/media/upload');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText) as { media?: { url: string }; error?: string };
        if (xhr.status >= 200 && xhr.status < 300 && data.media) {
          onChange(data.media.url);
        } else {
          setError(data.error ?? `Upload failed (${xhr.status})`);
        }
      } catch {
        setError('Upload failed — invalid response');
      }
      setUploading(false);
    });

    xhr.addEventListener('error', () => {
      setError('Upload failed — network error');
      setUploading(false);
    });

    xhr.addEventListener('abort', () => {
      setError('');
      setUploading(false);
    });

    xhr.send(fd);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <input type="hidden" value={value} />
      {value ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          background: 'var(--bg-3)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          fontSize: 12,
          color: 'var(--text-2)',
        }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value.split('/').pop()}
          </span>
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 10px',
            background: 'var(--bg-3)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-2)',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'var(--font)',
            overflow: 'hidden',
          }}
        >
          {uploading && (
            <span style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${progress}%`,
              background: 'rgba(255,255,255,0.06)',
              transition: 'width 0.2s ease',
              pointerEvents: 'none',
            }} />
          )}
          <span style={{ position: 'relative' }}>
            {uploading ? `Uploading ${progress}%…` : `Upload ${type.toUpperCase()}`}
          </span>
        </button>
      )}
      {error && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</span>}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.length) handleUpload(e.target.files[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
