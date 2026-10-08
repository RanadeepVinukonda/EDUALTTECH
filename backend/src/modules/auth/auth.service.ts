import { createHash, randomInt } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { config } from "../../config/env.js";
import { sendEmail, layout } from "../../lib/email.js";
import { ApiError } from "../../utils/ApiError.js";

const CODE_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
export const DEV_CODE = "000000";

const hash = (identifier: string, code: string) =>
  createHash("sha256").update(`${identifier.toLowerCase()}:${code}`).digest("hex");

async function issueCode(identifier: string): Promise<{ devCode?: string }> {
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60_000);

  if (config.auth.skipOtp) {
    // Bypass mode: pre-verified dev row, code 000000.
    await prisma.verificationCode.deleteMany({ where: { channel: "email", identifier } });
    await prisma.verificationCode.create({
      data: { channel: "email", identifier, codeHash: hash(identifier, DEV_CODE), expiresAt, verifiedAt: new Date() },
    });
    return { devCode: DEV_CODE };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.verificationCode.deleteMany({ where: { channel: "email", identifier } });
  await prisma.verificationCode.create({
    data: { channel: "email", identifier, codeHash: hash(identifier, code), expiresAt },
  });
  await sendEmail({
    to: identifier,
    subject: `${code} is your EduAltTech verification code`,
    html: layout(
      "Verify your email",
      `Your verification code is <strong style="font-size:24px;letter-spacing:6px">${code}</strong>. It expires in ${CODE_TTL_MIN} minutes.`,
    ),
  });
  return {};
}

/**
 * Issues an email code. Always resolves successfully for unknown/known
 * addresses alike — no email-enumeration oracle (spec §6).
 */
export async function sendEmailCode(email: string): Promise<{ ok: true; devCode?: string }> {
  const out = await issueCode(email.toLowerCase().trim());
  return { ok: true, ...out };
}

export async function verifyEmailCode(email: string, code: string): Promise<{ ok: true; devCode?: string }> {
  const identifier = email.toLowerCase().trim();

  if (config.auth.skipOtp && code === DEV_CODE) {
    const row = await prisma.verificationCode.findFirst({
      where: { channel: "email", identifier, verifiedAt: { not: null } },
    });
    if (row) return { ok: true, devCode: DEV_CODE };
    // Row missing (server restarted) — recreate a verified dev row.
    await prisma.verificationCode.deleteMany({ where: { channel: "email", identifier } });
    await prisma.verificationCode.create({
      data: {
        channel: "email",
        identifier,
        codeHash: hash(identifier, DEV_CODE),
        expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60_000),
        verifiedAt: new Date(),
      },
    });
    return { ok: true, devCode: DEV_CODE };
  }

  const row = await prisma.verificationCode.findFirst({
    where: { channel: "email", identifier },
    orderBy: { createdAt: "desc" },
  });
  if (!row) throw ApiError.badRequest("No active code for that email. Request a new one.");
  if (row.verifiedAt) return { ok: true };
  if (row.expiresAt < new Date()) {
    await prisma.verificationCode.delete({ where: { id: row.id } }).catch(() => undefined);
    throw ApiError.badRequest("That code has expired. Request a new one.");
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    await prisma.verificationCode.delete({ where: { id: row.id } }).catch(() => undefined);
    throw ApiError.tooMany("Too many wrong attempts. Request a new code.");
  }

  const match = row.codeHash === hash(identifier, code);
  if (!match) {
    await prisma.verificationCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    throw ApiError.badRequest("Incorrect code.");
  }

  await prisma.verificationCode.update({ where: { id: row.id }, data: { verifiedAt: new Date() } });
  return { ok: true };
}

/** True when a recently-verified row exists — register requires this before creating the account. */
export async function hasVerifiedCode(email: string): Promise<boolean> {
  const identifier = email.toLowerCase().trim();
  const row = await prisma.verificationCode.findFirst({
    where: { channel: "email", identifier, verifiedAt: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return config.auth.skipOtp;
  return row.expiresAt >= new Date() || config.auth.skipOtp;
}

export async function consumeCodes(email: string): Promise<void> {
  await prisma.verificationCode.deleteMany({ where: { channel: "email", identifier: email.toLowerCase().trim() } });
}
