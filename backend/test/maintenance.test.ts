import { describe, it, expect, vi } from "vitest";
import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const { RAW_TOKEN } = vi.hoisted(() => ({ RAW_TOKEN: "secret-token" }));

vi.mock("../src/config/env.js", async () => {
  const { createHash } = await import("node:crypto");
  return {
    config: {
      maintenance: {
        enabled: true,
        tokenHash: createHash("sha256").update("secret-token").digest("hex"),
      },
    },
  };
});

import { maintenanceGate } from "../src/middlewares/maintenance.js";

const tokenHex = () => createHash("sha256").update(RAW_TOKEN).digest("hex");

const next = () => vi.fn() as unknown as NextFunction & ReturnType<typeof vi.fn>;
const res = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response);
const req = (path: string, method = "GET", token?: string) =>
  ({
    method,
    path,
    header: (name: string) => (name === "x-maintenance-token" ? token : undefined),
  } as unknown as Request);

describe("maintenanceGate", () => {
  it("blocks ordinary API traffic while locked", () => {
    const r = res();
    const n = next();
    maintenanceGate(req("/api/courses"), r, n);
    expect(n).not.toHaveBeenCalled();
    expect((r as unknown as { status: ReturnType<typeof vi.fn> }).status).toHaveBeenCalledWith(503);
  });

  it("allows CORS preflight and health probes", () => {
    const nOpts = next();
    maintenanceGate(req("/api/courses", "OPTIONS"), res(), nOpts);
    expect(nOpts).toHaveBeenCalledWith();

    const nHealth = next();
    maintenanceGate(req("/health"), res(), nHealth);
    expect(nHealth).toHaveBeenCalledWith();
  });

  it("lets signed provider webhooks through during maintenance", () => {
    const n = next();
    maintenanceGate(req("/api/payments/webhook", "POST"), res(), n);
    expect(n).toHaveBeenCalledWith();
  });

  it("allows a request carrying the correct token hash", () => {
    const n = next();
    maintenanceGate(req("/api/courses", "GET", tokenHex()), res(), n);
    expect(n).toHaveBeenCalledWith();
  });

  it("rejects a wrong token", () => {
    const r = res();
    const n = next();
    maintenanceGate(req("/api/courses", "GET", "deadbeef"), r, n);
    expect((r as unknown as { status: ReturnType<typeof vi.fn> }).status).toHaveBeenCalledWith(503);
  });
});
