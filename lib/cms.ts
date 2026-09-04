import 'server-only';
import { cache } from 'react';
import { connectDB } from './db';
import {
  Project,
  Experience,
  Service,
  Skill,
  Tech,
  SiteSettings,
  SocialLink,
  Review,
} from './models';
import {
  cleanLinks,
  cleanProcess,
  cleanResults,
  cleanStringArray,
  cleanString,
  isNonEmptyString,
} from './sanitize';
import type {
  PublicExperience,
  PublicProject,
  PublicService,
  PublicSettings,
  PublicSkill,
  PublicSocialLink,
  PublicTech,
  PublicReview,
} from './types';

export const DEFAULT_SETTINGS: PublicSettings = {
  name: 'Maazul Haque',
  title: 'Software Engineer',
  email: 'hello@maazul.dev',
  phone: '',
  location: 'Dhaka · Worldwide',
  availability: 'available',
  resumeUrl: '',
  seoTitle: '',
  seoDescription: '',
  ogImageUrl: '',
  faviconUrl: '',
  aboutPortrait: '',
  testimonialVideo: '',
};

function padNum(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  try {
    await connectDB();
    const s = await SiteSettings.findOne().lean();
    if (!s) return DEFAULT_SETTINGS;
    const plain = JSON.parse(JSON.stringify(s)) as Partial<PublicSettings>;
    return { ...DEFAULT_SETTINGS, ...plain };
  } catch {
    return DEFAULT_SETTINGS;
  }
});

export const getPublicSocialLinks = cache(async (): Promise<PublicSocialLink[]> => {
  try {
    await connectDB();
    const items = await SocialLink.find({ visible: true }).sort({ order: 1 }).lean();
    return JSON.parse(JSON.stringify(items)) as PublicSocialLink[];
  } catch {
    return [];
  }
});

