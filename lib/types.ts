/**
 * Shared public content types used by the portfolio (server and client).
 * No server-only imports here so client components can use `import type`.
 */

// ==========================================
// AVAILABILITY
// ==========================================
/** Known availability states used by the settings form and public UI. */
export type Availability = 'available' | 'limited' | 'unavailable';

// ==========================================
// PUBLIC PROJECT
// ==========================================
export interface PublicProject {
  _id: string;
  num: string;
  slug: string;
  cat: string;
  title: string;
  subtitle: string;
  desc: string;
  image: string;
  coverImage: string;
  thumbnailImage?: string;
  logoImage?: string;
  featureBanner?: string;
  client: string;
  clientWebsite?: string;
  year: string;
  role: string;
  stack: string;
  techStack: string[];
  liveUrl: string | null;
  githubUrl?: string;
  repository?: string;
  documentationUrl?: string;
  figmaUrl?: string;
  casePdfUrl?: string;
  videoUrl?: string;
  demoCredentials?: string;
  overview: string[];
  challenge: string[];
  solution: string[];
  process: { step: string; title: string; desc: string }[];
  gallery: string[];
  results: { metric: string; label: string }[];
  additionalLinks?: { label: string; url: string }[];
  featured: boolean;
}

// ==========================================
// PUBLIC EXPERIENCE
// ==========================================
/**
 * Public experience as consumed by the portfolio frontend.
 *
 * Field mapping from DB (IExperience) → Public:
 *   _id      → _id       (string)
 *   (none)   → index     (synthetic: zero-padded position, e.g. "01")
 *   (none)   → year      (derived: first 4 chars of startDate)
 *   (none)   → periodEnd (derived: formatted end-period string)
 *   role     → role      (direct)
 *   company  → co        (renamed for brevity)
 *   desc     → desc      (from description)
 *   tech     → tech      (direct)
 */
export interface PublicExperience {
  _id: string;
  index: string;
  year: string;
  periodEnd: string;
  role: string;
  co: string;
  desc: string;
  tech: string[];
}

// ==========================================
// PUBLIC SERVICE
// ==========================================
/**
 * Public service as consumed by the portfolio frontend.
 *
 * Field mapping from DB (IService) → Public:
 *   _id         → _id    (string)
 *   (none)      → index  (synthetic: zero-padded position)
 *   icon        → tag    (renamed: the short tagline/label)
 *   title       → title  (direct)
 *   description → desc   (renamed for brevity)
 */
export interface PublicService {
  _id: string;
  index: string;
  tag: string;
  title: string;
  desc: string;
}

// ==========================================
// PUBLIC SKILL
// ==========================================
/**
 * Public skill as consumed by the portfolio frontend.
 *
 * Field mapping from DB (ISkill) → Public:
 *   _id         → _id         (string)
 *   name        → name        (direct)
 *   category    → category    (direct)
 *   proficiency → proficiency (direct)
 *   icon        → icon        (direct, optional)
 *   order       → order       (direct)
 */
export interface PublicSkill {
  _id: string;
  name: string;
  category: string;
  proficiency: number;
  icon: string;
  order: number;
}

// ==========================================
// PUBLIC TECH
// ==========================================
export interface PublicTech {
  _id: string;
  name: string;
  cat: string;
  logo: string;
}

// ==========================================
// PUBLIC SOCIAL LINK
// ==========================================
export interface PublicSocialLink {
  _id: string;
  platform: string;
  url: string;
  visible: boolean;
}

// ==========================================
// PUBLIC SETTINGS
// ==========================================
export interface PublicSettings {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  availability: Availability;
  resumeUrl: string;
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  faviconUrl: string;
  aboutPortrait: string;
  testimonialVideo: string;
}

// ==========================================
// PUBLIC REVIEW
// ==========================================
export interface PublicReview {
  _id: string;
  name: string;
  designation: string;
  review: string;
  image: string;
  createdAt: string;
}

// ==========================================
// ADMIN TYPES (serializable, for client components)
// ==========================================

/**
 * Serializable project shape for admin forms.
 * All fields are optional because the form populates defaults from existing data.
 * Does NOT import Mongoose types — safe for client components.
 */
export interface AdminProject {
  _id?: string;
  slug?: string;
  cat?: string;
  title?: string;
  subtitle?: string;
  desc?: string;
  image?: string;
  coverImage?: string;
  thumbnailImage?: string;
  logoImage?: string;
  featureBanner?: string;
  mobileScreenshot?: string;
  desktopScreenshot?: string;
  tabletScreenshot?: string;
  client?: string;
  clientWebsite?: string;
  year?: string;
  role?: string;
  stack?: string;
  techStack?: string[];
  liveUrl?: string | null;
  githubUrl?: string;
  repository?: string;
  documentationUrl?: string;
  figmaUrl?: string;
  casePdfUrl?: string;
  videoUrl?: string;
  demoCredentials?: string;
  overview?: string[];
  challenge?: string[];
  solution?: string[];
  process?: { step: string; title: string; desc: string }[];
  gallery?: string[];
  results?: { metric: string; label: string }[];
  additionalLinks?: { label: string; url: string }[];
  featured?: boolean;
  published?: boolean;
  order?: number;
}

/**
 * Serializable experience shape for admin table and forms.
 * Matches the raw Mongoose document after JSON serialization.
 */
export interface AdminExperience {
  _id: string;
  company: string;
  role: string;
  period: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  tech: string[];
  order: number;
}

// ==========================================
// HELPERS
// ==========================================
export function availabilityLabel(availability: Availability | string): string {
  switch (availability) {
    case 'limited':
      return 'Limited availability';
    case 'unavailable':
      return 'Not available';
    default:
      return 'Available worldwide';
  }
}
