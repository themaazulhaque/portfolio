/**
 * Debug: compare MongoDB URLs vs mapping keys.
 */
import { readFile } from 'fs/promises';
import path from 'path';

async function main() {
  const mappingRaw = await readFile(path.join(process.cwd(), 'scripts', 'cloudinary-mapping.json'), 'utf-8');
  const mapping: { localUrl: string; cloudinaryUrl: string }[] = JSON.parse(mappingRaw);

  // Known MongoDB URLs from inspect
  const mongoUrls = [
    '/uploads/6561a428-d918-4e1a-bfbb-faebbf7e10cb.png',
    '/uploads/c9639286-dcbc-43da-aef4-8d6bbf1e7823.png',
    '/uploads/05941dd0-0064-46ad-ba25-33bdf45c20b5.png',
    '/uploads/fc68ba88-81a3-4b00-9826-fc7e1c04bf74.jpeg',
  ];

  console.log('Mapping keys:');
  for (const entry of mapping) {
    console.log(`  "${entry.localUrl}"`);
  }

  console.log('\nMongoDB URLs:');
  for (const url of mongoUrls) {
    console.log(`  "${url}"`);
    const found = mapping.find(m => m.localUrl === url);
    console.log(`    Match: ${found ? 'YES → ' + found.cloudinaryUrl.substring(0, 50) : 'NO'}`);
  }
}

main();
