import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit } from "../../lib/audit.js";

const router = Router();

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

// ── Public reads (anonymous visitors) ──────────────────────────────

router.get("/public/media", validate({ query: z.object({
  category: z.string().trim().max(60).optional(),
  kind: z.string().trim().max(30).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}) }), async (req, res) => {
  const { category, kind, limit } = req.query as unknown as { category?: string; kind?: string; limit: number };
  const assets = await prisma.mediaAsset.findMany({
    where: { ...(category ? { category } : {}), ...(kind ? { kind } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  res.json({ success: true, data: { assets } });
});

router.get("/public/work", validate({ query: z.object({
  category: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
}) }), async (req, res) => {
  const { category, limit } = req.query as unknown as { category?: string; limit: number };
  const items = await prisma.workItem.findMany({
    where: { isPublished: true, ...(category ? { category } : {}) },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { organization: { select: { id: true, slug: true, name: true, logoUrl: true } } },
  });
  res.json({ success: true, data: { items } });
});

router.get("/public/organizations", async (_req, res) => {
  const items = await prisma.organization.findMany({
    where: { isPublished: true },
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, type: true, summary: true, logoUrl: true, websiteUrl: true },
  });
  res.json({ success: true, data: { items } });
});

router.get("/public/programs", async (_req, res) => {
  const items = await prisma.program.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: { organization: { select: { id: true, slug: true, name: true, logoUrl: true } } },
  });
  res.json({ success: true, data: { items } });
});

router.get("/public/team", async (_req, res) => {
  const items = await prisma.teamMember.findMany({
    where: { isPublished: true },
    orderBy: { order: "asc" },
  });
  res.json({ success: true, data: { items } });
});

// ── Admin CRUD ─────────────────────────────────────────────────────

const admin = Router();
admin.use(requireAuth, requireRole("ADMIN"));

admin.get("/media", async (_req, res) => {
  const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: { assets } });
});

admin.post("/media", validate({ body: z.object({
  url: z.string().url(),
  kind: z.string().trim().max(30).default("image"),
  alt: z.string().trim().max(300).nullable().optional(),
  category: z.string().trim().max(60).nullable().optional(),
  position: z.string().trim().max(60).nullable().optional(),
}) }), async (req, res) => {
  const asset = await prisma.mediaAsset.create({ data: body<Record<string, unknown>>(req) as never });
  audit(req.user!.id, "media.created", "mediaAsset", asset.id);
  res.status(201).json({ success: true, data: { asset } });
});

admin.patch("/media/:id", validate({ body: z.object({
  url: z.string().url().optional(),
  alt: z.string().trim().max(300).nullable().optional(),
  category: z.string().trim().max(60).nullable().optional(),
  position: z.string().trim().max(60).nullable().optional(),
}) }), async (req, res) => {
  const asset = await prisma.mediaAsset.update({ where: { id: req.params.id }, data: body<Record<string, unknown>>(req) as never });
  res.json({ success: true, data: { asset } });
});

admin.delete("/media/:id", async (req, res) => {
  await prisma.mediaAsset.delete({ where: { id: req.params.id } });
  audit(req.user!.id, "media.deleted", "mediaAsset", req.params.id);
  res.json({ success: true, data: { ok: true } });
});

const workBody = z.object({
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(2).max(600),
  body: z.string().trim().max(20_000).nullable().optional(),
  category: z.string().trim().max(80).default("Digital Solution"),
  coverUrl: z.string().url().nullable().optional(),
  mediaIds: z.array(z.string()).max(30).optional(),
  organizationId: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
});

admin.get("/work", async (_req, res) => {
  const items = await prisma.workItem.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: { organization: { select: { id: true, slug: true, name: true } } },
  });
  res.json({ success: true, data: { items } });
});

admin.post("/work", validate({ body: workBody }), async (req, res) => {
  const input = body<z.infer<typeof workBody>>(req);
  const isPublished = input.isPublished ?? false;
  const item = await prisma.workItem.create({
    data: {
      ...input,
      mediaIds: input.mediaIds ?? [],
      slug: slugify(input.title),
      publishedAt: isPublished ? new Date() : null,
    },
  });
  audit(req.user!.id, "work.created", "workItem", item.id);
  res.status(201).json({ success: true, data: { item } });
});

admin.patch("/work/:id", validate({ body: workBody.partial() }), async (req, res) => {
  const existing = await prisma.workItem.findUnique({ where: { id: req.params.id }, select: { isPublished: true, title: true } });
  if (!existing) throw ApiError.notFound("Work item not found");
  const input = body<Partial<z.infer<typeof workBody>>>(req);

  const item = await prisma.workItem.update({
    where: { id: req.params.id },
    data: {
      ...input,
      ...(input.mediaIds ? { mediaIds: input.mediaIds } : {}),
      ...(input.title && input.title !== existing.title ? { slug: slugify(input.title) } : {}),
      ...(input.isPublished !== undefined && input.isPublished !== existing.isPublished
        ? { publishedAt: input.isPublished ? new Date() : null }
        : {}),
    },
  });
  res.json({ success: true, data: { item } });
});

