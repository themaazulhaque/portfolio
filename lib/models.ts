import mongoose, { Schema, Model } from 'mongoose';

// ==========================================
// ADMIN
// ==========================================
export interface IAdmin {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

// ==========================================
// PROJECT
// ==========================================
export interface IProject {
  _id: mongoose.Types.ObjectId;
  num: string;
  slug: string;
  cat: string;
  title: string;
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
  techStack: string[];
  liveUrl?: string | null;
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
  published: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProcessStepSchema = new Schema({ step: String, title: String, desc: String }, { _id: false });
const ResultSchema = new Schema({ metric: String, label: String }, { _id: false });
const AdditionalLinkSchema = new Schema({ label: String, url: String }, { _id: false });

const ProjectSchema = new Schema<IProject>(
  {
    num: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    cat: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    desc: { type: String, default: '' },
    image: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    thumbnailImage: { type: String },
    logoImage: { type: String },
    featureBanner: { type: String },
    mobileScreenshot: { type: String },
    desktopScreenshot: { type: String },
    tabletScreenshot: { type: String },
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

// ==========================================
// EXPERIENCE
// ==========================================
export interface IExperience {
  _id: mongoose.Types.ObjectId;
  company: string;
  role: string;
  period: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  tech: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExperienceSchema = new Schema<IExperience>(
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

// ==========================================
// TECH STACK ITEM
// ==========================================
export interface ITech {
  _id: mongoose.Types.ObjectId;
  name: string;
  category: string;
  logo: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const TechSchema = new Schema<ITech>(
  {
    name: { type: String, required: true },
    category: { type: String, default: '' },
    logo: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ==========================================
// SKILL
// ==========================================
export interface ISkill {
  _id: mongoose.Types.ObjectId;
  name: string;
  category: string;
  proficiency: number;
  icon?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    proficiency: { type: Number, default: 100, min: 0, max: 100 },
    icon: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ==========================================
// SERVICE
// ==========================================
export interface IService {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  icon?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ==========================================
// MEDIA
// ==========================================
export interface IMedia {
  _id: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt?: string;
  type: 'image' | 'video' | 'document';
  usedIn?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    type: { type: String, enum: ['image', 'video', 'document'], required: true },
    usedIn: { type: [String], default: [] },
  },
  { timestamps: true }
);

// ==========================================
// CONTACT MESSAGE
// ==========================================
export interface IContactMessage {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  subject?: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ==========================================
// SITE SETTINGS
// ==========================================
export interface ISiteSettings {
  _id: mongoose.Types.ObjectId;
  name: string;
  title: string;
  email: string;
  phone?: string;
  location?: string;
  availability: string;
  resumeUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  faviconUrl?: string;
  aboutPortrait?: string;
  testimonialVideo?: string;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
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
    testimonialVideo: { type: String, default: '' },
  },
  { timestamps: true }
);

// ==========================================
// SOCIAL LINKS
// ==========================================
export interface ISocialLink {
  _id: mongoose.Types.ObjectId;
  platform: string;
  url: string;
  order: number;
  visible: boolean;
  updatedAt: Date;
}

const SocialLinkSchema = new Schema<ISocialLink>(
  {
    platform: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ==========================================
// AUDIT LOG
// ==========================================
export interface IAuditLog {
  _id: mongoose.Types.ObjectId;
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ip?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: String, required: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: String },
    ip: { type: String },
  },
  { timestamps: true }
);

// ==========================================
// TESTIMONIAL
// ==========================================
export interface ITestimonial {
  _id: mongoose.Types.ObjectId;
  author: string;
  role: string;
  company?: string;
  avatar?: string;
  content: string;
  rating: number;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    author: { type: String, required: true },
    role: { type: String, required: true },
    company: { type: String },
    avatar: { type: String },
    content: { type: String, required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ==========================================
// REVIEW
// ==========================================
export interface IReview {
  _id: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  designation?: string;
  review: string;
  image?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true },
    designation: { type: String, default: '', trim: true },
    review: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedAt: { type: Date },
    approvedBy: { type: String },
  },
  { timestamps: true }
);

// ==========================================
// MODEL FACTORIES (prevent re-registration)
// ==========================================
function model<T>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] ?? mongoose.model<T>(name, schema)) as Model<T>;
}

export const Admin = model<IAdmin>('Admin', AdminSchema);
export const Project = model<IProject>('Project', ProjectSchema);
export const Experience = model<IExperience>('Experience', ExperienceSchema);
export const Skill = model<ISkill>('Skill', SkillSchema);
export const Service = model<IService>('Service', ServiceSchema);
export const Tech = model<ITech>('Tech', TechSchema);
export const Media = model<IMedia>('Media', MediaSchema);
export const ContactMessage = model<IContactMessage>('ContactMessage', ContactMessageSchema);
export const SiteSettings = model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
export const SocialLink = model<ISocialLink>('SocialLink', SocialLinkSchema);
export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
export const Testimonial = model<ITestimonial>('Testimonial', TestimonialSchema);
export const Review = model<IReview>('Review', ReviewSchema);

// ==========================================
// PUSH SUBSCRIPTION
// ==========================================
export interface IPushSubscription {
  _id: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export const PushSubscription = model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
