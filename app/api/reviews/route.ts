import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Review } from '@/lib/models';
import { ReviewSchema } from '@/lib/validations';
import { broadcastPushNotification } from '@/lib/notifications/push-server';
import { sendReviewThankYou, sendNewReviewNotification } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

function isSafeImagePath(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  if (value.includes('..') || value.includes('\0')) return false;
  // Accept Cloudinary HTTPS URLs
  try {
    const parsed = new URL(value);
    if (parsed.hostname.endsWith('cloudinary.com')) {
      return true;
    }
  } catch {
    // Not a full URL, check local path
  }
  // Accept local /uploads/reviews/ paths (legacy)
  if (!value.startsWith('/uploads/reviews/')) return false;
  const ext = value.split('.').pop()?.toLowerCase();
  if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return false;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const limiter = rateLimit(`review-submit:${ip}`, { limit: 5, windowMs: 60 * 1000 });
  if (!limiter.allowed) {
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

  await broadcastPushNotification(payload).catch((err) => console.error("[ws] Push notification failed:", err));

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
    sendReviewThankYou({ name: data.name, email: data.email }).then((r) => {
      if (!r.success) console.error("[email] Review thank-you FAILED:", r.error);
    }).catch((err) => console.error("[email] Review thank-you exception:", err));
  }
  sendNewReviewNotification({
    name: data.name,
    email: data.email || 'N/A',
    designation: data.designation,
    review: data.reviewText,
  }).then((r) => {
    if (!r.success) console.error("[email] Review notification FAILED:", r.error);
  }).catch((err) => console.error("[email] Review notification exception:", err));
}
