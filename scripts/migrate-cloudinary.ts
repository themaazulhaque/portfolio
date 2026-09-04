/**
 * Migration script: Upload existing local media to Cloudinary and update MongoDB URLs.
 *
 * Run with: npx tsx scripts/migrate-cloudinary.ts
 *
 * Reads from .env.local automatically.
 */

import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// --- Load .env.local ---
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    console.error('.env.local not found');
    process.exit(1);
  }
  const content = require('fs').readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();
    if (value && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

// Force IPv4 for MongoDB Atlas SRV resolution on Windows
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

// Convert mongodb+srv:// to explicit mongodb:// connection string if SRV fails
let mongoUri = process.env.MONGODB_URI ?? '';
const isSrv = mongoUri.startsWith('mongodb+srv://');
const explicitHosts = 'ac-5uwrlhl-shard-00-00.nlodt8z.mongodb.net:27017,ac-5uwrlhl-shard-00-01.nlodt8z.mongodb.net:27017,ac-5uwrlhl-shard-00-02.nlodt8z.mongodb.net:27017';

// --- Config ---
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('Missing Cloudinary env vars');
  process.exit(1);
}
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

// --- Schema (minimal, matching lib/models.ts) ---
const ProjectSchema = new mongoose.Schema({
  title: String,
  slug: String,
  image: String,
  coverImage: String,
  thumbnailImage: String,
  logoImage: String,
  featureBanner: String,
  mobileScreenshot: String,
  desktopScreenshot: String,
  tabletScreenshot: String,
  casePdfUrl: String,
  gallery: [String],
}, { strict: false });

const SiteSettingsSchema = new mongoose.Schema({
  name: String,
  ogImageUrl: String,
  faviconUrl: String,
  aboutPortrait: String,
}, { strict: false });

const MediaSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  url: String,
  type: String,
}, { strict: false });

const ReviewSchema = new mongoose.Schema({
  name: String,
  image: String,
}, { strict: false });

// --- Helpers ---
function isLocalUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('/uploads/') || url.includes('/uploads/');
}

function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith('cloudinary.com');
  } catch {
    return false;
  }
}

function getLocalFilePath(url: string): string {
  // Convert /uploads/foo.jpg -> public/uploads/foo.jpg
  const clean = url.replace(/^\//, '');
  return path.join(process.cwd(), 'public', clean);
}

async function uploadFileToCloudinary(
  localPath: string,
  folder: string,
  publicId?: string
): Promise<string> {
  const buffer = await readFile(localPath);
  const fileStat = await stat(localPath);
  const ext = path.extname(localPath).toLowerCase().replace('.', '');
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', gif: 'image/gif', avif: 'image/avif',
    mp4: 'video/mp4', webm: 'video/webm', pdf: 'application/pdf',
  };
  const mime = mimeMap[ext] || 'application/octet-stream';
  const resourceType = mime.startsWith('image/') ? 'image'
    : mime.startsWith('video/') ? 'video'
    : 'raw';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        unique_filename: true,
        bytes: fileStat.size,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('No result'));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

interface MigrationResult {
  oldUrl: string;
  newUrl: string;
  status: 'success' | 'skipped' | 'error';
  error?: string;
}

async function migrateUrl(
  url: string,
  folder: string,
  fallbackId?: string
): Promise<MigrationResult> {
  if (!url || isCloudinaryUrl(url)) {
    return { oldUrl: url, newUrl: url, status: 'skipped' };
  }
  if (!isLocalUrl(url)) {
    return { oldUrl: url, newUrl: url, status: 'skipped' };
  }

  const localPath = getLocalFilePath(url);
  if (!existsSync(localPath)) {
    return { oldUrl: url, newUrl: url, status: 'skipped', error: 'File not found locally' };
  }

  try {
    const cloudUrl = await uploadFileToCloudinary(localPath, folder, fallbackId);
    return { oldUrl: url, newUrl: cloudUrl, status: 'success' };
  } catch (err) {
    return { oldUrl: url, newUrl: url, status: 'error', error: String(err) };
  }
}

