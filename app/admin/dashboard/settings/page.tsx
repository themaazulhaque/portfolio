import { connectDB } from '@/lib/db';
import { SiteSettings, SocialLink } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { SettingsForm } from './settings-form';

async function getData() {
  try {
    await connectDB();
    const [settings, socialLinks] = await Promise.all([
      SiteSettings.findOne().lean(),
      SocialLink.find().sort({ order: 1 }).lean(),
    ]);
    return {
      settings: settings ? JSON.parse(JSON.stringify(settings)) : null,
      socialLinks: JSON.parse(JSON.stringify(socialLinks)),
    };
  } catch {
    return { settings: null, socialLinks: [] };
  }
}

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  const { settings, socialLinks } = await getData();

  return (
    <div className="admin-content">
      <div className="page-header">
        <div><h1 className="page-title">Settings</h1><p className="page-sub">Site metadata, resume, and social links</p></div>
      </div>
      <SettingsForm settings={settings} socialLinks={socialLinks} />
    </div>
  );
}
