/**
 * Inspect MongoDB to see actual URL values.
 * Run: npx tsx scripts/inspect-urls.ts
 */

import mongoose from 'mongoose';
import { readFile } from 'fs/promises';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

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

const MONGODB_URI = process.env.MONGODB_URI!;

const S = new mongoose.Schema({}, { strict: false });

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected\n');

  const Project = mongoose.model('Project', S);
  const Settings = mongoose.model('SiteSettings', S);
  const Media = mongoose.model('Media', S);
  const Review = mongoose.model('Review', S);

  const projects = await Project.find({}).lean();
  console.log(`=== Projects (${projects.length}) ===`);
  for (const p of projects) {
    const fields = ['image', 'coverImage', 'thumbnailImage', 'logoImage', 'featureBanner', 'mobileScreenshot', 'desktopScreenshot', 'tabletScreenshot', 'casePdfUrl'];
    for (const f of fields) {
      if (p[f]) console.log(`  [${p.slug}] ${f}: ${p[f]}`);
    }
    if (Array.isArray(p.gallery) && p.gallery.length > 0) {
      console.log(`  [${p.slug}] gallery (${p.gallery.length}):`);
      for (const g of p.gallery) console.log(`    ${g}`);
    }
  }

  const settings = await Settings.findOne({}).lean();
  if (settings) {
    console.log(`\n=== Site Settings ===`);
    for (const f of ['ogImageUrl', 'faviconUrl', 'aboutPortrait']) {
      if (settings[f]) console.log(`  ${f}: ${settings[f]}`);
    }
  }

  const media = await Media.find({}).lean();
  console.log(`\n=== Media (${media.length}) ===`);
  for (const m of media.slice(0, 10)) {
    console.log(`  ${m.originalName}: ${m.url}`);
  }
  if (media.length > 10) console.log(`  ... and ${media.length - 10} more`);

  const reviews = await Review.find({}).lean();
  console.log(`\n=== Reviews (${reviews.length}) ===`);
  for (const r of reviews) {
    if (r.image) console.log(`  ${r.name}: ${r.image}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