admin.delete("/work/:id", async (req, res) => {
  await prisma.workItem.delete({ where: { id: req.params.id } });
  audit(req.user!.id, "work.deleted", "workItem", req.params.id);
  res.json({ success: true, data: { ok: true } });
});

const orgBody = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.enum(["SCHOOL", "PARTNER", "FRANCHISE", "NGO", "OTHER"]).default("PARTNER"),
  summary: z.string().trim().max(600).nullable().optional(),
  description: z.string().trim().max(10_000).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  contactEmail: z.string().trim().email().nullable().optional(),
  isPublished: z.boolean().optional(),
});

admin.get("/organizations", async (_req, res) => {
  const items = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { members: true, workItems: true, programs: true } } },
  });
  res.json({ success: true, data: { items } });
});

admin.post("/organizations", validate({ body: orgBody }), async (req, res) => {
  const input = body<z.infer<typeof orgBody>>(req);
  let slug = slugify(input.name);
  if (await prisma.organization.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const org = await prisma.organization.create({ data: { ...input, slug } });
  audit(req.user!.id, "org.created", "organization", org.id);
  res.status(201).json({ success: true, data: { organization: org } });
});

admin.patch("/organizations/:id", validate({ body: orgBody.partial() }), async (req, res) => {
  const org = await prisma.organization.update({ where: { id: req.params.id }, data: body<Record<string, unknown>>(req) as never });
  res.json({ success: true, data: { organization: org } });
});

admin.delete("/organizations/:id", async (req, res) => {
  await prisma.organization.delete({ where: { id: req.params.id } });
  audit(req.user!.id, "org.deleted", "organization", req.params.id);
  res.json({ success: true, data: { ok: true } });
});

const programBody = z.object({
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(2).max(600),
  body: z.string().trim().max(20_000).nullable().optional(),
  pricePaise: z.number().int().min(0).nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  organizationId: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
});

admin.get("/programs", async (_req, res) => {
  const items = await prisma.program.findMany({
    orderBy: { createdAt: "desc" },
    include: { organization: { select: { id: true, slug: true, name: true } } },
  });
  res.json({ success: true, data: { items } });
});

admin.post("/programs", validate({ body: programBody }), async (req, res) => {
  const input = body<z.infer<typeof programBody>>(req);
  let slug = slugify(input.title);
  if (await prisma.program.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const item = await prisma.program.create({ data: { ...input, slug } });
  audit(req.user!.id, "program.created", "program", item.id);
  res.status(201).json({ success: true, data: { item } });
});

admin.patch("/programs/:id", validate({ body: programBody.partial() }), async (req, res) => {
  const input = body<Partial<z.infer<typeof programBody>>>(req);
  const existing = await prisma.program.findUnique({ where: { id: req.params.id }, select: { title: true } });
  if (!existing) throw ApiError.notFound("Program not found");
  const item = await prisma.program.update({
    where: { id: req.params.id },
    data: { ...input, ...(input.title && input.title !== existing.title ? { slug: slugify(input.title) } : {}) },
  });
  res.json({ success: true, data: { item } });
});

admin.delete("/programs/:id", async (req, res) => {
  await prisma.program.delete({ where: { id: req.params.id } });
  audit(req.user!.id, "program.deleted", "program", req.params.id);
  res.json({ success: true, data: { ok: true } });
});

const teamBody = z.object({
  name: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(2000).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

admin.get("/team", async (_req, res) => {
  const items = await prisma.teamMember.findMany({ orderBy: { order: "asc" } });
  res.json({ success: true, data: { items } });
});

admin.post("/team", validate({ body: teamBody }), async (req, res) => {
  const input = body<z.infer<typeof teamBody>>(req);
  const count = await prisma.teamMember.count();
  const item = await prisma.teamMember.create({ data: { ...input, order: input.order ?? count } });
  audit(req.user!.id, "team.created", "teamMember", item.id);
  res.status(201).json({ success: true, data: { item } });
});

admin.patch("/team/:id", validate({ body: teamBody.partial() }), async (req, res) => {
  const item = await prisma.teamMember.update({ where: { id: req.params.id }, data: body<Record<string, unknown>>(req) as never });
  res.json({ success: true, data: { item } });
});

admin.delete("/team/:id", async (req, res) => {
  await prisma.teamMember.delete({ where: { id: req.params.id } });
  audit(req.user!.id, "team.deleted", "teamMember", req.params.id);
  res.json({ success: true, data: { ok: true } });
});

router.use("/admin", admin);
export default router;
