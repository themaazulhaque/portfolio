'use server';

import { revalidateSite } from '@/lib/revalidate';
import { connectDB } from '@/lib/db';
import { Skill } from '@/lib/models';
import { SkillSchema, getValidationErrorMessage } from '@/lib/validations';
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

export async function getSkills() {
  await requireAdmin();
  try {
    await connectDB();
    const items = await Skill.find().sort({ category: 1, order: 1 }).lean();
    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

export async function getSkillById(id: string) {
  await requireAdmin();
  try {
    await connectDB();
    const item = await Skill.findById(id).lean();
    if (!item) return null;
    return JSON.parse(JSON.stringify(item));
  } catch {
    return null;
  }
}

export async function createSkill(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const raw = {
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    proficiency: parseInt((formData.get('proficiency') as string) ?? '100', 10),
    icon: (formData.get('icon') as string) || undefined,
    order: parseInt((formData.get('order') as string) ?? '0', 10),
  };
  const parsed = SkillSchema.safeParse(raw);
  if (!parsed.success) return { error: getValidationErrorMessage(parsed.error) };
  try {
    await connectDB();
    const item = await Skill.create(parsed.data);
    await auditLog({ action: 'CREATE', resource: 'skill', resourceId: item._id.toString() });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to create skill.' };
  }
}

export async function updateSkill(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const raw = {
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    proficiency: parseInt((formData.get('proficiency') as string) ?? '100', 10),
    icon: (formData.get('icon') as string) || undefined,
    order: parseInt((formData.get('order') as string) ?? '0', 10),
  };
  const parsed = SkillSchema.safeParse(raw);
  if (!parsed.success) return { error: getValidationErrorMessage(parsed.error) };
  try {
    await connectDB();
    await Skill.findByIdAndUpdate(id, parsed.data);
    await auditLog({ action: 'UPDATE', resource: 'skill', resourceId: id });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to update skill.' };
  }
}

export async function deleteSkill(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await connectDB();
    await Skill.findByIdAndDelete(id);
    await auditLog({ action: 'DELETE', resource: 'skill', resourceId: id });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to delete skill.' };
  }
}

export async function reorderSkills(ids: string[]) {
  await requireAdmin();
  await connectDB();
  await Promise.all(ids.map((id, index) => Skill.findByIdAndUpdate(id, { order: index })));
  revalidateSite();
}
