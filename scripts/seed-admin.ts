/**
 * Admin Seed Script
 * Run: npx tsx scripts/seed-admin.ts
 *
 * Creates the initial admin user if one does not exist.
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD from .env.local
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGODB_URI || !EMAIL || !PASSWORD) {
  console.error('Missing required env vars: MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD');
  process.exit(1);
}

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

async function seed() {
  await mongoose.connect(MONGODB_URI as string);
  const Admin = mongoose.models['Admin'] ?? mongoose.model('Admin', AdminSchema);

  const existing = await Admin.findOne({ email: EMAIL });
  if (existing) {
    console.log(`✓ Admin already exists: ${EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD as string, 12);
  await Admin.create({ email: EMAIL, passwordHash });
  console.log(`✓ Admin created: ${EMAIL}`);
  console.log('  Login at: http://localhost:3000/admin');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
