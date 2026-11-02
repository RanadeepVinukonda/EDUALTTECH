import { randomUUID } from "node:crypto";
import { config } from "../config/env.js";
import { supabaseAdmin } from "./supabase.js";
import { ApiError } from "../utils/ApiError.js";

const EXT_OK = /\.(pdf|png|jpe?g|webp|gif|svg|docx?|pptx?|xlsx?|txt|zip|mp4|webm|csv)$/i;

// Server-side extension → MIME map. The declared client content type is never
// trusted; stored objects always get the type derived from the validated name.
const EXT_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".zip": "application/zip",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export function contentTypeFor(name: string): string {
  return EXT_MIME[fileExt(name)] ?? "application/octet-stream";
}

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

// Public-facing images (avatars, CMS media). SVG is deliberately excluded:
// it can carry script and these objects are served inline from the CDN.
const PUBLIC_IMAGE_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function isPng(bytes: Buffer): boolean {
  return bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
}

function isJpeg(bytes: Buffer): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isGif(bytes: Buffer): boolean {
  const header = bytes.subarray(0, 6).toString("ascii");
  return header === "GIF87a" || header === "GIF89a";
}

function isWebp(bytes: Buffer): boolean {
  return bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP";
}

/**
 * Validates a raster image before it is written to the public bucket. The
 * declared client MIME type is ignored; both extension and magic bytes must
 * agree, so an HTML/SVG payload renamed to .png is rejected.
 */
export function assertPublicImage(name: string, bytes: Buffer): void {
  const ext = fileExt(name);
  const expected = PUBLIC_IMAGE_MIME[ext];
  if (!expected) throw ApiError.badRequest("Only PNG, JPEG, WebP, or GIF images are allowed");
  if (bytes.length === 0) throw ApiError.badRequest("Uploaded file is empty");
  if (bytes.length > config.limits.maxUploadBytes) {
    throw ApiError.badRequest(`File exceeds ${Math.round(config.limits.maxUploadBytes / 1024 / 1024)}MB limit`);
  }
  const matches =
    ext === ".png" ? isPng(bytes) :
    ext === ".gif" ? isGif(bytes) :
    ext === ".webp" ? isWebp(bytes) :
    isJpeg(bytes);
  if (!matches) throw ApiError.badRequest("Image content does not match its file extension");
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

/** Removes a public object from the URL returned by uploadPublic. */
export async function removePublic(url: string): Promise<void> {
  const marker = `/storage/v1/object/public/${config.supabase.publicBucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;
  const key = url.slice(index + marker.length);
  await supabaseAdmin().storage.from(config.supabase.publicBucket).remove([key]).catch(() => undefined);
}
