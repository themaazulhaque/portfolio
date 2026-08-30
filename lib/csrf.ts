import { type NextRequest } from 'next/server';

/**
 * Validate request origin for CSRF protection.
 *
 * Allows the request if the Origin header host matches EITHER:
 * 1. The configured NEXT_PUBLIC_APP_URL host, OR
 * 2. The incoming Host header (same-origin request)
 *
 * Returns true if the origin is valid or absent (non-browser requests).
 */
export function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // No origin = non-browser request (curl, server-to-server)

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false; // Malformed origin
  }

  // Check against configured APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      const allowedHost = new URL(appUrl).host;
      if (originHost === allowedHost) return true;
    } catch {
      // Invalid APP_URL, fall through to host check
    }
  }

  // Check against the incoming Host header (same-origin)
  const requestHost = request.headers.get('host');
  if (requestHost && originHost === requestHost) return true;

  return false;
}
