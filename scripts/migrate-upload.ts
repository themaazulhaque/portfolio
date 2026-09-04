/**
 * Phase 1: Upload local files to Cloudinary and save a URL mapping.
 * Run locally: npx tsx scripts/migrate-upload.ts
 *
 * Reads .env.local for Cloudinary credentials.
 * Outputs: scripts/cloudinary-mapping.json
 */

import { v2 as cloudinary } from 'cloudinary';
import { readFile, readdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
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

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('Missing Cloudinary credentials in .env.local');
  process.exit(1);
}

cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET, secure: true });

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAPPING_FILE = path.join(process.cwd(), 'scripts', 'cloudinary-mapping.json');

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', gif: 'image/gif', avif: 'image/avif',
  mp4: 'video/mp4', webm: 'video/webm', pdf: 'application/pdf',
};

interface MappingEntry {
  localUrl: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  folder: string;
}

function getFolder(filePath: string): string {
  const rel = path.relative(UPLOADS_DIR, filePath).replace(/\\/g, '/');
  if (rel.startsWith('reviews/')) return 'portfolio/reviews';
  return 'portfolio/media';
}

async function uploadOne(filePath: string): Promise<MappingEntry> {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const mime = MIME_MAP[ext] || 'application/octet-stream';
  const resourceType = mime.startsWith('image/') ? 'image'
    : mime.startsWith('video/') ? 'video' : 'raw';
  const folder = getFolder(filePath);
  const buffer = await readFile(filePath);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType, unique_filename: true },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('No result'));
        const relPath = '/' + path.relative(path.join(process.cwd(), 'public'), filePath).replace(/\\/g, '/');
        resolve({
          localUrl: relPath,
          cloudinaryUrl: result.secure_url,
          cloudinaryPublicId: result.public_id,
          folder,
        });
      }
    );
    stream.end(buffer);
  });
}

async function walkDir(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkDir(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  console.log('=== Phase 1: Upload to Cloudinary ===\n');
  console.log(`Cloud: ${CLOUD_NAME}`);
  console.log(`Source: ${UPLOADS_DIR}\n`);

  // Test connection
  try {
    await cloudinary.api.ping();
    console.log('Cloudinary connection: OK\n');
  } catch (err) {
    console.error('Cloudinary connection FAILED:', err);
    process.exit(1);
  }

  if (!existsSync(UPLOADS_DIR)) {
    console.error('public/uploads/ does not exist');
    process.exit(1);
  }

  const allFiles = await walkDir(UPLOADS_DIR);
  console.log(`Found ${allFiles.length} files\n`);

  const mapping: MappingEntry[] = [];
  let success = 0;
  let fail = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const name = path.relative(UPLOADS_DIR, file);
    process.stdout.write(`[${i + 1}/${allFiles.length}] ${name} ... `);
    try {
      const entry = await uploadOne(file);
      mapping.push(entry);
      console.log(`OK → ${entry.cloudinaryUrl.substring(0, 60)}...`);
      success++;
    } catch (err) {
      console.log(`FAILED: ${err}`);
      fail++;
    }
  }

  await writeFile(MAPPING_FILE, JSON.stringify(mapping, null, 2));
  console.log(`\n=== Done ===`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${fail}`);
  console.log(`Mapping saved to: ${MAPPING_FILE}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
