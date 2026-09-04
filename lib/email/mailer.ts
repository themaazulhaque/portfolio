import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@localhost";
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Maazul";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

let resendClient: Resend | null = null;

function ensureClient(): Resend | null {
  if (resendClient) return resendClient;
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not configured — emails will not be sent");
    return null;
  }
  resendClient = new Resend(RESEND_API_KEY);
  return resendClient;
}

export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY && !!ADMIN_EMAIL;
}

function fromAddress(): string {
  return EMAIL_FROM_NAME ? `${EMAIL_FROM_NAME} <${EMAIL_FROM}>` : EMAIL_FROM;
}

function escapeHeader(value: string): string {
  return value.replace(/[\r\n]/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export interface EmailResult {
  success: boolean;
  error?: string;
}

async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const client = ensureClient();
  if (!client) {
    console.warn("[email] Resend not configured — skipping email");
    return { success: false, error: "Email not configured" };
  }

  try {
    await client.emails.send({
      from: fromAddress(),
      to: escapeHeader(options.to),
      subject: escapeHeader(options.subject),
      html: options.html,
      text: options.text,
      replyTo: options.replyTo ? escapeHeader(options.replyTo) : undefined,
    });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[email] Failed to send: ${msg}`);
    return { success: false, error: msg };
  }
}

// ─── Email Design System ──────────────────────────────────────
// Maazul Editorial — inline CSS email templates.
// All values derived from the Maazul Editorial design tokens.
// Single-column, table-based, email-client-safe.

const EMAIL_MAX_WIDTH = 600;

const S = {
  bg: "#f4f4f6",
  surface: "#ffffff",
  ink: "#070709",
  ink2: "#555555",
  ink3: "#a5a29b",
  border: "#e8e8e8",
  cardBg: "#f8f8f8",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Maazul</title>
</head>
<body style="margin:0;padding:0;background-color:${S.bg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${S.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${EMAIL_MAX_WIDTH}" style="max-width:${EMAIL_MAX_WIDTH}px;width:100%;">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailHeader(): string {
  return `<tr>
  <td style="padding:0 0 32px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding:0 0 24px 0;border-bottom:1px solid ${S.border};">
          <span style="font-family:${S.font};font-size:13px;font-weight:500;letter-spacing:0.35em;text-transform:uppercase;color:${S.ink};">MAAZUL</span>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function emailFooter(): string {
  return `<tr>
  <td style="padding:32px 0 0 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding:0 0 16px 0;border-top:1px solid ${S.border};"></td>
      </tr>
      <tr>
        <td style="font-family:${S.font};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${S.ink3};">
          MAAZUL &nbsp;&middot;&nbsp; Portfolio
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0 0 0;font-family:${S.font};font-size:12px;color:${S.ink3};line-height:1.6;">
          This is a transactional email from your portfolio contact form.
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function emailLabel(text: string): string {
  return `font-family:${S.font};font-size:11px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:${S.ink3};padding:0 0 6px 0;`;
}

function emailHeading(text: string): string {
  return `<tr>
  <td style="padding:0 0 8px 0;font-family:${S.font};font-size:22px;font-weight:300;letter-spacing:0.02em;color:${S.ink};line-height:1.3;">
    ${text}
  </td>
</tr>`;
}

function emailSubheading(text: string): string {
  return `<tr>
  <td style="padding:0 0 32px 0;font-family:${S.font};font-size:14px;font-weight:300;color:${S.ink2};line-height:1.7;">
    ${text}
  </td>
</tr>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
  <td style="padding:0 0 16px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="${emailLabel(label)}" width="120" valign="top">${label}</td>
        <td style="font-family:${S.font};font-size:14px;color:${S.ink};line-height:1.6;padding:0;">${value}</td>
      </tr>
    </table>
  </td>
</tr>`;
}

function contentCard(content: string): string {
  return `<tr>
  <td style="padding:0 0 32px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${S.cardBg};border:1px solid ${S.border};">
      <tr>
        <td style="padding:24px;font-family:${S.font};font-size:14px;color:${S.ink};line-height:1.7;white-space:pre-wrap;">
          ${content}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function reviewCard(content: string): string {
  return `<tr>
  <td style="padding:0 0 32px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-left:2px solid ${S.ink};">
      <tr>
        <td style="padding:4px 0 4px 24px;font-family:${S.font};font-size:15px;font-weight:300;color:${S.ink};line-height:1.8;font-style:italic;">
          ${content}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function ctaButton(href: string, label: string): string {
  return `<tr>
  <td style="padding:0 0 32px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background-color:${S.ink};">
          <a href="${href}" target="_blank" style="display:inline-block;font-family:${S.font};font-size:12px;font-weight:500;letter-spacing:0.15em;text-transform:uppercase;color:${S.surface};text-decoration:none;padding:14px 32px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function divider(): string {
  return `<tr><td style="padding:0 0 32px 0;border-bottom:1px solid ${S.border};"></td></tr>`;
}

// ─── Contact Form Emails ─────────────────────────────────────

export async function sendContactNotification(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<EmailResult> {
  if (!ADMIN_EMAIL) {
    return { success: false, error: "ADMIN_EMAIL not configured" };
  }

  const subjectLine = data.subject ? `New Contact Form Submission — ${data.subject}` : "New Contact Form Submission";
  const html = emailWrapper(`
    ${emailHeader()}
    ${emailHeading("New contact form submission")}
    ${emailSubheading("A new message has been received through your portfolio contact form.")}
    ${divider()}
    <tr>
      <td>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${infoRow("Name", escapeHtml(data.name))}
          ${infoRow("Email", `<a href="mailto:${escapeHtml(data.email)}" style="color:${S.ink};text-decoration:none;">${escapeHtml(data.email)}</a>`)}
          ${infoRow("Subject", data.subject ? escapeHtml(data.subject) : "<em>No subject</em>")}
        </table>
      </td>
    </tr>
    ${contentCard(escapeHtml(data.message))}
    ${emailFooter()}
  `);

  const text = `New contact form submission\n\nName: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject || "No subject"}\n\nMessage:\n${data.message}`;

  const result = await sendEmail({
    to: ADMIN_EMAIL,
    subject: subjectLine,
    html,
    text,
    replyTo: data.email,
  });

  if (result.success) console.log("[email] Contact notification sent");
  return result;
}

export async function sendContactAcknowledgement(data: {
  name: string;
  email: string;
  message: string;
}): Promise<EmailResult> {
  const subject = "Thanks for reaching out — Maazul";
  const html = emailWrapper(`
    ${emailHeader()}
    ${emailHeading(`Thanks for reaching out, ${escapeHtml(data.name)}.`)}
    ${emailSubheading("Your message has been received. I will review it and get back to you as soon as possible.")}
    ${divider()}
    <tr>
      <td style="padding:0 0 8px 0;">
        <span style="${emailLabel('Your Message')}">Your Message</span>
      </td>
    </tr>
    ${contentCard(escapeHtml(data.message))}
    ${emailSubheading("I appreciate your interest and will be in touch shortly.")}
    ${emailFooter()}
  `);

  const text = `Hi ${data.name},\n\nThanks for reaching out. Your message has been received. I will review it and get back to you as soon as possible.\n\nYour message:\n${data.message}\n\nI appreciate your interest and will be in touch shortly.\n\nBest,\nMaazul`;

  const result = await sendEmail({ to: data.email, subject, html, text, replyTo: ADMIN_EMAIL });
  if (result.success) console.log("[email] Contact acknowledgement sent");
  return result;
}

// ─── Review Emails ───────────────────────────────────────────

export async function sendReviewThankYou(data: {
  name: string;
  email: string;
}): Promise<EmailResult> {
  const subject = "Thanks for your review — Maazul";
  const html = emailWrapper(`
    ${emailHeader()}
    ${emailHeading(`Thank you, ${escapeHtml(data.name)}.`)}
    ${emailSubheading("Your review has been received and is currently awaiting moderation. Once approved, it will be published on the portfolio.")}
    ${divider()}
    <tr>
      <td style="padding:0 0 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="${emailLabel('Status')}">Status</td>
          </tr>
          <tr>
            <td style="padding:8px 0 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:${S.cardBg};border:1px solid ${S.border};padding:6px 16px;font-family:${S.font};font-size:12px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:${S.ink3};">
                    Awaiting Moderation
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${emailSubheading("I appreciate you taking the time to share your experience. Your feedback means a lot.")}
    ${emailFooter()}
  `);

  const text = `Hi ${data.name},\n\nYour review has been received and is currently awaiting moderation. Once approved, it will be published on the portfolio.\n\nStatus: Awaiting Moderation\n\nI appreciate you taking the time to share your experience. Your feedback means a lot.\n\nBest,\nMaazul`;

  const result = await sendEmail({ to: data.email, subject, html, text, replyTo: ADMIN_EMAIL });
  if (result.success) console.log("[email] Review thank-you sent");
  return result;
}

export async function sendNewReviewNotification(data: {
  name: string;
  email: string;
  designation?: string;
  review: string;
}): Promise<EmailResult> {
  if (!ADMIN_EMAIL) {
    return { success: false, error: "ADMIN_EMAIL not configured" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const dashboardUrl = `${appUrl}/admin/dashboard/reviews`;

  const subject = "New Review Received — Pending Moderation";
  const html = emailWrapper(`
    ${emailHeader()}
    ${emailHeading("New review received")}
    ${emailSubheading("A new review has been submitted and is awaiting moderation.")}
    ${divider()}
    <tr>
      <td>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${infoRow("Name", escapeHtml(data.name))}
          ${infoRow("Email", `<a href="mailto:${escapeHtml(data.email)}" style="color:${S.ink};text-decoration:none;">${escapeHtml(data.email)}</a>`)}
          ${data.designation ? infoRow("Designation", escapeHtml(data.designation)) : ""}
          ${infoRow("Status", `<span style="display:inline-block;background-color:${S.cardBg};border:1px solid ${S.border};padding:3px 12px;font-family:${S.font};font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:${S.ink3};">Pending</span>`)}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 8px 0;">
        <span style="${emailLabel('Review')}">Review</span>
      </td>
    </tr>
    ${reviewCard(escapeHtml(data.review))}
    ${ctaButton(dashboardUrl, "Review & Moderate")}
    ${emailFooter()}
  `);

  const text = `New review received\n\nName: ${data.name}\nEmail: ${data.email}\n${data.designation ? `Designation: ${data.designation}\n` : ""}Status: Pending\n\nReview:\n${data.review}\n\nReview & Moderate: ${dashboardUrl}`;

  const result = await sendEmail({ to: ADMIN_EMAIL, subject, html, text, replyTo: data.email });
  if (result.success) console.log("[email] New review admin notification sent");
  return result;
}
