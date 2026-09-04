'use server';

import { revalidateSite } from '@/lib/revalidate';
import { connectDB } from '@/lib/db';
import { Tech } from '@/lib/models';
import { TechSchema, getValidationErrorMessage } from '@/lib/validations';
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

export async function getTech() {
  await requireAdmin();
  try {
    await connectDB();
    const items = await Tech.find().sort({ order: 1 }).lean();
    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

export async function getTechById(id: string) {
  await requireAdmin();
  try {
    await connectDB();
    const item = await Tech.findById(id).lean();
    if (!item) return null;
    return JSON.parse(JSON.stringify(item));
  } catch {
    return null;
  }
}

export async function createTech(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const raw = {
    name: formData.get('name') as string,
    category: (formData.get('category') as string) || '',
    logo: (formData.get('logo') as string) || '',
    order: parseInt((formData.get('order') as string) ?? '0', 10),
  };
  const parsed = TechSchema.safeParse(raw);
  if (!parsed.success) return { error: getValidationErrorMessage(parsed.error) };
  try {
    await connectDB();
    const item = await Tech.create(parsed.data);
    await auditLog({ action: 'CREATE', resource: 'tech', resourceId: item._id.toString() });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to create tech item.' };
  }
}

export async function updateTech(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const raw = {
    name: formData.get('name') as string,
    category: (formData.get('category') as string) || '',
    logo: (formData.get('logo') as string) || '',
    order: parseInt((formData.get('order') as string) ?? '0', 10),
  };
  const parsed = TechSchema.safeParse(raw);
  if (!parsed.success) return { error: getValidationErrorMessage(parsed.error) };
  try {
    await connectDB();
    await Tech.findByIdAndUpdate(id, parsed.data);
    await auditLog({ action: 'UPDATE', resource: 'tech', resourceId: id });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to update tech item.' };
  }
}

export async function deleteTech(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await connectDB();
    await Tech.findByIdAndDelete(id);
    await auditLog({ action: 'DELETE', resource: 'tech', resourceId: id });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to delete tech item.' };
  }
}

export async function reorderTech(ids: string[]): Promise<ActionState> {
  await requireAdmin();
  try {
    await connectDB();
    await Promise.all(ids.map((id, index) => Tech.findByIdAndUpdate(id, { order: index })));
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to reorder tech items.' };
  }
}
