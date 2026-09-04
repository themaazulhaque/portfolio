'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Review } from '@/lib/models';
import { ReviewAdminSchema } from '@/lib/validations';
import { getSession } from '@/lib/session';

interface ActionState {
  error?: string;
  success?: boolean;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return session;
}

export async function getReviews(status?: string) {
  await requireAdmin();
  try {
    await connectDB();
    const filter = status ? { status } : {};
    const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(reviews));
  } catch {
    return [];
  }
}

export async function getReviewStats() {
  await requireAdmin();
  try {
    await connectDB();
    const [pending, approved, rejected, total] = await Promise.all([
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: 'approved' }),
      Review.countDocuments({ status: 'rejected' }),
      Review.countDocuments(),
    ]);
    return { pending, approved, rejected, total };
  } catch {
    return { pending: 0, approved: 0, rejected: 0, total: 0 };
  }
}

export async function updateReviewStatus(id: string, status: 'approved' | 'rejected'): Promise<ActionState> {
  const session = await requireAdmin();
  try {
    await connectDB();
    const review = await Review.findById(id);
    if (!review) return { error: 'Review not found.' };
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

    return { success: true };
  } catch {
    return { error: 'Failed to update review status.' };
  }
}

export async function deleteReview(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await connectDB();
    await Review.findByIdAndDelete(id);
    revalidatePath('/admin/dashboard/reviews');
    revalidatePath('/');
    return { success: true };
  } catch {
    return { error: 'Failed to delete review.' };
  }
}

export async function updateReview(id: string, data: { name?: string; designation?: string; review?: string }): Promise<ActionState> {
  await requireAdmin();
  try {
    await connectDB();
    const parsed = ReviewAdminSchema.partial().safeParse(data);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid input.' };
    await Review.findByIdAndUpdate(id, parsed.data);
    revalidatePath('/admin/dashboard/reviews');
    revalidatePath('/');
    return { success: true };
  } catch {
    return { error: 'Failed to update review.' };
  }
}

export async function getReviewById(id: string) {
  await requireAdmin();
  try {
    await connectDB();
    const review = await Review.findById(id).lean();
    if (!review) return null;
    return JSON.parse(JSON.stringify(review));
  } catch {
    return null;
  }
}
