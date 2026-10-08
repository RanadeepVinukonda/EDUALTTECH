import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";

interface EmailInput {
  to: string;
  subject: string;
  html: string;
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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
    <p style="font-size:12px;color:#94a3b8;margin-top:24px">${footer ?? "EduAltTech — a product by Setsuzoku"}</p>
  </div></body></html>`;
}

/**
 * Sends via Resend REST (no SDK dependency). Failures are logged and swallowed —
 * callers must never let email delivery corrupt a business transaction.
 */
export async function sendEmail(input: EmailInput): Promise<boolean> {
  if (!config.email.resendApiKey) {
    logger.warn("email skipped — RESEND_API_KEY not set", { to: input.to, subject: input.subject });
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.email.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: config.email.from, to: [input.to], subject: input.subject, html: input.html }),
    });
    if (!res.ok) {
      logger.error("email send failed", { status: res.status, subject: input.subject });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("email send error", { subject: input.subject, err: String(err) });
    return false;
  }
}
