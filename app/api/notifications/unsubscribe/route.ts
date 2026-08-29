import { NextResponse } from "next/server";
import { removeSubscription } from "@/lib/notifications/push-server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rl = rateLimit(`push-unsubscribe:${ip}`, { limit: 10, windowMs: 60_000 });
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

  if (typeof obj.endpoint !== "string" || !obj.endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await removeSubscription(obj.endpoint);

  return NextResponse.json({ success: true });
}
