import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  organizationSchema,
  organizationPatchSchema,
  workItemSchema,
  workItemPatchSchema,
  programSchema,
  programPatchSchema,
  mediaAssetSchema,
  conversationSendSchema,
} from "./cms.schemas.js";

export async function listPublished(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const kind = req.params.kind as string;
    if (kind === "work") {
      const items = await prisma.workItem.findMany({
        where: { isPublished: true, publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
        include: { organization: { select: { name: true, slug: true } } },
      });
      res.json({ success: true, data: { items } });
      return;
    }
    if (kind === "programs") {
      const items = await prisma.program.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        include: { organization: { select: { name: true, slug: true } } },
      });
      res.json({ success: true, data: { items } });
      return;
    }
    if (kind === "organizations") {
      const items = await prisma.organization.findMany({
        where: { isPublished: true },
        orderBy: { name: "asc" },
      });
      res.json({ success: true, data: { items } });
      return;
    }
    throw ApiError.notFound("Unknown collection");
  } catch (err) {
    next(err);
  }
}

export async function getPublished(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const kind = req.params.kind as string;
    const slug = req.params.slug as string;
    let item: unknown = null;
    if (kind === "work") {
      item = await prisma.workItem.findFirst({
        where: { slug, isPublished: true },
        include: { organization: { select: { name: true, slug: true } } },
      });
    } else if (kind === "programs") {
      item = await prisma.program.findFirst({
        where: { slug, isPublished: true },
        include: { organization: { select: { name: true, slug: true } } },
      });
    } else if (kind === "organizations") {
      item = await prisma.organization.findFirst({
        where: { slug, isPublished: true },
        include: {
          workItems: {
            where: { isPublished: true, publishedAt: { not: null } },
            orderBy: { publishedAt: "desc" },
            select: { id: true, slug: true, title: true, summary: true, category: true, coverUrl: true, publishedAt: true },
          },
          programs: {
            where: { isPublished: true },
            orderBy: { createdAt: "desc" },
            select: { id: true, slug: true, title: true, summary: true, pricePaise: true, currency: true, coverUrl: true },
          },
        },
      });
    }
    if (!item) throw ApiError.notFound("Not found");
    res.json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
}

