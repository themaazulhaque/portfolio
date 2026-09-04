import mongoose from 'mongoose';
import { readFile } from 'fs/promises';
import path from 'path';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

const envPath = path.join(process.cwd(), '.env.local');
const envContent = require('fs').readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('='); if (eq === -1) continue;
  const k = t.substring(0, eq).trim(), v = t.substring(eq + 1).trim();
  if (v && !process.env[k]) process.env[k] = v;
}

const S = new mongoose.Schema({}, { strict: false });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 15000 });
  const Project = mongoose.model('Project', S);
  const projects = await Project.find({}).lean();
  
  for (const p of projects) {
    console.log(`\n=== ${p.title} (${p.slug}) ===`);
    const imgFields = ['image', 'coverImage', 'thumbnailImage', 'logoImage', 'featureBanner', 'mobileScreenshot', 'desktopScreenshot', 'tabletScreenshot', 'casePdfUrl'];
    for (const f of imgFields) {
      const v = p[f];
      if (v && v !== '' && v !== null) console.log(`  ${f}: ${v}`);
    }
    if (Array.isArray(p.gallery) && p.gallery.length > 0) {
      console.log(`  gallery (${p.gallery.length}):`);
      p.gallery.forEach((g: string) => console.log(`    ${g}`));
    }
    const hasAny = imgFields.some(f => p[f] && p[f] !== '' && p[f] !== null) || (Array.isArray(p.gallery) && p.gallery.length > 0);
    if (!hasAny) console.log(`  (no image data)`);
  }

  // Also check which of the 49 local files are referenced anywhere
  const mappingRaw = await readFile(path.join(process.cwd(), 'scripts', 'cloudinary-mapping.json'), 'utf-8');
  const mapping: { localUrl: string }[] = JSON.parse(mappingRaw);
  const localUrls = new Set(mapping.map(m => m.localUrl));
  
  console.log('\n=== Cross-reference: local files in MongoDB ===');
  let found = 0;
  for (const p of projects) {
    const allVals = JSON.stringify(p);
    for (const url of localUrls) {
      if (allVals.includes(url)) {
        console.log(`  ${url} found in project ${p.slug}`);
        found++;
      }
    }
  }
  console.log(`Total local files referenced in projects: ${found}`);

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
