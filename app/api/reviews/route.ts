import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Review } from '@/lib/models';
import { ReviewSchema } from '@/lib/validations';
import { broadcastPushNotification } from '@/lib/notifications/push-server';
import { sendReviewThankYou, sendNewReviewNotification } from '@/lib/email';

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return false;
  entry.count++;
  return true;
}

function isSafeImagePath(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  if (!value.startsWith('/uploads/reviews/')) return false;
  if (value.includes('..') || value.includes('\0')) return false;
  const ext = value.split('.').pop()?.toLowerCase();
  if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return false;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Invalid input.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    let imageUrl = '';
    if (parsed.data.image) {
      if (isSafeImagePath(parsed.data.image)) {
        imageUrl = parsed.data.image;
      }
    }

    await connectDB();
    const review = await Review.create({
      name: parsed.data.name,
      email: parsed.data.email || '',
      designation: parsed.data.designation || '',
      review: parsed.data.review,
      image: imageUrl,
      status: 'pending',
    });

    // Fire notifications — do not block the response
    triggerReviewNotifications({
      reviewId: review._id.toString(),
      name: parsed.data.name,
      email: parsed.data.email,
      designation: parsed.data.designation,
      reviewText: parsed.data.review,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
  }
}

async function triggerReviewNotifications(data: {
  reviewId: string;
  name: string;
  email: string;
  designation?: string;
  reviewText: string;
}): Promise<void> {
  const payload = {
    title: "New Review Received",
    body: `${data.name} left a review waiting for moderation.`,
    url: "/admin/dashboard/reviews",
    tag: "new-review",
  };

  await broadcastPushNotification(payload).catch(() => {});

  try {
    const broadcast = globalThis.__wsBroadcastToAdmins;
    if (broadcast) {
      broadcast({
        type: "review:new",
        payload: {
          id: data.reviewId,
          name: data.name,
          status: "pending",
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch {
    // WebSocket not available — ignore
  }

  // Email notifications — non-blocking
  if (data.email) {
    sendReviewThankYou({ name: data.name, email: data.email }).catch(() => {});
  }
  sendNewReviewNotification({
    name: data.name,
    email: data.email || 'N/A',
    designation: data.designation,
    review: data.reviewText,
  }).catch(() => {});
}
