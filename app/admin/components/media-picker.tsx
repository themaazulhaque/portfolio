'use client';

import { useState, useRef } from 'react';

interface IMedia {
  _id: string;
  url: string;
  originalName: string;
  type: string;
  size?: number;
}

interface MediaPickerProps {
  name: string;
  value?: string;
  onChange?: (url: string) => void;
  label?: string;
  hint?: string;
  accept?: string;
  Recommended?: string;
  aspectWarning?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function MediaPicker({ name, value = '', onChange, label, hint, accept = 'image/*,video/*,.pdf' }: MediaPickerProps) {
  const [currentUrl, setCurrentUrl] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragover, setDragover] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [ratioWarning, setRatioWarning] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const checkAspectRatio = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setRatioWarning('');
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = img.width / img.height;
      const targetRatio = 16 / 9;
      if (Math.abs(ratio - targetRatio) > 0.15) {
        setRatioWarning('Recommended ratio is 16:9. This image may crop in the project preview.');
      } else {
        setRatioWarning('');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError('');
    setFileName(file.name);
    setFileSize(file.size);
    checkAspectRatio(file);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: fd });
      const data = await res.json() as { media?: IMedia; error?: string };
      if (data.media) {
        setCurrentUrl(data.media.url);
        if (onChange) onChange(data.media.url);
      } else {
        setError(data.error ?? 'Upload failed');
      }
    } catch {
      setError('Upload failed');
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
    if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files[0]);
  };

  const clearMedia = () => {
    setCurrentUrl('');
    setFileName('');
    setFileSize(0);
    setRatioWarning('');
    if (onChange) onChange('');
  };

  const retryUpload = () => {
    setError('');
    if (fileRef.current?.files?.length) {
      handleUpload(fileRef.current.files[0]);
    }
  };

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <input type="hidden" name={name} value={currentUrl} />

      {!currentUrl ? (
        <div
          className={`upload-zone${dragover ? ' dragover' : ''}`}
          style={{ padding: '20px 10px', minHeight: '120px' }}
          onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
          onDragLeave={() => setDragover(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="upload-zone-icon" style={{ fontSize: '24px' }}>↑</div>
          <div className="upload-zone-text">{uploading ? 'Uploading…' : 'Drop file or click to upload'}</div>
          <div className="upload-zone-hint" style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
            Recommended: 1920 × 1080 px · 16:9 · JPG, PNG, WebP · Max 10 MB
          </div>
          {hint && <div className="upload-zone-hint">{hint}</div>}
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {currentUrl.match(/\.(mp4|webm)$/i) ? (
            <video src={currentUrl} controls style={{ width: '100%', maxHeight: '200px', background: '#000' }} />
          ) : currentUrl.match(/\.pdf$/i) ? (
            <div style={{ padding: 20, textAlign: 'center', background: 'var(--bg-2)' }}>📄 PDF Document</div>
          ) : (
            <img src={currentUrl} alt="" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', background: 'var(--bg-2)' }} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-2)', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
              {fileName || currentUrl.split('/').pop()}
              {fileSize > 0 && <span style={{ marginLeft: 8, opacity: 0.6 }}>{formatFileSize(fileSize)}</span>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} title="Replace">Replace</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={clearMedia} title="Remove">×</button>
            </div>
          </div>
        </div>
      )}

      {ratioWarning && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>{ratioWarning}</div>}
      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{error}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={retryUpload} style={{ fontSize: 11, padding: '2px 8px' }}>Retry</button>
        </div>
      )}

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
