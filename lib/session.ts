import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'admin_session';
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionPayload {
  adminId: string;
  email: string;
  expiresAt: string;
}

function getSecretKey(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload): Promise<string | null> {
  const key = getSecretKey();
  if (!key) {
    return null;
  }

  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  const key = getSecretKey();
  if (!key) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(adminId: string, email: string): Promise<boolean> {
  const expiresAt = new Date(Date.now() + EXPIRY_MS).toISOString();
  const token = await encrypt({ adminId, email, expiresAt });
  if (!token) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + EXPIRY_MS),
    path: '/',
  });

  return true;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decrypt(token);
}

export async function refreshSession(): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await createSession(session.adminId, session.email);
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
