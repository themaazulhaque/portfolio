export interface SanitizedLink {
  label: string;
  href: string;
}

export interface SanitizedResult {
  metric: string;
  label: string;
}

export interface SanitizedProcessStep {
  step: string;
  title: string;
  desc: string;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function cleanString(value: unknown): string {
  return isNonEmptyString(value) ? value.trim() : '';
}

export function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(isNonEmptyString);
}

export function cleanResults(value: unknown): SanitizedResult[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item === null || item === undefined || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      const metric = cleanString(obj.metric);
      const label = cleanString(obj.label);
      return metric && label ? { metric, label } : null;
    })
    .filter((item): item is SanitizedResult => item !== null);
}

export function cleanProcess(value: unknown): SanitizedProcessStep[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item === null || item === undefined || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      const step = cleanString(obj.step);
      const title = cleanString(obj.title);
      const desc = cleanString(obj.desc);
      return step && title && desc ? { step, title, desc } : null;
    })
    .filter((item): item is SanitizedProcessStep => item !== null);
}

export function cleanLinks(value: unknown): SanitizedLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item === null || item === undefined || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      const label = cleanString(obj.label);
      const href = cleanString(obj.href ?? obj.url);
      return label && href ? { label, href } : null;
    })
    .filter((item): item is SanitizedLink => item !== null);
}

export function compactLinks(items: Array<SanitizedLink | null | undefined>): SanitizedLink[] {
  return items.filter((item): item is SanitizedLink => item !== null && item !== undefined);
}

/**
 * Returns a safe copy of an unknown value as a string array.
 * Handles null, undefined, non-array values gracefully.
 */
export function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

/**
 * Returns a safe copy of an unknown value as an object array.
 * Handles null, undefined, non-array values gracefully.
 */
export function safeObjectArray<T>(value: unknown, validate: (item: unknown) => item is T): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter(validate);
}

export function buildCaseStudyLinks(input: {
  liveUrl?: string | null;
  githubUrl?: string;
  repository?: string;
  documentationUrl?: string;
  figmaUrl?: string;
  casePdfUrl?: string;
  additionalLinks?: Array<{ label?: string | null; url?: string | null } | null | undefined>;
}): SanitizedLink[] {
  return compactLinks([
    isNonEmptyString(input.liveUrl) ? { label: 'Live Demo', href: input.liveUrl.trim() } : null,
    isNonEmptyString(input.githubUrl) ? { label: 'GitHub Repository', href: input.githubUrl.trim() } : null,
    isNonEmptyString(input.repository) ? { label: 'Repository', href: input.repository.trim() } : null,
    isNonEmptyString(input.documentationUrl)
      ? { label: 'Documentation', href: input.documentationUrl.trim() }
      : null,
    isNonEmptyString(input.figmaUrl) ? { label: 'Figma Design System', href: input.figmaUrl.trim() } : null,
    isNonEmptyString(input.casePdfUrl) ? { label: 'Case Study PDF', href: input.casePdfUrl.trim() } : null,
    ...(input.additionalLinks ?? [])
      .map((link) => {
        const label = cleanString(link?.label);
        const href = cleanString(link?.url);
        return label && href ? { label, href } : null;
      })
      .filter((link): link is SanitizedLink => link !== null),
  ]);
}
