import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/session';
import { rateLimit } from './lib/rate-limit';

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin' || pathname === '/admin/login';
  const isApiAuth = pathname === '/api/admin/auth/login';

  // Apply rate limiting to login API
  if (isApiAuth && request.method === 'POST') {
    const ip = getClientIp(request);
    const { allowed } = rateLimit(`login:${ip}`, { limit: LOGIN_MAX_ATTEMPTS, windowMs: LOGIN_WINDOW_MS });
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again in 15 minutes.' },
        { status: 429 }
      );
    }
  }

  if (isAdminRoute && !isLoginPage) {
    const sessionToken = request.cookies.get('admin_session')?.value;

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const session = await decrypt(sessionToken);
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Check session expiry
    if (new Date(session.expiresAt) < new Date()) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin_session');
      return response;
    }
  }

  // Block access to login page if already authenticated
  if (isLoginPage && request.method === 'GET') {
    const sessionToken = request.cookies.get('admin_session')?.value;
    if (sessionToken) {
      const session = await decrypt(sessionToken);
      if (session && new Date(session.expiresAt) >= new Date()) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    }
  }

  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
