'use client';

import { useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSiteSettings, upsertSocialLink, deleteSocialLink } from '@/app/actions/settings';
import { MediaPicker } from '@/app/admin/components/media-picker';

interface ISiteSettings {
  name?: string; title?: string; email?: string; phone?: string;
  location?: string; availability?: string; resumeUrl?: string;
  seoTitle?: string; seoDescription?: string; ogImageUrl?: string;
  faviconUrl?: string; aboutPortrait?: string; testimonialVideo?: string;
}
interface ISocialLink { _id: string; platform: string; url: string; order: number; visible: boolean; }
interface Props { settings?: ISiteSettings | null; socialLinks: ISocialLink[]; }
const init = {};

const PLATFORMS = ['GitHub', 'LinkedIn', 'Email', 'Twitter/X', 'Instagram', 'YouTube', 'Other'];

export function SettingsForm({ settings, socialLinks: initialLinks }: Props) {
  const router = useRouter();
  const [settingsState, settingsAction, settingsPending] = useActionState(updateSiteSettings, init);
  const [links, setLinks] = useState(initialLinks);
  const [, startTransition] = useTransition();
  const [newLink, setNewLink] = useState({ platform: 'GitHub', url: '' });
  const [socialState, setSocialState] = useState('');

  function handleDeleteLink(id: string) {
    if (!confirm('Delete this link?')) return;
    startTransition(async () => {
      const result = await deleteSocialLink(id);
      if (result.success) {
        setLinks((p) => p.filter((x) => x._id !== id));
      }
    });
  }

  function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!newLink.url.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('platform', newLink.platform);
      fd.set('url', newLink.url);
      fd.set('order', String(links.length));
      fd.set('visible', 'true');
      const result = await upsertSocialLink(init, fd) as { error?: string; success?: boolean; id?: string };
      if (result.success) {
        setSocialState('Saved!');
        setLinks((p) => [
          ...p,
          { _id: result.id ?? `new-${Date.now()}`, platform: newLink.platform, url: newLink.url, order: p.length, visible: true }
        ]);
        setNewLink({ platform: 'GitHub', url: '' });
        router.refresh();
      } else {
        setSocialState(result.error ?? 'Error');
      }
      setTimeout(() => setSocialState(''), 3000);
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* SITE SETTINGS */}
      <form action={settingsAction}>
        {(settingsState as { error?: string }).error && <div className="alert alert-error">{(settingsState as { error?: string }).error}</div>}
        {(settingsState as { success?: boolean }).success && <div className="alert alert-success">Settings saved!</div>}

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Personal Info</span></div>
          <div className="card-body">
            <div className="form-grid">
              <div className="field"><label>Name</label><input name="name" defaultValue={settings?.name} /></div>
              <div className="field"><label>Title / Tagline</label><input name="title" defaultValue={settings?.title} /></div>
            </div>
            <div className="form-grid">
              <div className="field"><label>Email</label><input name="email" type="email" defaultValue={settings?.email} /></div>
              <div className="field"><label>Phone</label><input name="phone" defaultValue={settings?.phone} /></div>
            </div>
            <div className="form-grid">
              <div className="field"><label>Location</label><input name="location" defaultValue={settings?.location} /></div>
              <div className="field">
                <label>Availability</label>
                <select name="availability" defaultValue={settings?.availability ?? 'available'}>
                  <option value="available">Available for Work</option>
                  <option value="limited">Limited Availability</option>
                  <option value="unavailable">Not Available</option>
                </select>
              </div>
            </div>
            <div className="field"><label>Resume URL</label><input name="resumeUrl" defaultValue={settings?.resumeUrl} placeholder="/resume.pdf" /></div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">SEO & Meta</span></div>
          <div className="card-body">
            <div className="field"><label>SEO Title</label><input name="seoTitle" defaultValue={settings?.seoTitle} /></div>
            <div className="field"><label>SEO Description</label><textarea name="seoDescription" defaultValue={settings?.seoDescription} rows={2} /></div>
            <div className="form-grid">
              <MediaPicker name="ogImageUrl" label="OG Image" value={settings?.ogImageUrl} accept="image/*" hint="Image for social sharing" />
              <MediaPicker name="faviconUrl" label="Favicon" value={settings?.faviconUrl} accept="image/*" hint="Site favicon icon" />
            </div>
            <MediaPicker name="aboutPortrait" label="About Portrait" value={settings?.aboutPortrait} accept="image/*" hint="Portrait photo for the About section" />
            <MediaPicker name="testimonialVideo" label="Testimonial Video" value={settings?.testimonialVideo} accept="video/mp4,video/webm" hint="Video for the testimonials section (square format preferred)" />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={settingsPending} style={{ marginBottom: 24 }}>
          {settingsPending ? 'Saving…' : 'Save Settings'}
        </button>
      </form>

      {/* SOCIAL LINKS */}
      <div className="card">
        <div className="card-header"><span className="card-title">Social Links</span></div>
        <div className="card-body">
          {socialState && <div className={`alert ${socialState === 'Saved!' ? 'alert-success' : 'alert-error'}`}>{socialState}</div>}
          {links.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {links.map((l) => (
                <div key={l._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="badge badge-accent" style={{ minWidth: 80 }}>{l.platform}</span>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.url}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteLink(l._id)}>Delete</button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleAddLink}>
            <div className="form-grid">
              <div className="field">
                <label>Platform</label>
                <select value={newLink.platform} onChange={(e) => setNewLink((p) => ({ ...p, platform: e.target.value }))}>
                  {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="field">
                <label>URL</label>
                <input type="url" value={newLink.url} onChange={(e) => setNewLink((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." required />
              </div>
            </div>
            <button type="submit" className="btn btn-secondary">+ Add Link</button>
          </form>
        </div>
      </div>
    </div>
  );
}