// --- Main ---
async function main() {
  console.log('=== Cloudinary Migration ===\n');
  console.log(`Cloud name: ${CLOUD_NAME}`);
  console.log(`MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}\n`);

  // Test Cloudinary connection
  try {
    await cloudinary.api.ping();
    console.log('Cloudinary connection: OK\n');
  } catch (err) {
    console.error('Cloudinary connection FAILED:', err);
    process.exit(1);
  }

  // Connect to MongoDB
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    });
  } catch (srvErr) {
    if (isSrv) {
      console.log('SRV connection failed, trying explicit host list...');
      // Strip existing query params and rebuild
      const baseUri = mongoUri.split('?')[0].replace('mongodb+srv://', 'mongodb://');
      const atIdx = baseUri.indexOf('@');
      const prefix = baseUri.substring(0, atIdx + 1);
      const explicitUri = prefix + explicitHosts + '?retryWrites=true&w=majority&appName=Cluster0';
      await mongoose.connect(explicitUri, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 30000,
      });
    } else {
      throw srvErr;
    }
  }
  console.log('MongoDB connected\n');

  const Project = mongoose.model('Project', ProjectSchema);
  const SiteSettings = mongoose.model('SiteSettings', SiteSettingsSchema);
  const Media = mongoose.model('Media', MediaSchema);
  const Review = mongoose.model('Review', ReviewSchema);

  const allResults: MigrationResult[] = [];
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // --- 1. Migrate Projects ---
  console.log('--- Migrating Projects ---');
  const projects = await Project.find({}).lean();
  console.log(`Found ${projects.length} projects\n`);

  const projectImageFields = [
    'image', 'coverImage', 'thumbnailImage', 'logoImage',
    'featureBanner', 'mobileScreenshot', 'desktopScreenshot',
    'tabletScreenshot', 'casePdfUrl',
  ];

  for (const project of projects) {
    let updated = false;
    const updates: Record<string, string> = {};

    for (const field of projectImageFields) {
      const url = project[field];
      if (isLocalUrl(url)) {
        const result = await migrateUrl(url, 'portfolio/projects');
        allResults.push(result);
        if (result.status === 'success') {
          updates[field] = result.newUrl;
          updated = true;
          successCount++;
          console.log(`  [${project.slug || project._id}] ${field}: OK`);
        } else if (result.status === 'error') {
          errorCount++;
          console.error(`  [${project.slug || project._id}] ${field}: ERROR - ${result.error}`);
        } else {
          skipCount++;
        }
      }
    }

    // Gallery
    if (Array.isArray(project.gallery) && project.gallery.length > 0) {
      const newGallery: string[] = [];
      let galleryChanged = false;
      for (const gUrl of project.gallery) {
        if (isLocalUrl(gUrl)) {
          const result = await migrateUrl(gUrl, 'portfolio/projects/gallery');
          allResults.push(result);
          if (result.status === 'success') {
            newGallery.push(result.newUrl);
            galleryChanged = true;
            successCount++;
            console.log(`  [${project.slug}] gallery item: OK`);
          } else if (result.status === 'error') {
            newGallery.push(gUrl); // keep original on error
            errorCount++;
            console.error(`  [${project.slug}] gallery item: ERROR - ${result.error}`);
          } else {
            newGallery.push(gUrl);
            skipCount++;
          }
        } else {
          newGallery.push(gUrl);
        }
      }
      if (galleryChanged) {
        updates.gallery = newGallery;
        updated = true;
      }
    }

    if (updated) {
      await Project.updateOne({ _id: project._id }, { $set: updates });
    }
  }

  // --- 2. Migrate Site Settings ---
  console.log('\n--- Migrating Site Settings ---');
  const settings = await SiteSettings.findOne({}).lean();
  if (settings) {
    const settingsFields = ['ogImageUrl', 'faviconUrl', 'aboutPortrait'];
    const settingsUpdates: Record<string, string> = {};
    let settingsChanged = false;

    for (const field of settingsFields) {
      const url = settings[field];
      if (isLocalUrl(url)) {
        const result = await migrateUrl(url, 'portfolio/settings');
        allResults.push(result);
        if (result.status === 'success') {
          settingsUpdates[field] = result.newUrl;
          settingsChanged = true;
          successCount++;
          console.log(`  ${field}: OK`);
        } else if (result.status === 'error') {
          errorCount++;
          console.error(`  ${field}: ERROR - ${result.error}`);
        } else {
          skipCount++;
        }
      }
    }

    if (settingsChanged) {
      await SiteSettings.updateOne({ _id: settings._id }, { $set: settingsUpdates });
    }
  }

  // --- 3. Migrate Media collection ---
  console.log('\n--- Migrating Media Collection ---');
  const mediaItems = await Media.find({}).lean();
  console.log(`Found ${mediaItems.length} media items\n`);

  for (const media of mediaItems) {
    if (isLocalUrl(media.url)) {
      const folder = media.type === 'video' ? 'portfolio/media' : 'portfolio/media';
      const result = await migrateUrl(media.url, folder);
      allResults.push(result);
      if (result.status === 'success') {
        await Media.updateOne({ _id: media._id }, { $set: { url: result.newUrl, filename: result.newUrl } });
        successCount++;
        console.log(`  [${media.originalName || media._id}]: OK`);
      } else if (result.status === 'error') {
        errorCount++;
        console.error(`  [${media.originalName || media._id}]: ERROR - ${result.error}`);
      } else {
        skipCount++;
      }
    }
  }

  // --- 4. Migrate Reviews ---
  console.log('\n--- Migrating Reviews ---');
  const reviews = await Review.find({}).lean();
  console.log(`Found ${reviews.length} reviews\n`);

  for (const review of reviews) {
    if (isLocalUrl(review.image)) {
      const result = await migrateUrl(review.image, 'portfolio/reviews');
      allResults.push(result);
      if (result.status === 'success') {
        await Review.updateOne({ _id: review._id }, { $set: { image: result.newUrl } });
        successCount++;
        console.log(`  [${review.name || review._id}]: OK`);
      } else if (result.status === 'error') {
        errorCount++;
        console.error(`  [${review.name || review._id}]: ERROR - ${result.error}`);
      } else {
        skipCount++;
      }
    }
  }

  // --- Summary ---
  console.log('\n=== Migration Summary ===');
  console.log(`Total URLs processed: ${allResults.length}`);
  console.log(`Successful uploads:   ${successCount}`);
  console.log(`Skipped (already Cloudinary or not local): ${skipCount}`);
  console.log(`Errors:               ${errorCount}`);

  if (successCount > 0) {
    console.log('\n--- Migration Mapping ---');
    for (const r of allResults.filter((r) => r.status === 'success')) {
      console.log(`  ${r.oldUrl}  →  ${r.newUrl}`);
    }
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
