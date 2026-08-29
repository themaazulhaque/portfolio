'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { connectDB } from '@/lib/db';
import { ContactMessage } from '@/lib/models';
import { auditLog } from '@/lib/audit';
import { getSession } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { redirect } from 'next/navigation';
import { sendContactNotification, sendContactAcknowledgement } from '@/lib/email';

async function requireAdmin(): Promise<void> {
  const session = await getSession();
  if (!session) redirect('/admin/login');
}

interface ActionState {
  error?: string;
  success?: boolean;
}

export async function getMessages() {
  await requireAdmin();
  try {
    await connectDB();
    const items = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

export async function markMessageRead(id: string, read: boolean): Promise<ActionState> {
  await requireAdmin();
  try {
    await connectDB();
    await ContactMessage.findByIdAndUpdate(id, { read });
    await auditLog({ action: read ? 'MARK_READ' : 'MARK_UNREAD', resource: 'message', resourceId: id });
    revalidatePath('/admin/messages');
    return { success: true };
  } catch {
    return { error: 'Failed to update message.' };
  }
}

export async function deleteMessage(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await connectDB();
    await ContactMessage.findByIdAndDelete(id);
    await auditLog({ action: 'DELETE', resource: 'message', resourceId: id });
    revalidatePath('/admin/messages');
    return { success: true };
  } catch {
    return { error: 'Failed to delete message.' };
  }
}

// PUBLIC: create a message from the portfolio contact form
export async function createContactMessage(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const headerStore = await headers();
  const xff = headerStore.get('x-forwarded-for');
  const ip = xff ? xff.split(',')[0]?.trim() || 'unknown' : headerStore.get('x-real-ip') || 'unknown';

  const limiter = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limiter.allowed) {
    return {
      error: 'Too many messages sent from this device. Please try again later.',
    };
  }

  const raw = {
    name: (formData.get('name') as string)?.trim(),
    email: (formData.get('email') as string)?.trim(),
    subject: (formData.get('subject') as string)?.trim(),
    message: (formData.get('message') as string)?.trim(),
  };

  if (!raw.name || !raw.email || !raw.message) {
    return { error: 'Name, email and message are required.' };
  }

  try {
    await connectDB();
    await ContactMessage.create(raw);
    revalidatePath('/admin/messages');

    // Fire emails — do not block the response
    sendContactNotification(raw).catch(() => {});
    sendContactAcknowledgement(raw).catch(() => {});

    return { success: true };
  } catch {
    return { error: 'Failed to send message.' };
  }
}
