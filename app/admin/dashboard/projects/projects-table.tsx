'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteProject, toggleProjectPublish, reorderProjects } from '@/app/actions/projects';

interface Project {
  _id: string;
  num: string;
  title: string;
  slug: string;
  cat: string;
  year: string;
  published: boolean;
  featured: boolean;
  image?: string;
}

export function ProjectsTable({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [, startTransition] = useTransition();
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function handleDelete(id: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    startTransition(async () => {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    });
  }

  function handleTogglePublish(id: string, current: boolean) {
    startTransition(async () => {
      await toggleProjectPublish(id, !current);
      setProjects((prev) =>
        prev.map((p) => (p._id === id ? { ...p, published: !current } : p))
      );
    });
  }

  function handleDragStart(idx: number) { setDragIdx(idx); }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...projects];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setProjects(reordered);
    setDragIdx(idx);
  }
  function handleDrop() {
    setDragIdx(null);
    startTransition(async () => {
      await reorderProjects(projects.map((p) => p._id));
    });
  }

  if (projects.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">◰</div>
        <div className="empty-text">No projects yet</div>
        <div className="empty-hint">Create your first project to get started.</div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th style={{ width: 30 }}></th>
            <th>Project</th>
            <th>Category</th>
            <th>Year</th>
            <th>Status</th>
            <th>Featured</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p, idx) => (
            <tr
              key={p._id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={handleDrop}
              style={dragIdx === idx ? { opacity: 0.5 } : undefined}
            >
              <td>
                <span className="drag-handle" title="Drag to reorder">⠿</span>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {p.image && (
                    <img src={p.image} alt="" className="img-preview" />
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.slug}</div>
                  </div>
                </div>
              </td>
              <td><span className="badge badge-gray">{p.cat}</span></td>
              <td style={{ color: 'var(--text-2)' }}>{p.year}</td>
              <td>
                <label className="toggle" title={p.published ? 'Published' : 'Draft'}>
                  <input
                    type="checkbox"
                    checked={p.published}
                    onChange={() => handleTogglePublish(p._id, p.published)}
                  />
                  <span className="toggle-track" />
                </label>
              </td>
              <td>
                {p.featured ? (
                  <span className="badge badge-accent">Featured</span>
                ) : (
                  <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>
                )}
              </td>
              <td>
                <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                  <Link href={`/admin/dashboard/projects/${p._id}`} className="btn btn-ghost btn-sm">
                    Edit
                  </Link>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
