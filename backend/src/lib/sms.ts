import { config } from "../config/env.js";

const VERIFY_BASE = "https://verify.twilio.com/v2/Services";

export const smsEnabled = (): boolean =>
  Boolean(config.sms.accountSid && config.sms.authToken && config.sms.verifyServiceSid);

async function twilioRequest(
  path: `/${string}`,
  body: Record<string, string>,
): Promise<{ valid?: boolean; status?: string; message?: string }> {
  const res = await fetch(`${VERIFY_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.sms.accountSid}:${config.sms.authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  const json = (await res.json().catch(() => null)) as {
    valid?: boolean;
    status?: string;
    message?: string;
  } | null;
  if (!res.ok || json === null) {
    throw new Error(json?.message ?? `Twilio Verify error (${res.status})`);
  }
  return json;
}

/** Kick off an SMS OTP to a phone number (E.164). */
export async function sendSmsVerification(phone: string): Promise<void> {
  validateEnabled();
  await twilioRequest(`/${config.sms.verifyServiceSid}/Verifications`, {
    To: phone,
    Channel: "sms",
    Locale: "en",
  });
}

/** Validate the OTP the user typed. Returns true when approved. */
export async function checkSmsVerification(phone: string, code: string): Promise<boolean> {
  validateEnabled();
  const result = await twilioRequest(`/${config.sms.verifyServiceSid}/VerificationCheck`, {
    To: phone,
    Code: code,
  });
  return result.valid === true || result.status === "approved";
}

function validateEnabled(): void {
  if (!smsEnabled()) {
    throw new Error("SMS delivery is not configured (TWILIO_* env vars missing)");
  }
}