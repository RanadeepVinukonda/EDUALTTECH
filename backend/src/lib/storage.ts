import { randomUUID } from "node:crypto";
import { config } from "../config/env.js";
import { supabaseAdmin } from "./supabase.js";
import { ApiError } from "../utils/ApiError.js";

const EXT_OK = /\.(pdf|png|jpe?g|webp|gif|svg|docx?|pptx?|xlsx?|txt|zip|mp4|webm|csv)$/i;

export function sanitizeFileName(name: string): string {
  const base = name.replace(/[/\\]/g, "_").replace(/[^\w.\- ]+/g, "").trim();
  return base.slice(-80) || "file";
}

export function fileExt(name: string): string {
  const m = EXT_OK.exec(name);
  return m ? m[0].toLowerCase() : "";
}

export function assertUploadable(name: string, sizeBytes: number): void {
  if (!fileExt(name)) throw ApiError.badRequest("File type not allowed");
  if (sizeBytes > config.limits.maxUploadBytes) {
    throw ApiError.badRequest(`File exceeds ${Math.round(config.limits.maxUploadBytes / 1024 / 1024)}MB limit`);
  }
}

/** Random object key inside a bucket. Destination is server-chosen, never client-controlled. */
export function objectKey(prefix: string, name: string): string {
  return `${prefix}/${randomUUID()}-${sanitizeFileName(name)}`;
}

export async function uploadPrivate(prefix: string, name: string, bytes: Buffer, contentType: string): Promise<string> {
  const key = objectKey(prefix, name);
  const { error } = await supabaseAdmin()
    .storage.from(config.supabase.privateBucket)
    .upload(key, bytes, { contentType, upsert: false });
  if (error) throw ApiError.badRequest(`Upload failed: ${error.message}`);
  return key;
}

export async function uploadPublic(prefix: string, name: string, bytes: Buffer, contentType: string): Promise<string> {
  const key = objectKey(prefix, name);
  const { error } = await supabaseAdmin()
    .storage.from(config.supabase.publicBucket)
    .upload(key, bytes, { contentType, upsert: false });
  if (error) throw ApiError.badRequest(`Upload failed: ${error.message}`);
  return `${config.supabase.url}/storage/v1/object/public/${config.supabase.publicBucket}/${key}`;
}

/** Short-lived signed URL for a private object. Private paths never become public URLs. */
export async function signedUrl(key: string, expiresInSec = 3600): Promise<string> {
  const { data, error } = await supabaseAdmin()
    .storage.from(config.supabase.privateBucket)
    .createSignedUrl(key, expiresInSec);
  if (error || !data) throw ApiError.notFound("File not available");
  return data.signedUrl;
}

export async function removePrivate(key: string): Promise<void> {
  await supabaseAdmin().storage.from(config.supabase.privateBucket).remove([key]).catch(() => undefined);
}
