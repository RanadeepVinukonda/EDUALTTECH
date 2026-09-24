import { Router } from "express";
import { z } from "zod";
import { PracticeLanguage } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { param } from "../../utils/params.js";
import { judgeJavascript, type TestCase } from "../../lib/judge.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const q = z
      .object({
        topic: z.string().optional(),
        category: z.string().optional(),
        language: z.string().optional(),
        difficulty: z.coerce.number().int().min(1).max(3).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(20),
      })
      .parse(req.query);

    const where = {
      ...(q.topic ? { topic: q.topic } : {}),
      ...(q.category ? { category: q.category } : {}),
      ...(q.language ? { language: q.language as PracticeLanguage } : {}),
      ...(q.difficulty ? { difficulty: q.difficulty } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.practiceProblem.findMany({
        where,
        select: { id: true, slug: true, title: true, topic: true, category: true, difficulty: true, language: true },
        orderBy: [{ difficulty: "asc" }, { title: "asc" }],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.practiceProblem.count({ where }),
    ]);

    res.json({ success: true, data: { items, total, page: q.page, limit: q.limit } });
  } catch (err) {
    next(err);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const problem = await prisma.practiceProblem.findUnique({
      where: { slug: param(req, "slug") },
      select: { id: true, slug: true, title: true, description: true, topic: true, difficulty: true, language: true, starterCode: true },
    });
    if (!problem) throw ApiError.notFound("Problem not found");
    res.json({ success: true, data: { problem } });
  } catch (err) {
    next(err);
  }
});

const attemptSchema = z.object({
  code: z.string().trim().min(1).max(50_000),
});

/**
 * POST /api/practice/:id/attempts
 * The verdict is computed server-side against stored test cases — the
 * client never reports its own result. Sandboxed judging is available
 * for JAVASCRIPT problems; other languages return a clear error.
 */
router.post("/:id/attempts", requireAuth, validate(attemptSchema), async (req, res, next) => {
  try {
    const problem = await prisma.practiceProblem.findUnique({ where: { id: param(req, "id") } });
    if (!problem) throw ApiError.notFound("Problem not found");

    if (problem.language !== "JAVASCRIPT") {
      throw ApiError.badRequest("Sandboxed judging is available for JAVASCRIPT problems only right now");
    }

    const tests = (problem.testCases ?? []) as unknown as TestCase[];
    if (tests.length === 0) {
      throw ApiError.badRequest("This problem has no test cases configured yet");
    }

    const verdict = judgeJavascript(req.body.code, tests);

    const attempt = await prisma.practiceAttempt.create({
      data: {
        problemId: problem.id,
        studentId: req.user!.id,
        code: req.body.code,
        result: verdict.result,
        runtimeMs: verdict.runtimeMs,
      },
    });

    await prisma.activityLog.upsert({
      where: { userId_day_kind: { userId: req.user!.id, day: new Date(), kind: "practice" } },
      update: { count: { increment: 1 } },
      create: { userId: req.user!.id, day: new Date(), kind: "practice" },
    });

    res.status(201).json({
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          result: verdict.result,
          detail: verdict.detail,
          runtimeMs: verdict.runtimeMs,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/attempts/me", requireAuth, async (req, res, next) => {
  try {
    const attempts = await prisma.practiceAttempt.findMany({
      where: { problemId: param(req, "id"), studentId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, result: true, runtimeMs: true, createdAt: true },
    });
    res.json({ success: true, data: { attempts } });
  } catch (err) {
    next(err);
  }
});

export default router;
