import { z } from 'zod';

export function getValidationErrorMessage(error: z.ZodError | null | undefined): string {
  if (!error?.issues?.length) {
    return 'Please review the provided information and try again.';
  }

  const firstIssue = error.issues[0];
  const field = firstIssue.path?.filter((part) => typeof part === 'string' || typeof part === 'number').join('.') || '';
  const fallback = firstIssue.message || 'Please review the provided information and try again.';

  if (!field) {
    return fallback;
  }

  return `${field}: ${fallback}`;
}

function normalizeOptionalUrlInput(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('/')) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    try {
      return new URL(trimmed, baseUrl).toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

function optionalUrlField() {
  return z.preprocess(normalizeOptionalUrlInput, z.string().url().optional());
}

function optionalNullableUrlField() {
  return z
    .preprocess(normalizeOptionalUrlInput, z.string().url().optional())
    .transform((value) => value ?? null);
}

// ==========================================
// LOGIN
// ==========================================
export const LoginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }).trim().toLowerCase(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// ==========================================
// PROJECT
// ==========================================
export const ProcessStepSchema = z.object({
  step: z.string().min(1),
  title: z.string().min(1),
  desc: z.string().min(1),
});

export const ResultSchema = z.object({
  metric: z.string().min(1),
  label: z.string().min(1),
});

export const AdditionalLinkSchema = z.object({
  label: z.string().min(1).trim(),
  url: z.string().min(1).trim(),
});

export const ProjectSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
  cat: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional().or(z.literal('')),
  desc: z.string().optional().or(z.literal('')),
  image: z.string().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  coverImage: z.string().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  thumbnailImage: z.string().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  logoImage: z.string().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  featureBanner: z.string().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  mobileScreenshot: z.string().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  desktopScreenshot: z.string().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  tabletScreenshot: z.string().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  client: z.string().optional().or(z.literal('')),
  clientWebsite: optionalUrlField(),
  year: z.string().optional().or(z.literal('')),
  role: z.string().optional().or(z.literal('')),
  stack: z.string().optional().or(z.literal('')),
  techStack: z.array(z.string()).default([]),
  liveUrl: optionalNullableUrlField(),
  githubUrl: optionalUrlField(),
  repository: optionalUrlField(),
  documentationUrl: optionalUrlField(),
  figmaUrl: optionalUrlField(),
  casePdfUrl: optionalUrlField(),
  videoUrl: optionalUrlField(),
  demoCredentials: z.string().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  overview: z.array(z.string()).default([]),
  challenge: z.array(z.string()).default([]),
  solution: z.array(z.string()).default([]),
  process: z.array(ProcessStepSchema).default([]),
  gallery: z.array(z.string()).default([]),
  results: z.array(ResultSchema).default([]),
  additionalLinks: z.array(AdditionalLinkSchema).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  order: z.number().default(0),
});
export type ProjectInput = z.infer<typeof ProjectSchema>;

// ==========================================
// EXPERIENCE
// ==========================================
export const ExperienceSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  period: z.string().min(1, 'Period is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().default(''),
  tech: z.array(z.string()).default([]),
  order: z.number().default(0),
});
export type ExperienceInput = z.infer<typeof ExperienceSchema>;

// ==========================================
// SKILL
// ==========================================
export const SkillSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  proficiency: z.number().min(0).max(100).default(100),
  icon: z.string().optional(),
  order: z.number().default(0),
});
export type SkillInput = z.infer<typeof SkillSchema>;

// ==========================================
// SERVICE
// ==========================================
export const ServiceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  icon: z.string().optional(),
  order: z.number().default(0),
});
export type ServiceInput = z.infer<typeof ServiceSchema>;

// ==========================================
// TECH STACK ITEM
// ==========================================
export const TechSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().optional().or(z.literal('')),
  logo: z.string().optional().or(z.literal('')),
  order: z.number().default(0),
});
export type TechInput = z.infer<typeof TechSchema>;

// ==========================================
// TESTIMONIAL
// ==========================================
export const TestimonialSchema = z.object({
  author: z.string().min(1, 'Author is required'),
  role: z.string().min(1, 'Role is required'),
  company: z.string().optional(),
  avatar: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  rating: z.number().min(1).max(5).default(5),
  order: z.number().default(0),
  published: z.boolean().default(true),
});
export type TestimonialInput = z.infer<typeof TestimonialSchema>;

// ==========================================
// REVIEW
// ==========================================
export const ReviewSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').trim(),
  email: z.string().email('Valid email is required').max(254, 'Email is too long').trim(),
  designation: z.string().max(100, 'Designation is too long').trim().optional().or(z.literal('')),
  review: z.string().min(10, 'Review must be at least 10 characters').max(2000, 'Review is too long').trim(),
  image: z.string().optional().or(z.literal('')),
});
export type ReviewInput = z.infer<typeof ReviewSchema>;

export const ReviewAdminSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  email: z.string().email().max(254).trim().optional().or(z.literal('')),
  designation: z.string().max(100).trim().optional().or(z.literal('')),
  review: z.string().min(10).max(2000).trim(),
  image: z.string().optional().or(z.literal('')),
  status: z.enum(['pending', 'approved', 'rejected']),
});
export type ReviewAdminInput = z.infer<typeof ReviewAdminSchema>;

// ==========================================
// SITE SETTINGS
// ==========================================
export const SiteSettingsSchema = z.object({
  name: z.string().default(''),
  title: z.string().default(''),
  email: z.string().email().or(z.literal('')).default(''),
  phone: z.string().optional(),
  location: z.string().optional(),
  availability: z.string().default('available'),
  resumeUrl: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  ogImageUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  aboutPortrait: z.string().optional().or(z.literal('')),
});
export type SiteSettingsInput = z.infer<typeof SiteSettingsSchema>;

// ==========================================
// SOCIAL LINK
// ==========================================
export const SocialLinkSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  url: z.string().url('Must be a valid URL'),
  order: z.number().default(0),
  visible: z.boolean().default(true),
});
export type SocialLinkInput = z.infer<typeof SocialLinkSchema>;

// ==========================================
// REORDER
// ==========================================
export const ReorderSchema = z.object({
  ids: z.array(z.string()).min(1),
});
export type ReorderInput = z.infer<typeof ReorderSchema>;
