'use client';

import { useState, useRef } from 'react';

interface GalleryPickerProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  label?: string;
  hint?: string;
}

interface UploadState {
  file: File;
  url?: string;
  uploading: boolean;
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function GalleryPicker({ value = [], onChange, label, hint }: GalleryPickerProps) {
  const [items, setItems] = useState<string[]>(value);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragover, setDragover] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const emitChange = (next: string[]) => {
    setItems(next);
    if (onChange) onChange(next);
  };

  const handleUpload = async (files: FileList) => {
    const newUploads: UploadState[] = Array.from(files).map((file) => ({ file, uploading: true }));
    setUploads((prev) => [...prev, ...newUploads]);

    const uploadedUrls: string[] = [];
    for (let i = 0; i < newUploads.length; i++) {
      const entry = newUploads[i];
      const fd = new FormData();
      fd.append('file', entry.file);
      try {
        const res = await fetch('/api/admin/media/upload', { method: 'POST', body: fd });
        const data = await res.json() as { media?: { url: string }; error?: string };
        if (data.media) {
          uploadedUrls.push(data.media.url);
          setUploads((prev) => prev.map((u, idx) => idx === newUploads.indexOf(entry) ? { ...u, url: data.media!.url, uploading: false } : u));
        } else {
          setUploads((prev) => prev.map((u, idx) => idx === newUploads.indexOf(entry) ? { ...u, error: data.error ?? 'Upload failed', uploading: false } : u));
        }
      } catch {
        setUploads((prev) => prev.map((u, idx) => idx === newUploads.indexOf(entry) ? { ...u, error: 'Upload failed', uploading: false } : u));
      }
    }

    if (uploadedUrls.length > 0) {
      const next = [...items, ...uploadedUrls];
      emitChange(next);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
    if (e.target === e.currentTarget && e.dataTransfer.files.length) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const removeItem = (url: string) => {
    emitChange(items.filter((u) => u !== url));
  };

  const removeUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const retryUpload = (index: number) => {
    const entry = uploads[index];
    if (!entry) return;
    setUploads((prev) => prev.map((u, i) => i === index ? { ...u, uploading: true, error: undefined } : u));
    const fd = new FormData();
    fd.append('file', entry.file);
    fetch('/api/admin/media/upload', { method: 'POST', body: fd })
      .then(res => res.json())
      .then((data: { media?: { url: string }; error?: string }) => {
        if (data.media) {
          setUploads((prev) => prev.map((u, i) => i === index ? { ...u, url: data.media!.url, uploading: false } : u));
          emitChange([...items, data.media!.url]);
        } else {
          setUploads((prev) => prev.map((u, i) => i === index ? { ...u, error: data.error ?? 'Upload failed', uploading: false } : u));
        }
      })
      .catch(() => {
        setUploads((prev) => prev.map((u, i) => i === index ? { ...u, error: 'Upload failed', uploading: false } : u));
      });
  };

  const confirmUploads = () => {
    const successUrls = uploads.filter((u) => u.url && !u.error).map((u) => u.url!);
    if (successUrls.length > 0) {
      emitChange([...items, ...successUrls]);
    }
    setUploads([]);
  };

  return (
    <div className="field">
      {label && <label>{label}</label>}

      {items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {items.map((url) => (
            <div key={url} style={{ position: 'relative', width: 100, height: 80, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => removeItem(url)}
                style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {uploads.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {uploads.map((u, i) => (
            <div key={i} style={{ position: 'relative', width: 100, height: 80, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)', opacity: u.uploading ? 0.6 : 1 }}>
              {u.url ? (
                <img src={u.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-3)', fontSize: 11, color: 'var(--text-2)', gap: 4 }}>
                  {u.uploading ? (
                    <>
                      <span style={{ fontSize: 16 }}>↑</span>
                      <span>Uploading…</span>
                    </>
                  ) : u.error ? (
                    <>
                      <span style={{ fontSize: 16 }}>!</span>
                      <button type="button" onClick={() => retryUpload(i)} style={{ fontSize: 10, color: 'var(--fg-1)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
                    </>
                  ) : null}
                </div>
              )}
              <button
                type="button"
                onClick={() => removeUpload(i)}
                style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Remove"
              >
                ×
              </button>
              {u.error && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: 9, padding: '2px 4px', textAlign: 'center' }}>{u.error}</div>}
              {u.file && !u.uploading && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, padding: '2px 4px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.file.name} · {formatFileSize(u.file.size)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {uploads.some((u) => u.url && !u.error) && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={confirmUploads} style={{ marginBottom: 8 }}>
          Confirm {uploads.filter((u) => u.url && !u.error).length} uploaded
        </button>
      )}

      <div
        className={`upload-zone${dragover ? ' dragover' : ''}`}
        style={{ padding: '14px 10px', minHeight: '80px' }}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <div className="upload-zone-text" style={{ fontSize: 13 }}>Drop images or click to upload</div>
        <div className="upload-zone-hint" style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
          Recommended: 1920 × 1080 px · 16:9 · JPG, PNG, WebP · Max 10 MB
        </div>
        {hint && <div className="upload-zone-hint">{hint}</div>}
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.length) handleUpload(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
