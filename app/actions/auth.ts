'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { Admin } from '@/lib/models';
import { createSession, deleteSession } from '@/lib/session';
import { LoginSchema, getValidationErrorMessage } from '@/lib/validations';
import { auditLog } from '@/lib/audit';
import { rateLimit, resetRateLimit } from '@/lib/rate-limit';

export interface LoginState {
  error?: string;
  success?: boolean;
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_ATTEMPTS = 5;

async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  const xff = headerStore.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  return headerStore.get('x-real-ip') || 'unknown';
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const ip = await getClientIp();
  const limiter = rateLimit(`login:${ip}`, { limit: LOGIN_MAX_ATTEMPTS, windowMs: LOGIN_WINDOW_MS });
  if (!limiter.allowed) {
    return {
      error: `Too many login attempts. Please try again in ${Math.ceil(limiter.retryAfterSec / 60)} minute(s).`,
    };
  }

  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: getValidationErrorMessage(parsed.error) };
  }

  const { email, password } = parsed.data;

  try {
    await connectDB();
    const admin = await Admin.findOne({ email }).select('+passwordHash');

    if (!admin) {
      // Constant time response to prevent enumeration
      await bcrypt.compare(password, '$2a$12$dummy.hash.for.timing.safety.only.abc123');
      return { error: 'Invalid credentials' };
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      await auditLog({ action: 'LOGIN_FAILED', resource: 'admin', details: `Failed login for ${email}`, ip });
      return { error: 'Invalid credentials' };
    }

    const created = await createSession(admin._id.toString(), admin.email);
    if (!created) {
      return { error: 'Authentication is currently unavailable. Please try again later.' };
    }

    resetRateLimit(`login:${ip}`);
    await auditLog({ action: 'LOGIN_SUCCESS', resource: 'admin', resourceId: admin._id.toString(), ip });
  } catch {
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  redirect('/admin/dashboard');
}

export async function logoutAction(): Promise<void> {
  await auditLog({ action: 'LOGOUT', resource: 'admin' });
  await deleteSession();
  redirect('/admin/login');
}
