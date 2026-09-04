'use server';

import { connectDB } from '@/lib/db';
import { Experience } from '@/lib/models';
import { ExperienceSchema, getValidationErrorMessage } from '@/lib/validations';
import { auditLog } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { revalidateSite } from '@/lib/revalidate';
import { redirect } from 'next/navigation';
import type { AdminExperience } from '@/lib/types';

async function requireAdmin(): Promise<void> {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

interface ActionState {
  error?: string;
  success?: boolean;
}

export async function getExperiences(): Promise<AdminExperience[]> {
  await requireAdmin();
  try {
    await connectDB();
    const items = await Experience.find().sort({ order: 1 }).lean();
    return JSON.parse(JSON.stringify(items)) as AdminExperience[];
  } catch {
    return [];
  }
}

export async function getExperienceById(id: string): Promise<AdminExperience | null> {
  await requireAdmin();
  try {
    await connectDB();
    const item = await Experience.findById(id).lean();
    if (!item) return null;
    return JSON.parse(JSON.stringify(item)) as AdminExperience;
  } catch {
    return null;
  }
}

export async function createExperience(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const raw = {
    company: formData.get('company') as string,
    role: formData.get('role') as string,
    period: formData.get('period') as string,
    startDate: formData.get('startDate') as string,
    endDate: (formData.get('endDate') as string) || undefined,
    current: formData.get('current') === 'true',
    description: formData.get('description') as string,
    tech: parseStringArray(formData.get('tech')),
    order: parseInt((formData.get('order') as string) ?? '0', 10),
  };
  const parsed = ExperienceSchema.safeParse(raw);
  if (!parsed.success) return { error: getValidationErrorMessage(parsed.error) };
  try {
    await connectDB();
    const item = await Experience.create(parsed.data);
    await auditLog({ action: 'CREATE', resource: 'experience', resourceId: item._id.toString() });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to create experience.' };
  }
}

export async function updateExperience(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const raw = {
    company: formData.get('company') as string,
    role: formData.get('role') as string,
    period: formData.get('period') as string,
    startDate: formData.get('startDate') as string,
    endDate: (formData.get('endDate') as string) || undefined,
    current: formData.get('current') === 'true',
    description: formData.get('description') as string,
    tech: parseStringArray(formData.get('tech')),
    order: parseInt((formData.get('order') as string) ?? '0', 10),
  };
  const parsed = ExperienceSchema.safeParse(raw);
  if (!parsed.success) return { error: getValidationErrorMessage(parsed.error) };
  try {
    await connectDB();
    await Experience.findByIdAndUpdate(id, parsed.data);
    await auditLog({ action: 'UPDATE', resource: 'experience', resourceId: id });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to update experience.' };
  }
}

function parseStringArray(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  if (typeof value !== 'string') return [];
  if (!value.trim()) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    // Fall back to comma-separated parsing for legacy inputs
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function deleteExperience(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await connectDB();
    await Experience.findByIdAndDelete(id);
    await auditLog({ action: 'DELETE', resource: 'experience', resourceId: id });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to delete experience.' };
  }
}

export async function reorderExperiences(ids: string[]): Promise<ActionState> {
  await requireAdmin();
  try {
    await connectDB();
    await Promise.all(ids.map((id, index) => Experience.findByIdAndUpdate(id, { order: index })));
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to reorder experiences.' };
  }
}
