export interface SanitizedLink {
  label: string;
  href: string;
}

export interface SanitizedResource {
  type: string;
  label: string;
  value: string;
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

/**
 * Build the unified resource list for a case study.
 * Merges new `resources` array with legacy dedicated URL fields and `additionalLinks`.
 * New resources take priority; legacy fields are appended if not already covered.
 */
export function buildCaseStudyResources(input: {
  liveUrl?: string | null;
  githubUrl?: string;
  repository?: string;
  documentationUrl?: string;
  figmaUrl?: string;
  casePdfUrl?: string;
  videoUrl?: string;
  demoCredentials?: string;
  clientWebsite?: string;
  additionalLinks?: Array<{ label?: string | null; url?: string | null } | null | undefined>;
  resources?: Array<{ type?: string | null; label?: string | null; value?: string | null } | null | undefined>;
}): SanitizedResource[] {
  const result: SanitizedResource[] = [];

  // New-format resources first
  if (Array.isArray(input.resources)) {
    for (const r of input.resources) {
      if (!r || typeof r !== 'object') continue;
      const type = cleanString(r.type) || 'link';
      const label = cleanString(r.label);
      const value = cleanString(r.value);
      if (label && value) {
        result.push({ type, label, value });
      }
    }
  }

  // If new resources exist, skip legacy fields (new system fully replaces old)
  if (result.length > 0) return result;

  // Legacy fallback: build from dedicated URL fields + additionalLinks
  const legacyMap: Array<{ type: string; label: string; value: string } | null> = [
    isNonEmptyString(input.liveUrl) ? { type: 'link', label: 'Live Demo', value: input.liveUrl!.trim() } : null,
    isNonEmptyString(input.clientWebsite) ? { type: 'link', label: 'Client Website', value: input.clientWebsite!.trim() } : null,
    isNonEmptyString(input.githubUrl) ? { type: 'github', label: 'GitHub Repository', value: input.githubUrl!.trim() } : null,
    isNonEmptyString(input.repository) ? { type: 'link', label: 'Repository', value: input.repository!.trim() } : null,
    isNonEmptyString(input.documentationUrl) ? { type: 'link', label: 'Documentation', value: input.documentationUrl!.trim() } : null,
    isNonEmptyString(input.figmaUrl) ? { type: 'figma', label: 'Figma Design System', value: input.figmaUrl!.trim() } : null,
    isNonEmptyString(input.casePdfUrl) ? { type: 'pdf', label: 'Case Study PDF', value: input.casePdfUrl!.trim() } : null,
    isNonEmptyString(input.videoUrl) ? { type: 'video', label: 'Demo Video', value: input.videoUrl!.trim() } : null,
  ];

  for (const item of legacyMap) {
    if (item) result.push(item);
  }

  if (Array.isArray(input.additionalLinks)) {
    for (const link of input.additionalLinks) {
      if (!link || typeof link !== 'object') continue;
      const label = cleanString(link.label);
      const value = cleanString(link.url);
      if (label && value) {
        result.push({ type: 'link', label, value });
      }
    }
  }

  return result;
}