export const getPublicProjects = cache(async (): Promise<PublicProject[]> => {
  try {
    await connectDB();
    const items = await Project.find({ published: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return items.map((doc, i) => {
      const plain = JSON.parse(JSON.stringify(doc)) as Record<string, unknown> & Partial<PublicProject>;
      return {
        _id: String(plain._id ?? ''),
        num: padNum(i),
        slug: String(plain.slug ?? ''),
        cat: String(plain.cat ?? ''),
        title: String(plain.title ?? ''),
        subtitle: String(plain.subtitle ?? ''),
        desc: String(plain.desc ?? ''),
        image: String(plain.image ?? ''),
        coverImage: String(plain.coverImage || plain.image || ''),
        thumbnailImage: isNonEmptyString(plain.thumbnailImage) ? String(plain.thumbnailImage) : undefined,
        logoImage: isNonEmptyString(plain.logoImage) ? String(plain.logoImage) : undefined,
        featureBanner: isNonEmptyString(plain.featureBanner) ? String(plain.featureBanner) : undefined,
        client: String(plain.client ?? ''),
        clientWebsite: isNonEmptyString(plain.clientWebsite) ? String(plain.clientWebsite) : undefined,
        year: String(plain.year ?? ''),
        role: String(plain.role ?? ''),
        stack: String(plain.stack ?? ''),
        techStack: Array.isArray(plain.techStack) ? plain.techStack.map((t) => cleanString(t)).filter(Boolean) : [],
        liveUrl: isNonEmptyString(plain.liveUrl) ? String(plain.liveUrl).trim() : null,
        githubUrl: isNonEmptyString(plain.githubUrl) ? String(plain.githubUrl).trim() : undefined,
        repository: isNonEmptyString(plain.repository) ? String(plain.repository).trim() : undefined,
        documentationUrl: isNonEmptyString(plain.documentationUrl) ? String(plain.documentationUrl).trim() : undefined,
        figmaUrl: isNonEmptyString(plain.figmaUrl) ? String(plain.figmaUrl).trim() : undefined,
        casePdfUrl: isNonEmptyString(plain.casePdfUrl) ? String(plain.casePdfUrl).trim() : undefined,
        videoUrl: isNonEmptyString(plain.videoUrl) ? String(plain.videoUrl).trim() : undefined,
        demoCredentials: isNonEmptyString(plain.demoCredentials) ? String(plain.demoCredentials).trim() : undefined,
        overview: cleanStringArray(plain.overview),
        challenge: cleanStringArray(plain.challenge),
        solution: cleanStringArray(plain.solution),
        process: cleanProcess(plain.process),
        gallery: cleanStringArray(plain.gallery),
        results: cleanResults(plain.results),
        additionalLinks: cleanLinks(plain.additionalLinks),
        featured: plain.featured === true,
        published: plain.published !== false,
      };
    });
  } catch {
    return [];
  }
});

export const getPublicProjectBySlug = cache(async (slug: string): Promise<PublicProject | null> => {
  const all = await getPublicProjects();
  return all.find((p) => p.slug === slug) ?? null;
});

export const getPublicProjectContext = cache(async (slug: string): Promise<{
  project: PublicProject | null;
  prev: PublicProject | null;
  next: PublicProject | null;
}> => {
  const all = await getPublicProjects();
  const idx = all.findIndex((p) => p.slug === slug);

  if (idx === -1) {
    return {
      project: null,
      prev: all.length > 1 ? all[all.length - 1] : null,
      next: all.length > 1 ? all[0] : null,
    };
  }

  const project = all[idx] ?? null;
  const others = all.filter((_, index) => index !== idx);
  if (others.length === 0) {
    return { project, prev: null, next: null };
  }

  if (others.length === 1) {
    return { project, prev: others[0] ?? null, next: null };
  }

  const prev = idx <= 0 ? others[others.length - 1] : all[idx - 1];
  const next = idx === all.length - 1 ? others[0] : all[idx + 1];

  return {
    project,
    prev: prev ?? null,
    next: next ?? null,
  };
});

export const getPublicAdjacentProjects = cache(
  async (slug: string): Promise<{ prev: PublicProject | null; next: PublicProject | null }> => {
    const { prev, next } = await getPublicProjectContext(slug);
    return { prev, next };
  }
);

/**
 * Maps a raw Mongoose Experience document (from JSON serialization) to the
 * public-facing PublicExperience shape. Handles date derivation safely.
 *
 * DB field → Public field:
 *   _id        → _id       (stringified)
 *   (none)     → index     (zero-padded position)
 *   startDate  → year      (first 4 chars)
 *   (none)     → periodEnd (formatted end-period string)
 *   role       → role      (direct)
 *   company    → co        (renamed)
 *   description→ desc      (renamed)
 *   tech       → tech      (direct)
 */
function mapExperienceToPublic(
  doc: Record<string, unknown>,
  position: number
): PublicExperience {
  const startDate = String(doc.startDate ?? '');
  const year = startDate.slice(0, 4) || '';
  const current = doc.current === true;
  const endDate = doc.endDate ? String(doc.endDate) : '';
  const period = doc.period ? String(doc.period) : '';
  const periodEnd = current
    ? '— Present'
    : endDate
      ? `— ${endDate}`
      : period
        ? `— ${period}`
        : '';

  return {
    _id: String(doc._id ?? ''),
    index: padNum(position),
    year,
    periodEnd,
    role: String(doc.role ?? ''),
    co: String(doc.company ?? ''),
    desc: String(doc.description ?? ''),
    tech: Array.isArray(doc.tech) ? doc.tech.map(String) : [],
  };
}

export const getPublicExperiences = cache(async (): Promise<PublicExperience[]> => {
  try {
    await connectDB();
    const items = await Experience.find().sort({ order: 1, createdAt: -1 }).lean();
    return items.map((doc, i) => {
      const plain = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
      return mapExperienceToPublic(plain, i);
    });
  } catch {
    return [];
  }
});

/**
 * Maps a raw Mongoose Service document (from JSON serialization) to the
 * public-facing PublicService shape.
 *
 * DB field → Public field:
 *   _id         → _id    (stringified)
 *   (none)      → index  (zero-padded position)
 *   icon        → tag    (renamed: the short tagline/label)
 *   title       → title  (direct)
 *   description → desc   (renamed for brevity)
 */
function mapServiceToPublic(
  doc: Record<string, unknown>,
  position: number
): PublicService {
  return {
    _id: String(doc._id ?? ''),
    index: padNum(position),
    tag: String(doc.icon ?? ''),
    title: String(doc.title ?? ''),
    desc: String(doc.description ?? ''),
  };
}

export const getPublicServices = cache(async (): Promise<PublicService[]> => {
  try {
    await connectDB();
    const items = await Service.find().sort({ order: 1 }).lean();
    return items.map((doc, i) => {
      const plain = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
      return mapServiceToPublic(plain, i);
    });
  } catch {
    return [];
  }
});

export const getPublicTech = cache(async (): Promise<PublicTech[]> => {
  try {
    await connectDB();
    const items = await Tech.find().sort({ order: 1 }).lean();
    return items.map((doc) => {
      const plain = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
      return {
        _id: String(plain._id ?? ''),
        name: String(plain.name ?? ''),
        cat: String(plain.category ?? ''),
        logo: typeof plain.logo === 'string' && plain.logo ? plain.logo : '',
      };
    });
  } catch {
    return [];
  }
});

/**
 * Maps a raw Mongoose Skill document (from JSON serialization) to the
 * public-facing PublicSkill shape.
 *
 * DB field → Public field:
 *   _id         → _id         (stringified)
 *   name        → name        (direct)
 *   category    → category    (direct)
 *   proficiency → proficiency (direct)
 *   icon        → icon        (direct, defaults to '')
 *   order       → order       (direct)
 */
function mapSkillToPublic(doc: Record<string, unknown>): PublicSkill {
  return {
    _id: String(doc._id ?? ''),
    name: String(doc.name ?? ''),
    category: String(doc.category ?? ''),
    proficiency: typeof doc.proficiency === 'number' ? doc.proficiency : 100,
    icon: String(doc.icon ?? ''),
    order: typeof doc.order === 'number' ? doc.order : 0,
  };
}

export const getPublicSkills = cache(async (): Promise<PublicSkill[]> => {
  try {
    await connectDB();
    const items = await Skill.find().sort({ category: 1, order: 1 }).lean();
    return items.map((doc) => {
      const plain = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
      return mapSkillToPublic(plain);
    });
  } catch {
    return [];
  }
});

export const getPublicReviews = cache(async (): Promise<PublicReview[]> => {
  try {
    await connectDB();
    const items = await Review.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .lean();
    return items.map((doc) => {
      const plain = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
      return {
        _id: String(plain._id ?? ''),
        name: String(plain.name ?? ''),
        designation: isNonEmptyString(plain.designation) ? String(plain.designation) : '',
        review: String(plain.review ?? ''),
        image: isNonEmptyString(plain.image) ? String(plain.image) : '',
        createdAt: String(plain.createdAt ?? ''),
      };
    });
  } catch {
    return [];
  }
});
