import { config } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/** Send an email through Resend. Throws a clear error if the service is unconfigured. */
export async function sendEmail(opts: { to: string; subject: string; text: string }): Promise<void> {
  const apiKey = config.email.resendApiKey;
  if (!apiKey || !config.email.from) {
    throw ApiError.unavailable("Email service is not configured (RESEND_API_KEY / EMAIL_FROM)");
  }
  if (!opts.to.includes("@")) return; // guard, never send to junk

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.email.from,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
    }),
  });
  if (!res.ok) {
    throw ApiError.badGateway(`Email provider rejected the request (${res.status})`);
  }
}

interface ApplicationMail {
  to: string;
  name: string;
  courseTitle?: string;
  note: string;
}

export function applicationStatusEmail(app: ApplicationMail, subject: string) {
  const courseLine = app.courseTitle ? `\nCourse: ${app.courseTitle}\n` : "";
  return sendEmail({
    to: app.to,
    subject,
    text: [
      `Hi ${app.name},`,
      "",
      courseLine,
      noteBody(app.note),
      "",
      "— The Edu-Alt-Tech team",
    ].join("\n"),
  });
}

function noteBody(note: string) {
  return note || "No additional notes were left.";
}

export function otpEmail(to: string, otp: string): Promise<void> {
  return sendEmail({
    to,
    subject: "Your Edu-Alt-Tech verification code",
    text: `Your phone verification code is ${otp}. It expires in 10 minutes.\n\n— The Edu-Alt-Tech team`,
  });
}

export function emailCodeEmail(to: string, code: string): Promise<void> {
  return sendEmail({
    to,
    subject: "Your Edu-Alt-Tech email verification code",
    text: `Your email verification code is ${code}. It expires in 10 minutes.\n\n— The Edu-Alt-Tech team`,
  });
}