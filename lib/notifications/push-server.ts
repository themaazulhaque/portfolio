import webpush from "web-push";
import { connectDB } from "../db";
import { PushSubscription } from "../models";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@localhost";

let vapidConfigured = false;

function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
    return true;
  } catch {
    return false;
  }
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload
): Promise<boolean> {
  if (!ensureVapid()) return false;

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      { TTL: 60 * 60 }
    );
    return true;
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await removeSubscription(subscription.endpoint);
    }
    return false;
  }
}

export async function broadcastPushNotification(
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapid()) return { sent: 0, failed: 0 };

  await connectDB();
  const subscriptions = await PushSubscription.find().lean();
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    const ok = await sendPushNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      payload
    );
    if (ok) sent++;
    else failed++;
  }

  return { sent, failed };
}

export async function addSubscription(data: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<boolean> {
  try {
    await connectDB();
    await PushSubscription.findOneAndUpdate(
      { endpoint: data.endpoint },
      { keys: data.keys },
      { upsert: true, new: true }
    );
    return true;
  } catch {
    return false;
  }
}

export async function removeSubscription(endpoint: string): Promise<boolean> {
  try {
    await connectDB();
    await PushSubscription.deleteOne({ endpoint });
    return true;
  } catch {
    return false;
  }
}
