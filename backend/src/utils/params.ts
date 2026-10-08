import { ApiError } from "./ApiError.js";

/** Narrow an Express 5 route param (string | string[]) to a single non-empty string. */
export function param(value: string | string[] | undefined, name: string): string {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || typeof v !== "string" || v.trim() === "") {
    throw ApiError.badRequest(`Missing ${name}`);
  }
  return v;
}
