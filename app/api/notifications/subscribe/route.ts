import { NextResponse } from "next/server";
import { addSubscription } from "@/lib/notifications/push-server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rl = rateLimit(`push-subscribe:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const obj = body as Record<string, unknown>;

  if (typeof obj.endpoint !== "string" || !obj.endpoint.startsWith("https://")) {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }

  if (obj.endpoint.length > 2048) {
    return NextResponse.json({ error: "Endpoint too long" }, { status: 400 });
  }

  if (typeof obj.keys !== "object" || obj.keys === null) {
    return NextResponse.json({ error: "Missing keys" }, { status: 400 });
  }

  const keys = obj.keys as Record<string, unknown>;
  if (typeof keys.p256dh !== "string" || typeof keys.auth !== "string") {
    return NextResponse.json({ error: "Invalid keys" }, { status: 400 });
  }

  if (keys.p256dh.length > 512 || keys.auth.length > 128) {
    return NextResponse.json({ error: "Keys too long" }, { status: 400 });
  }

  const ok = await addSubscription({
    endpoint: obj.endpoint,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
  });

  if (!ok) {
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
