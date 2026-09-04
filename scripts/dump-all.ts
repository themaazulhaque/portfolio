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
  
  const Media = mongoose.model('Media', S);
  const media = await Media.find({}).lean();
  console.log('=== ALL Media documents ===');
  console.log(JSON.stringify(media, null, 2));

  const Settings = mongoose.model('SiteSettings', S);
  const settings = await Settings.findOne({}).lean();
  console.log('\n=== ALL SiteSettings ===');
  console.log(JSON.stringify(settings, null, 2));

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
  ``