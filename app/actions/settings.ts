'use server';

import { revalidateSite } from '@/lib/revalidate';
import { connectDB } from '@/lib/db';
import { SiteSettings, SocialLink } from '@/lib/models';
import { SiteSettingsSchema, SocialLinkSchema, getValidationErrorMessage } from '@/lib/validations';
import { auditLog } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

async function requireAdmin(): Promise<void> {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

interface ActionState {
  error?: string;
  success?: boolean;
}

// ==========================================
// SITE SETTINGS
// ==========================================
export async function getSiteSettings() {
  try {
    await connectDB();
    const settings = await SiteSettings.findOne().lean();
    if (!settings) return null;
    return JSON.parse(JSON.stringify(settings));
  } catch {
    return null;
  }
}

export async function updateSiteSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const raw = {
    name: formData.get('name') as string,
    title: formData.get('title') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || undefined,
    location: (formData.get('location') as string) || undefined,
    availability: formData.get('availability') as string,
    resumeUrl: (formData.get('resumeUrl') as string) || undefined,
    seoTitle: (formData.get('seoTitle') as string) || undefined,
    seoDescription: (formData.get('seoDescription') as string) || undefined,
    ogImageUrl: (formData.get('ogImageUrl') as string) || undefined,
    faviconUrl: (formData.get('faviconUrl') as string) || undefined,
    aboutPortrait: (formData.get('aboutPortrait') as string) || undefined,
    testimonialVideo: (formData.get('testimonialVideo') as string) || undefined,
  };
  const parsed = SiteSettingsSchema.safeParse(raw);
  if (!parsed.success) return { error: getValidationErrorMessage(parsed.error) };
  try {
    await connectDB();
    await SiteSettings.findOneAndUpdate({}, parsed.data, { upsert: true, new: true });
    await auditLog({ action: 'UPDATE', resource: 'site_settings' });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to update settings.' };
  }
}

// ==========================================
// SOCIAL LINKS
// ==========================================
export async function getSocialLinks() {
  try {
    await connectDB();
    const items = await SocialLink.find().sort({ order: 1 }).lean();
    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

export async function upsertSocialLink(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = formData.get('id') as string;
  const raw = {
    platform: formData.get('platform') as string,
    url: formData.get('url') as string,
    order: parseInt((formData.get('order') as string) ?? '0', 10),
    visible: formData.get('visible') === 'true',
  };
  const parsed = SocialLinkSchema.safeParse(raw);
  if (!parsed.success) return { error: getValidationErrorMessage(parsed.error) };
  try {
    await connectDB();
    let savedId = id || undefined;
    if (id) {
      await SocialLink.findByIdAndUpdate(id, parsed.data);
      await auditLog({ action: 'UPDATE', resource: 'social_link', resourceId: id });
    } else {
      const item = await SocialLink.create(parsed.data);
      savedId = item._id.toString();
      await auditLog({ action: 'CREATE', resource: 'social_link', resourceId: savedId });
    }
    revalidateSite();
    return { success: true, id: savedId };
  } catch {
    return { error: 'Failed to save social link.' };
  }
}

export async function deleteSocialLink(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await connectDB();
    await SocialLink.findByIdAndDelete(id);
    await auditLog({ action: 'DELETE', resource: 'social_link', resourceId: id });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to delete social link.' };
  }
}
