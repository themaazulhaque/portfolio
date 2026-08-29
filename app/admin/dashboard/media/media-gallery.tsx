'use client';

import { useState, useRef, useTransition, useCallback } from 'react';

interface IMedia { _id: string; filename: string; url: string; originalName: string; size: number; type: string; createdAt: string; }

export function MediaGallery({ initialItems }: { initialItems: IMedia[] }) {
  const [items, setItems] = useState(initialItems);
  const [dragover, setDragover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    setUploadError('');
    const uploaded: IMedia[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/admin/media/upload', { method: 'POST', body: fd });
        const data = await res.json() as { media?: IMedia; error?: string };
        if (data.media) uploaded.push(data.media);
        else setUploadError(data.error ?? 'Upload failed');
      } catch {
        setUploadError('Upload failed');
      }
    }
    setItems((p) => [...uploaded, ...p]);
    setUploading(false);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragover(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  function handleDelete(id: string, url: string) {
    if (!confirm('Delete this file?')) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((p) => p.filter((x) => x._id !== id));
      }
    });
    void url;
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).catch(() => null);
  }

  return (
    <div>
      {/* Upload zone */}
      <div
        className={`upload-zone${dragover ? ' dragover' : ''}`}
        style={{ marginBottom: 24 }}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <div className="upload-zone-icon">↑</div>
        <div className="upload-zone-text">{uploading ? 'Uploading…' : 'Drop files here or click to upload'}</div>
        <div className="upload-zone-hint">Images, videos, PDFs · Max 10 MB each</div>
        <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); }} />
      </div>

      {uploadError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{uploadError}</div>}

      {items.length === 0 ? (
        <div className="empty"><div className="empty-icon">◉</div><div className="empty-text">No media uploaded yet</div></div>
      ) : (
        <div className="media-grid">
          {items.map((m) => (
            <div key={m._id} className="media-item">
              {m.type === 'image' ? (
                <img src={m.url} alt={m.originalName} />
              ) : (
                <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-3)', fontSize: 28 }}>
                  {m.type === 'video' ? '🎬' : '📄'}
                </div>
              )}
              <div className="media-item-name">{m.originalName}</div>
              <div className="media-item-actions">
                <button onClick={() => copyUrl(m.url)} className="btn btn-secondary btn-icon btn-sm" title="Copy URL" style={{ fontSize: 14 }}>⎘</button>
                <button onClick={() => handleDelete(m._id, m.url)} className="btn btn-danger btn-icon btn-sm" title="Delete">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
