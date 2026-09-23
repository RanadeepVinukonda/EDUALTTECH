import type { Request } from "express";

/**
 * Express 5 types route params as `string | string[]` (repeat params).
 * This helper narrows to a plain string for the single-param case.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
