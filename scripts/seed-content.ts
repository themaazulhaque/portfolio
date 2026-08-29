/**
 * Content Seed Script
 * Run: npx tsx scripts/seed-content.ts
 *
 * Seeds the public portfolio content from the original static data so the CMS
 * becomes the single source of truth. Idempotent: each collection is only
 * seeded when empty, so admin edits are never overwritten on re-run.
 *
 * To replace existing content with the canonical seed data (drops only the
 * CMS-backed collections below), run: npx tsx scripts/seed-content.ts --force
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import { PROJECTS } from '../data/projects';

const FORCE = process.argv.includes('--force');
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

const ProcessStepSchema = new mongoose.Schema({ step: String, title: String, desc: String }, { _id: false });
const ResultSchema = new mongoose.Schema({ metric: String, label: String }, { _id: false });
const AdditionalLinkSchema = new mongoose.Schema({ label: String, url: String }, { _id: false });

const ProjectSchema = new mongoose.Schema(
  {
    num: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    cat: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    desc: { type: String, default: '' },
    image: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    thumbnailImage: { type: String },
    logoImage: { type: String },
    featureBanner: { type: String },
    client: { type: String, default: '' },
    clientWebsite: { type: String },
    year: { type: String, default: '' },
    role: { type: String, default: '' },
    stack: { type: String, default: '' },
    techStack: { type: [String], default: [] },
    liveUrl: { type: String, default: null },
    githubUrl: { type: String },
    repository: { type: String },
    documentationUrl: { type: String },
    figmaUrl: { type: String },
    casePdfUrl: { type: String },
    videoUrl: { type: String },
    demoCredentials: { type: String },
    overview: { type: [String], default: [] },
    challenge: { type: [String], default: [] },
    solution: { type: [String], default: [] },
    process: { type: [ProcessStepSchema], default: [] },
    gallery: { type: [String], default: [] },
    results: { type: [ResultSchema], default: [] },
    additionalLinks: { type: [AdditionalLinkSchema], default: [] },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ExperienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    period: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String },
    current: { type: Boolean, default: false },
    description: { type: String, default: '' },
    tech: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const TechSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: '' },
    logo: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    proficiency: { type: Number, default: 100 },
    icon: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SiteSettingsSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    title: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String },
    location: { type: String },
    availability: { type: String, default: 'available' },
    resumeUrl: { type: String },
    seoTitle: { type: String },
    seoDescription: { type: String },
    ogImageUrl: { type: String },
    faviconUrl: { type: String },
    aboutPortrait: { type: String, default: '' },
  },
  { timestamps: true }
);

const SocialLinkSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const EXPERIENCES = [
  {
    company: 'Independent · Placeholder studio',
    role: 'Senior Software Engineer',
    period: '2023 — Present',
    startDate: '2023',
    endDate: undefined,
    current: true,
    description: 'Leading AI product build-outs end to end — design, architecture, delivery.',
    tech: ['Next.js', 'TypeScript', 'Python', 'FastAPI', 'MongoDB'],
  },
  {
    company: 'Product company · Placeholder',
    role: 'AI Engineer',
    period: '2021 — 2023',
    startDate: '2021',
    endDate: '2023',
    current: false,
    description: 'Shipped intelligent features into production. Latency, safety, and UX, in that order.',
    tech: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Redis'],
  },
  {
    company: 'Agency · Placeholder',
    role: 'Full Stack Developer',
    period: '2019 — 2021',
    startDate: '2019',
    endDate: '2021',
    current: false,
    description: 'Built web platforms for clients across three continents. Django to Next.js.',
    tech: ['Django', 'React', 'PostgreSQL'],
  },
  {
    company: 'Studio · Placeholder',
    role: 'Web Developer',
    period: '2017 — 2019',
    startDate: '2017',
    endDate: '2019',
    current: false,
    description: 'Learned the craft at the pixel level. Design systems before they were called that.',
    tech: ['JavaScript', 'HTML', 'CSS'],
  },
];

const SERVICES = [
  { title: 'Web Applications', description: 'Full-stack platforms built to ship, scale, and stay quiet. React, Next.js, and Node on the front; clean services behind.', icon: 'Full-stack platforms' },
  { title: 'AI Products', description: 'Intelligence integrated where it compounds — not bolted on. RAG, agents, and evaluation built into the product flow.', icon: 'Intelligence, integrated' },
  { title: 'UI Engineering', description: 'Interfaces engineered to the pixel and to the motion — design systems, scroll storytelling, and buttery states.', icon: 'Pixel to motion' },
  { title: 'Backend Systems', description: 'Services designed for latency, clarity, and long life. Django, FastAPI, and PostgreSQL at the core.', icon: 'Quiet foundations' },
  { title: 'Automation', description: 'Workflows that run themselves. Pipelines, integrations, and tooling that remove the busywork.', icon: 'Workflows that run' },
  { title: 'API Development', description: 'Contracts that stay quiet until called. Clean, documented, versioned, and fast.', icon: 'Contracts that hold' },
];

const TECH = [
  { name: 'React', category: 'UI library', logo: '/logos/react.svg' },
  { name: 'Next.js', category: 'Framework', logo: '/logos/nextjs.svg' },
  { name: 'TypeScript', category: 'Language', logo: '/logos/typescript.svg' },
  { name: 'Node.js', category: 'Runtime', logo: '/logos/nodejs.svg' },
  { name: 'Python', category: 'Language', logo: '/logos/python.svg' },
  { name: 'Django', category: 'Framework', logo: '/logos/django.svg' },
  { name: 'FastAPI', category: 'API framework', logo: '/logos/fastapi.svg' },
  { name: 'Docker', category: 'Containers', logo: '/logos/docker.svg' },
  { name: 'MongoDB', category: 'Database', logo: '/logos/mongodb.svg' },
  { name: 'PostgreSQL', category: 'Database', logo: '/logos/postgresql.svg' },
  { name: 'Git', category: 'Version control', logo: '/logos/git.svg' },
  { name: 'GitHub', category: 'Collaboration', logo: '/logos/github.svg' },
];

const SKILLS = [
  { name: 'TypeScript', category: 'Languages', proficiency: 95 },
  { name: 'Python', category: 'Languages', proficiency: 90 },
  { name: 'React / Next.js', category: 'Frontend', proficiency: 95 },
  { name: 'Tailwind CSS', category: 'Frontend', proficiency: 92 },
  { name: 'Node.js', category: 'Backend', proficiency: 90 },
  { name: 'FastAPI / Django', category: 'Backend', proficiency: 88 },
  { name: 'MongoDB / PostgreSQL', category: 'Databases', proficiency: 87 },
  { name: 'Docker', category: 'DevOps', proficiency: 80 },
];

const SETTINGS = {
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
};

const SOCIAL_LINKS = [
  { platform: 'GitHub', url: 'https://github.com/maazul', order: 0, visible: true },
  { platform: 'LinkedIn', url: 'https://linkedin.com/in/maazul', order: 1, visible: true },
];

async function seedIfEmpty(Model: mongoose.Model<Record<string, unknown>>, docs: Record<string, unknown>[], label: string) {
  const count = await Model.estimatedDocumentCount();
  if (count > 0 && !FORCE) {
    console.log(`• ${label}: skipped (${count} existing — use --force to reset)`);
    return;
  }
  if (FORCE && count > 0) {
    await Model.deleteMany({});
    console.log(`• ${label}: cleared ${count} existing`);
  }
  await Model.insertMany(docs);
  console.log(`✓ ${label}: seeded ${docs.length} items`);
}

async function seed() {
  await mongoose.connect(MONGODB_URI as string);

  const Project = mongoose.models['Project'] ?? mongoose.model('Project', ProjectSchema);
  const Experience = mongoose.models['Experience'] ?? mongoose.model('Experience', ExperienceSchema);
  const Tech = mongoose.models['Tech'] ?? mongoose.model('Tech', TechSchema);
  const Service = mongoose.models['Service'] ?? mongoose.model('Service', ServiceSchema);
  const Skill = mongoose.models['Skill'] ?? mongoose.model('Skill', SkillSchema);
  const SiteSettings = mongoose.models['SiteSettings'] ?? mongoose.model('SiteSettings', SiteSettingsSchema);
  const SocialLink = mongoose.models['SocialLink'] ?? mongoose.model('SocialLink', SocialLinkSchema);

  await seedIfEmpty(
    Project,
    PROJECTS.map((p, i) => ({ ...p, published: true, order: i })),
    'Projects'
  );

  await seedIfEmpty(
    Experience,
    EXPERIENCES.map((e, i) => ({ ...e, order: i })),
    'Experience'
  );

  await seedIfEmpty(
    Tech,
    TECH.map((t, i) => ({ ...t, order: i })),
    'Tech stack'
  );

  await seedIfEmpty(
    Service,
    SERVICES.map((s, i) => ({ ...s, order: i })),
    'Services'
  );

  await seedIfEmpty(
    Skill,
    SKILLS.map((s, i) => ({ ...s, order: i })),
    'Skills'
  );

  const settingsCount = await SiteSettings.estimatedDocumentCount();
  if (settingsCount === 0 || FORCE) {
    if (FORCE && settingsCount > 0) {
      await SiteSettings.deleteMany({});
      console.log(`• Settings: cleared ${settingsCount} existing`);
    }
    await SiteSettings.create(SETTINGS);
    console.log('✓ Settings: seeded');
  } else {
    console.log(`• Settings: skipped (${settingsCount} existing — use --force to reset)`);
  }

  await seedIfEmpty(SocialLink, SOCIAL_LINKS, 'Social links');

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