// Public media: logos drive the homepage marquee, photos fill homepage slots.
export async function listMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { kind, category } = req.query as { kind?: string; category?: string };
    const items = await prisma.mediaAsset.findMany({
      where: {
        ...(kind ? { kind } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, alt: true, url: true, kind: true, category: true, position: true },
    });
    res.json({ success: true, data: { items } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────── Admin CRUD ───────────────────────────

export async function adminList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const kind = req.params.kind as string;
    if (kind === "organizations") {
      res.json({ success: true, data: { items: await prisma.organization.findMany({ orderBy: { createdAt: "desc" } }) } });
    } else if (kind === "work") {
      res.json({ success: true, data: { items: await prisma.workItem.findMany({ orderBy: { createdAt: "desc" }, include: { organization: { select: { name: true } } } }) } });
    } else if (kind === "programs") {
      res.json({ success: true, data: { items: await prisma.program.findMany({ orderBy: { createdAt: "desc" }, include: { organization: { select: { name: true } } } }) } });
    } else if (kind === "media") {
      res.json({ success: true, data: { items: await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" } }) } });
    } else {
      throw ApiError.notFound("Unknown collection");
    }
  } catch (err) {
    next(err);
  }
}

export async function adminCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const kind = req.params.kind as string;

    let item: unknown;
    if (kind === "organizations") {
      const c = organizationSchema.parse(req.body);
      item = await prisma.organization.create({ data: c });
    } else if (kind === "work") {
      const c = workItemSchema.parse(req.body);
      item = await prisma.workItem.create({
        data: { ...c, publishedAt: c.isPublished ? new Date() : null },
      });
    } else if (kind === "programs") {
      const c = programSchema.parse(req.body);
      item = await prisma.program.create({ data: c });
    } else if (kind === "media") {
      const c = mediaAssetSchema.parse(req.body);
      item = await prisma.mediaAsset.create({ data: c });
    } else {
      throw ApiError.notFound("Unknown collection");
    }
    res.status(201).json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const kind = req.params.kind as string;
    const id = req.params.id as string;
    if (kind === "organizations") {
      const data = organizationPatchSchema.parse(req.body);
      res.json({ success: true, data: { item: await prisma.organization.update({ where: { id }, data }) } });
    } else if (kind === "work") {
      const data = workItemPatchSchema.parse(req.body) as Record<string, unknown>;
      data.publishedAt = data.isPublished ? new Date() : null;
      res.json({ success: true, data: { item: await prisma.workItem.update({ where: { id }, data }) } });
    } else if (kind === "programs") {
      const data = programPatchSchema.parse(req.body);
      res.json({ success: true, data: { item: await prisma.program.update({ where: { id }, data }) } });
    } else if (kind === "media") {
      const data = mediaAssetSchema.partial().parse(req.body);
      res.json({ success: true, data: { item: await prisma.mediaAsset.update({ where: { id }, data }) } });
    } else {
      throw ApiError.notFound("Unknown collection");
    }
  } catch (err) {
    next(err);
  }
}

export async function adminDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const kind = req.params.kind as string;
    const id = req.params.id as string;
    if (kind === "organizations") {
      await prisma.organization.delete({ where: { id } });
    } else if (kind === "work") {
      await prisma.workItem.delete({ where: { id } });
    } else if (kind === "programs") {
      await prisma.program.delete({ where: { id } });
    } else if (kind === "media") {
      await prisma.mediaAsset.delete({ where: { id } });
    } else {
      throw ApiError.notFound("Unknown collection");
    }
    res.json({ success: true, data: { message: "Deleted" } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────── Conversations ───────────────────────────

/** The user can open a DM with the mentor of the enrollment they are part of. */
export async function openConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const enrollmentId = req.params.enrollmentId as string;
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { courseMentor: true, course: true },
    });
    if (!enrollment) throw ApiError.notFound("Enrollment not found");
    if (enrollment.studentId !== req.user!.id) throw ApiError.forbidden("Not your enrollment");

    let conversation = await prisma.conversation.findUnique({ where: { enrollmentId } });
    if (!conversation) {
      const mentorId = enrollment.courseMentorId;
      if (!mentorId) throw ApiError.badRequest("This enrollment has no assigned mentor");
      conversation = await prisma.conversation.create({
        data: {
          enrollmentId,
          mentorId,
          title: enrollment.course.title,
        },
      });
    }
    res.json({ success: true, data: { conversation } });
  } catch (err) {
    next(err);
  }
}

export async function listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ mentorId: req.user!.id }, { enrollment: { studentId: req.user!.id } }] },
      include: {
        enrollment: { select: { id: true, course: { select: { title: true, slug: true } }, studentId: true } },
        mentor: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: { conversations } });
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { mentorId: true, enrollment: { select: { studentId: true } } },
    });
    if (!conversation) throw ApiError.notFound("Conversation not found");
    const isStudent = conversation.enrollment.studentId === req.user!.id;
    const isMentor = conversation.mentorId === req.user!.id;
    if (!isStudent && !isMentor) throw ApiError.forbidden("Not part of this conversation");

    const messages = await prisma.conversationMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, body: true, createdAt: true, senderId: true, sender: { select: { name: true, avatarUrl: true } } },
    });
    res.json({ success: true, data: { messages } });
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { body } = conversationSendSchema.parse(req.body);
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { mentorId: true, enrollment: { select: { studentId: true } } },
    });
    if (!conversation) throw ApiError.notFound("Conversation not found");
    const isStudent = conversation.enrollment.studentId === req.user!.id;
    const isMentor = conversation.mentorId === req.user!.id;
    if (!isStudent && !isMentor) throw ApiError.forbidden("Not part of this conversation");

    const message = await prisma.conversationMessage.create({
      data: { conversationId: id, senderId: req.user!.id, body },
      select: { id: true, body: true, createdAt: true, senderId: true },
    });
    res.status(201).json({ success: true, data: { message } });
  } catch (err) {
    next(err);
  }
}