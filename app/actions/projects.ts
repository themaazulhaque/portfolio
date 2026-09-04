'use server';

import { connectDB } from '@/lib/db';
import { Project } from '@/lib/models';
import { ProjectSchema, type ProjectInput, getValidationErrorMessage } from '@/lib/validations';
import { auditLog } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { revalidateSite } from '@/lib/revalidate';
import { redirect } from 'next/navigation';

async function requireAdmin(): Promise<void> {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

// ==========================================
// LIST
// ==========================================
export async function getProjects() {
  await requireAdmin();
  try {
    await connectDB();
    const projects = await Project.find().sort({ order: 1, createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(projects)) as typeof projects;
  } catch {
    return [] as unknown as Awaited<ReturnType<typeof Project.find>>;
  }
}

// ==========================================
// GET BY ID
// ==========================================
export async function getProjectById(id: string) {
  await requireAdmin();
  try {
    await connectDB();
    const project = await Project.findById(id).lean();
    if (!project) return null;
    return JSON.parse(JSON.stringify(project)) as typeof project;
  } catch {
    return null;
  }
}

// ==========================================
// CREATE
// ==========================================
export interface ProjectActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

export async function createProject(
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  await requireAdmin();

  const raw = buildProjectRaw(formData);
  const parsed = ProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: getValidationErrorMessage(parsed.error) };
  }

  try {
    await connectDB();
    const count = await Project.countDocuments();
    const num = String(count + 1).padStart(2, '0');
    const project = await Project.create({ ...parsed.data, num });
    await auditLog({ action: 'CREATE', resource: 'project', resourceId: project._id.toString() });
    revalidateSite();
    return { success: true, id: project._id.toString() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('duplicate key')) {
      return { error: 'A project with this slug already exists.' };
    }
    return { error: 'Failed to create project.' };
  }
}

// ==========================================
// UPDATE
// ==========================================
export async function updateProject(
  id: string,
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  await requireAdmin();

  const raw = buildProjectRaw(formData);
  const parsed = ProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: getValidationErrorMessage(parsed.error) };
  }

  try {
    await connectDB();
    await Project.findByIdAndUpdate(id, parsed.data, { runValidators: true });
    await auditLog({ action: 'UPDATE', resource: 'project', resourceId: id });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to update project.' };
  }
}

// ==========================================
// DELETE
// ==========================================
export async function deleteProject(id: string): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();
  try {
    await connectDB();
    await Project.findByIdAndDelete(id);
    await auditLog({ action: 'DELETE', resource: 'project', resourceId: id });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to delete project.' };
  }
}

// ==========================================
// TOGGLE PUBLISH
// ==========================================
export async function toggleProjectPublish(id: string, published: boolean): Promise<ProjectActionState> {
  await requireAdmin();
  try {
    await connectDB();
    await Project.findByIdAndUpdate(id, { published });
    await auditLog({
      action: published ? 'PUBLISH' : 'UNPUBLISH',
      resource: 'project',
      resourceId: id,
    });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to update publish status.' };
  }
}

// ==========================================
// REORDER
// ==========================================
export async function reorderProjects(ids: string[]): Promise<ProjectActionState> {
  await requireAdmin();
  try {
    await connectDB();
    await Promise.all(ids.map((id, index) => Project.findByIdAndUpdate(id, { order: index })));
    await auditLog({ action: 'REORDER', resource: 'project' });
    revalidateSite();
    return { success: true };
  } catch {
    return { error: 'Failed to reorder projects.' };
  }
}

// ==========================================
// HELPERS
// ==========================================
function buildProjectRaw(formData: FormData): ProjectInput {
  return {
    slug: ((formData.get('slug') as string) ?? '').trim(),
    cat: (formData.get('cat') as string) ?? '',
    title: (formData.get('title') as string) ?? '',
    subtitle: (formData.get('subtitle') as string) ?? '',
    desc: (formData.get('desc') as string) ?? '',
    image: (formData.get('image') as string) || undefined,
    coverImage: (formData.get('coverImage') as string) || undefined,
    thumbnailImage: (formData.get('thumbnailImage') as string) || undefined,
    logoImage: (formData.get('logoImage') as string) || undefined,
    featureBanner: (formData.get('featureBanner') as string) || undefined,
    mobileScreenshot: (formData.get('mobileScreenshot') as string) || undefined,
    desktopScreenshot: (formData.get('desktopScreenshot') as string) || undefined,
    tabletScreenshot: (formData.get('tabletScreenshot') as string) || undefined,
    client: (formData.get('client') as string) ?? '',
    clientWebsite: (formData.get('clientWebsite') as string) || undefined,
    year: (formData.get('year') as string) ?? '',
    role: (formData.get('role') as string) ?? '',
    stack: (formData.get('stack') as string) ?? '',
    techStack: parseJsonField(formData, 'techStack', []),
    liveUrl: (formData.get('liveUrl') as string) || null,
    githubUrl: (formData.get('githubUrl') as string) || undefined,
    repository: (formData.get('repository') as string) || undefined,
    documentationUrl: (formData.get('documentationUrl') as string) || undefined,
    figmaUrl: (formData.get('figmaUrl') as string) || undefined,
    casePdfUrl: (formData.get('casePdfUrl') as string) || undefined,
    videoUrl: (formData.get('videoUrl') as string) || undefined,
    demoCredentials: (formData.get('demoCredentials') as string) || undefined,
    overview: parseJsonField(formData, 'overview', []),
    challenge: parseJsonField(formData, 'challenge', []),
    solution: parseJsonField(formData, 'solution', []),
    process: parseJsonField(formData, 'process', []),
    gallery: parseJsonField(formData, 'gallery', []),
    results: parseJsonField(formData, 'results', []),
    additionalLinks: parseJsonField(formData, 'additionalLinks', []),
    featured: formData.get('featured') === 'true',
    published: formData.get('published') === 'true',
    order: parseInt((formData.get('order') as string) || '0', 10),
  };
}

function parseJsonField<T>(formData: FormData, key: string, fallback: T): T {
  try {
    const val = formData.get(key) as string;
    if (!val) return fallback;
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}
