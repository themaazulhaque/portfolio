'use server';

import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { Review } from '@/lib/models';
import { ReviewAdminSchema } from '@/lib/validations';
import { getSession } from '@/lib/session';

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function getReviews(status?: string) {
  await requireAdmin();
  await connectDB();
  const filter = status ? { status } : {};
  const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(reviews));
}

export async function getReviewStats() {
  await requireAdmin();
  await connectDB();
  const [pending, approved, rejected, total] = await Promise.all([
    Review.countDocuments({ status: 'pending' }),
    Review.countDocuments({ status: 'approved' }),
    Review.countDocuments({ status: 'rejected' }),
    Review.countDocuments(),
  ]);
  return { pending, approved, rejected, total };
}

export async function updateReviewStatus(id: string, status: 'approved' | 'rejected') {
  const session = await requireAdmin();
  await connectDB();
  const review = await Review.findById(id);
  if (!review) throw new Error('Review not found');
  review.status = status;
  if (status === 'approved') {
    review.approvedAt = new Date();
    review.approvedBy = session.email;
  }
  await review.save();
  revalidatePath('/admin/dashboard/reviews');
  revalidatePath('/');

  try {
    const broadcast = globalThis.__wsBroadcastToAdmins;
    if (broadcast) {
      broadcast({
        type: `review:${status}` as const,
        payload: {
          id: review._id.toString(),
          name: review.name,
          status,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch { /* WebSocket not available */ }
}

export async function deleteReview(id: string) {
  await requireAdmin();
  await connectDB();
  await Review.findByIdAndDelete(id);
  revalidatePath('/admin/dashboard/reviews');
  revalidatePath('/');
}

export async function updateReview(id: string, data: { name?: string; designation?: string; review?: string }) {
  await requireAdmin();
  await connectDB();
  const parsed = ReviewAdminSchema.partial().safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid input');
  await Review.findByIdAndUpdate(id, parsed.data);
  revalidatePath('/admin/dashboard/reviews');
  revalidatePath('/');
}

export async function getReviewById(id: string) {
  await requireAdmin();
  await connectDB();
  const review = await Review.findById(id).lean();
  if (!review) return null;
  return JSON.parse(JSON.stringify(review));
}
