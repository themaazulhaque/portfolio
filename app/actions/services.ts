'use server';

import { revalidateSite } from '@/lib/revalidate';
import { connectDB } from '@/lib/db';
import { Service } from '@/lib/models';
import { ServiceSchema, getValidationErrorMessage } from '@/lib/validations';
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

export async function getServices() {
  await requireAdmin();
  try {
    await connectDB();
    const items = await Service.find().sort({ order: 1 }).lean();
    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

export async function getServiceById(id: string) {
  await requireAdmin();
  try {
    await connectDB();
    const item = await Service.findById(id).lean();
    if (!item) return null;
    return JSON.parse(JSON.stringify(item));
  } catch {
    return null;
  }
}

export async function createService(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const raw = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    icon: (formData.get('icon') as string) || undefined,
    order: parseInt((formData.get('order') as string) ?? '0', 10),
  };
  const parsed = ServiceSchema.safeParse(raw);
  if (!parsed.success) return { error: getValidationErrorMessage(parsed.error) };
  try {
    await connectDB();
    const item = await Service.create(parsed.data);
    await auditLog({ action: 'CREATE', resource: 'service', resourceId: item._id.toString() });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to create service.' };
  }
}

export async function updateService(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const raw = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    icon: (formData.get('icon') as string) || undefined,
    order: parseInt((formData.get('order') as string) ?? '0', 10),
  };
  const parsed = ServiceSchema.safeParse(raw);
  if (!parsed.success) return { error: getValidationErrorMessage(parsed.error) };
  try {
    await connectDB();
    await Service.findByIdAndUpdate(id, parsed.data);
    await auditLog({ action: 'UPDATE', resource: 'service', resourceId: id });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to update service.' };
  }
}

export async function deleteService(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await connectDB();
    await Service.findByIdAndDelete(id);
    await auditLog({ action: 'DELETE', resource: 'service', resourceId: id });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to delete service.' };
  }
}
