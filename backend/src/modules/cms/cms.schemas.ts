import { z } from "zod";

export const slugSchema = (name: string) =>
  z
    .string()
    .trim()
    .min(2, `${name} slug must be at least 2 characters`)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use only lowercase letters, numbers and hyphens");

export const organizationSchema = z.object({
  slug: slugSchema("Organization"),
  name: z.string().trim().min(2).max(120),
  type: z.enum(["SCHOOL", "PARTNER", "FRANCHISE", "NGO", "OTHER"]).default("SCHOOL"),
  summary: z.string().trim().max(300).optional(),
  description: z.string().trim().max(3000).optional(),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  isPublished: z.boolean().default(false),
});

export const organizationPatchSchema = organizationSchema.partial();

export const workItemSchema = z.object({
  slug: slugSchema("Work item"),
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(10).max(400),
  body: z.string().trim().max(6000).optional(),
  category: z.string().trim().max(60).default("Digital Solution"),
  coverUrl: z.string().url().optional(),
  mediaIds: z.array(z.string()).max(20).default([]),
  organizationId: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const workItemPatchSchema = workItemSchema.partial();

export const programSchema = z.object({
  slug: slugSchema("Program"),
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(10).max(400),
  body: z.string().trim().max(6000).optional(),
  pricePaise: z.number().int().min(0).optional(),
  currency: z.string().trim().max(3).default("INR"),
  coverUrl: z.string().url().optional(),
  organizationId: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const programPatchSchema = programSchema.partial();

export const mediaAssetSchema = z.object({
  url: z.string().url(),
  alt: z.string().trim().max(200).optional(),
  kind: z.enum(["image", "video", "logo", "screenshot"]).default("image"),
  category: z.string().trim().max(40).optional(),
  position: z.string().trim().max(40).optional(),
  width: z.number().int().min(0).optional(),
  height: z.number().int().min(0).optional(),
});

export const conversationSendSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

// Pagination friendly: page/pageSize for admin tables.
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});