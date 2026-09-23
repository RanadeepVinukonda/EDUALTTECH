import { ApiError } from "../utils/ApiError.js";
import { config } from "../config/env.js";
import { randomUUID } from "node:crypto";

function storageHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    authorization: `Bearer ${config.supabase.serviceRoleKey}`,
    apikey: config.supabase.serviceRoleKey,
    ...extra,
  };
}

function requireStorage(): void {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw ApiError.unavailable("Storage not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
}

export async function uploadFile(bucket: string, path: string, data: Uint8Array, contentType: string): Promise<void> {
  requireStorage();
  const res = await fetch(`${config.supabase.url}/storage/v1/object/${encodeURIComponent(bucket)}/${path}`, {
    method: "PUT",
    headers: storageHeaders({
      "Content-Type": contentType,
      "x-upsert": "false",
    }),
    body: data,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "no detail");
    throw ApiError.badGateway(`Storage upload failed (${res.status}) — ${detail}`);
  }
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  requireStorage();
  const res = await fetch(`${config.supabase.url}/storage/v1/object/${encodeURIComponent(bucket)}/${path}`, {
    method: "DELETE",
    headers: storageHeaders(),
  });
  if (!res.ok && res.status !== 400) {
    const detail = await res.text().catch(() => "no detail");
    throw ApiError.badGateway(`Storage delete failed (${res.status}) — ${detail}`);
  }
}

export function publicFileUrl(bucket: string, path: string): string {
  return `${config.supabase.url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path}`;
}

export function storageKey(userId: string, fileName: string, mimeType: string): string {
  const ext = mimeType.split("/")[1] === "plain" ? "txt" : (mimeType.split("/")[1] ?? "bin");
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return `${userId}/${randomUUID()}-${safe}`;
}