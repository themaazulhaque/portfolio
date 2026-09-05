import { NextResponse } from "next/server";
import { isEmailConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      email: {
        configured: isEmailConfigured(),
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasEmailFrom: !!process.env.EMAIL_FROM,
        hasEmailFromName: !!process.env.EMAIL_FROM_NAME,
        hasAdminEmail: !!process.env.ADMIN_EMAIL,
        emailFrom: process.env.EMAIL_FROM || "NOT SET",
      },
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
