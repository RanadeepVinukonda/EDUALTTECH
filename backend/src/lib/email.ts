import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";

interface EmailInput {
  to: string;
  subject: string;
  html: string;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeSubject(s: string): string {
  // Strip control characters and collapse whitespace to prevent header injection.
  return s.replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
}

const escape = escapeHtml;

export function layout(title: string, intro: string, ctaLabel?: string, ctaUrl?: string, footer?: string): string {
  const button = ctaLabel && ctaUrl
    ? `<p style="margin:24px 0"><a href="${escape(ctaUrl)}" style="background:#038c3e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:600;display:inline-block">${escape(ctaLabel)}</a></p>`
    : "";
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:32px">
    <p style="font-weight:700;color:#038c3e;font-size:18px;margin:0 0 4px">EduAltTech</p>
    <h1 style="font-size:20px;margin:8px 0 12px">${escape(title)}</h1>
    <p style="line-height:1.6;color:#334155;margin:0">${intro}</p>
    ${button}
    <p style="font-size:12px;color:#94a3b8;margin-top:24px">${escape(footer ?? "EduAltTech - a product by Setsuzoku")}</p>
  </div></body></html>`;
}

let warnedTestSender = false;

/**
 * Sends via Resend REST (no SDK dependency). Failures are logged and swallowed -
 * callers must never let email delivery corrupt a business transaction.
 */
export async function sendEmail(input: EmailInput): Promise<boolean> {
  const subject = escapeSubject(input.subject);
  if (!config.email.resendApiKey) {
    logger.warn("email skipped - RESEND_API_KEY not set", { to: input.to, subject });
    return false;
  }
  if (!warnedTestSender && config.email.from.includes("onboarding@resend.dev")) {
    warnedTestSender = true;
    logger.warn(
      "email is using the Resend test sender (onboarding@resend.dev) - it can only deliver to the Resend account owner's address. Verify a domain and set EMAIL_FROM to an address on it.",
      { from: config.email.from },
    );
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.email.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: config.email.from, to: [input.to], subject, html: input.html }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      logger.error("email send failed", { status: res.status, subject, to: input.to, detail: detail.slice(0, 500) });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("email send error", { subject, err: String(err) });
    return false;
  }
}

/**
 * Sends a fan-out with a bounded number of concurrent provider calls. A course
 * with thousands of learners must not open thousands of sockets at once.
 */
export async function sendEmailBatch(inputs: EmailInput[], concurrency = 5): Promise<number> {
  if (inputs.length === 0) return 0;
  const workers = Math.min(Math.max(1, concurrency), inputs.length);
  let next = 0;
  let sent = 0;

  await Promise.all(
    Array.from({ length: workers }, async () => {
      for (;;) {
        const index = next++;
        const input = inputs[index];
        if (!input) return;
        if (await sendEmail(input)) sent += 1;
      }
    }),
  );

  return sent;
}
