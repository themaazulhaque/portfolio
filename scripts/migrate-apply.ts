/**
 * Phase 2: Apply Cloudinary URL mapping to MongoDB.
 * Run locally: npx tsx scripts/migrate-apply.ts
 *
 * Reads scripts/cloudinary-mapping.json (from Phase 1).
 * Reads .env.local for MONGODB_URI.
 * Updates MongoDB documents in-place.
 */

import mongoose from 'mongoose';
import { readFile } from 'fs/promises';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = require('fs').readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.substring(0, eq).trim();
  const val = trimmed.substring(eq + 1).trim();
  if (val && !process.env[key]) process.env[key] = val;
}

const MONGODB_URI = process.env.MONGODB_URI;
const MAPPING_FILE = path.join(process.cwd(), 'scripts', 'cloudinary-mapping.json');

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env.local');
  process.exit(1);
}

// Minimal schemas
const ProjectSchema = new mongoose.Schema({}, { strict: false });
const SiteSettingsSchema = new mongoose.Schema({}, { strict: false });
const MediaSchema = new mongoose.Schema({}, { strict: false });
const ReviewSchema = new mongoose.Schema({}, { strict: false });

interface MappingEntry {
  localUrl: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  folder: string;
}

function isLocalUrl(url: string): boolean {
  return !!url && url.startsWith('/uploads/');
}

async function main() {
  console.log('=== Phase 2: Apply Mapping to MongoDB ===\n');

  // Read mapping
  const mappingRaw = await readFile(MAPPING_FILE, 'utf-8');
  const mapping: MappingEntry[] = JSON.parse(mappingRaw);
  console.log(`Loaded ${mapping.length} mapping entries\n`);

  // Build lookup: localUrl -> cloudinaryUrl
  const urlMap = new Map<string, string>();
  for (const entry of mapping) {
    urlMap.set(entry.localUrl, entry.cloudinaryUrl);
  }

  // Connect to MongoDB
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 30000,
    });
    console.log('MongoDB connected\n');
  } catch (err) {
    // Try explicit hosts as fallback
    console.log('SRV failed, trying explicit hosts...');
    const explicitHosts = 'ac-5uwrlhl-shard-00-00.nlodt8z.mongodb.net:27017,ac-5uwrlhl-shard-00-01.nlodt8z.mongodb.net:27017,ac-5uwrlhl-shard-00-02.nlodt8z.mongodb.net:27017';
    const base = MONGODB_URI.split('?')[0].replace('mongodb+srv://', 'mongodb://');
    const atIdx = base.indexOf('@');
    const prefix = base.substring(0, atIdx + 1);
    const explicitUri = prefix + explicitHosts + '?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(explicitUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 30000,
    });
    console.log('MongoDB connected (explicit hosts)\n');
  }

  const Project = mongoose.model('Project', ProjectSchema);
  const SiteSettings = mongoose.model('SiteSettings', SiteSettingsSchema);
  const Media = mongoose.model('Media', MediaSchema);
  const Review = mongoose.model('Review', ReviewSchema);

  let totalUpdated = 0;

  // --- Projects ---
  console.log('--- Projects ---');
  const projects = await Project.find({}).lean();
  for (const project of projects) {
    const updates: Record<string, unknown> = {};
    const fields = [
      'image', 'coverImage', 'thumbnailImage', 'logoImage',
      'featureBanner', 'mobileScreenshot', 'desktopScreenshot',
      'tabletScreenshot', 'casePdfUrl',
    ];
    for (const field of fields) {
      const url = project[field];
      if (typeof url === 'string' && isLocalUrl(url)) {
        const cloudUrl = urlMap.get(url);
        if (cloudUrl) {
          updates[field] = cloudUrl;
          console.log(`  [${project.slug || project._id}] ${field}: ${url} → ${cloudUrl.substring(0, 50)}...`);
        }
      }
    }
    if (Array.isArray(project.gallery)) {
      let changed = false;
      const newGallery = project.gallery.map((gUrl: string) => {
        if (isLocalUrl(gUrl)) {
          const cloudUrl = urlMap.get(gUrl);
          if (cloudUrl) { changed = true; return cloudUrl; }
        }
        return gUrl;
      });
      if (changed) {
        updates.gallery = newGallery;
        console.log(`  [${project.slug}] gallery: updated`);
      }
    }
    if (Object.keys(updates).length > 0) {
      await Project.updateOne({ _id: project._id }, { $set: updates });
      totalUpdated++;
    }
  }

  // --- Settings ---
  console.log('\n--- Site Settings ---');
  const settings = await SiteSettings.findOne({}).lean();
  if (settings) {
    const updates: Record<string, string> = {};
    for (const field of ['ogImageUrl', 'faviconUrl', 'aboutPortrait']) {
      const url = settings[field];
      if (typeof url === 'string' && isLocalUrl(url)) {
        const cloudUrl = urlMap.get(url);
        if (cloudUrl) {
          updates[field] = cloudUrl;
          console.log(`  ${field}: ${url} → ${cloudUrl.substring(0, 50)}...`);
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      await SiteSettings.updateOne({ _id: settings._id }, { $set: updates });
      totalUpdated++;
    }
  }

  // --- Media ---
  console.log('\n--- Media Collection ---');
  const mediaItems = await Media.find({}).lean();
  let mediaUpdated = 0;
  for (const media of mediaItems) {
    if (isLocalUrl(media.url)) {
      const cloudUrl = urlMap.get(media.url);
      if (cloudUrl) {
        await Media.updateOne({ _id: media._id }, { $set: { url: cloudUrl, filename: media._id.toString() } });
        mediaUpdated++;
        console.log(`  [${media.originalName || media._id}]: updated`);
      }
    }
  }
  totalUpdated += mediaUpdated;

  // --- Reviews ---
  console.log('\n--- Reviews ---');
  const reviews = await Review.find({}).lean();
  let reviewUpdated = 0;
  for (const review of reviews) {
    if (isLocalUrl(review.image)) {
      const cloudUrl = urlMap.get(review.image);
      if (cloudUrl) {
        await Review.updateOne({ _id: review._id }, { $set: { image: cloudUrl } });
        reviewUpdated++;
        console.log(`  [${review.name || review._id}]: updated`);
      }
    }
  }
  totalUpdated += reviewUpdated;

  console.log(`\n=== Done ===`);
  console.log(`Total documents updated: ${totalUpdated}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
