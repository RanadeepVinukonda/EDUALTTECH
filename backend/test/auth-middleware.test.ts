import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

const { mockPrisma, mockGetUserByToken } = vi.hoisted(() => ({
  mockPrisma: { user: { findUnique: vi.fn() } },
  mockGetUserByToken: vi.fn(),
}));

vi.mock("../src/lib/prisma.js", () => ({ prisma: mockPrisma }));
vi.mock("../src/lib/supabase.js", () => ({ getUserByToken: mockGetUserByToken }));

import { requireAuth, requireRole, requireVerifiedMobile, optionalAuth } from "../src/middlewares/auth.js";

const res = {} as Response;
const next = () => vi.fn() as unknown as NextFunction & ReturnType<typeof vi.fn>;
const reqWith = (authorization?: string) => ({ headers: { authorization } } as unknown as Request);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth", () => {
  it("rejects a missing bearer token with 401", async () => {
    const n = next();
    await requireAuth(reqWith(), res, n);
    expect(n).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("rejects an invalid token (provider lookup returns nothing)", async () => {
    mockGetUserByToken.mockResolvedValue(null);
    const n = next();
    await requireAuth(reqWith("Bearer bad"), res, n);
    expect(n).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("rejects an inactive account even with a valid token", async () => {
    mockGetUserByToken.mockResolvedValue({ id: "u1" });
    mockPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.c", role: "USER", isActive: false });
    const n = next();
    await requireAuth(reqWith("Bearer good"), res, n);
    expect(n).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("attaches the user and continues for a valid, active account", async () => {
    mockGetUserByToken.mockResolvedValue({ id: "u1" });
    mockPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.c", role: "USER", isActive: true });
    const req = reqWith("Bearer good");
    const n = next();
    await requireAuth(req, res, n);
    expect(n).toHaveBeenCalledWith();
    expect((req as { user?: unknown }).user).toMatchObject({ id: "u1", role: "USER" });
  });

  it("never trusts a client-supplied role — role comes from the DB row", async () => {
    mockGetUserByToken.mockResolvedValue({ id: "u1" });
    mockPrisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.c", role: "USER", isActive: true });
    const req = reqWith("Bearer good") as Request & { user?: { role: string } };
    await requireAuth(req, res, next());
    expect(req.user?.role).toBe("USER");
  });
});

describe("requireRole", () => {
  it("401s when unauthenticated", () => {
    const n = next();
    requireRole("ADMIN")({} as Request, res, n);
    expect(n).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("403s when the role does not match", () => {
    const n = next();
    requireRole("ADMIN")({ user: { id: "u1", role: "USER" } } as unknown as Request, res, n);
    expect(n).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it("continues when the role matches", () => {
    const n = next();
    requireRole("ADMIN")({ user: { id: "u1", role: "ADMIN" } } as unknown as Request, res, n);
    expect(n).toHaveBeenCalledWith();
  });
});

describe("optionalAuth", () => {
  it("never rejects an anonymous visitor", async () => {
    const n = next();
    await optionalAuth(reqWith(), res, n);
    expect(n).toHaveBeenCalledWith();
  });

  it("swallows a provider failure and still continues", async () => {
    mockGetUserByToken.mockRejectedValue(new Error("provider down"));
    const n = next();
    await optionalAuth(reqWith("Bearer x"), res, n);
    expect(n).toHaveBeenCalledWith();
  });
});

describe("requireVerifiedMobile", () => {
  it("403s with MOBILE_VERIFICATION_REQUIRED when unverified", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ mobileVerifiedAt: null });
    const n = next();
    await requireVerifiedMobile({ user: { id: "u1" } } as unknown as Request, res, n);
    expect(n).toHaveBeenCalledWith(expect.objectContaining({ status: 403, code: "MOBILE_VERIFICATION_REQUIRED" }));
  });

  it("continues when verified", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ mobileVerifiedAt: new Date() });
    const n = next();
    await requireVerifiedMobile({ user: { id: "u1" } } as unknown as Request, res, n);
    expect(n).toHaveBeenCalledWith();
  });
});
