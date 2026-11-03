import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole, optionalAuth } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit } from "../../lib/audit.js";
import { castPollVote } from "../../lib/poll-vote.js";
import { pollSuggestLimiter } from "../../middlewares/rate-limit.js";

const router = Router();

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

/** Hard ceiling for community-suggested options on one poll. */
const MAX_POLL_OPTIONS = 40;

// ────────────────────────────────────────────────────────────────────
// Public & Learner Voting Endpoints
// ────────────────────────────────────────────────────────────────────

/** Get the currently active poll for community voting */
router.get("/active", optionalAuth, async (req, res) => {
  const poll = await prisma.coursePoll.findFirst({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      options: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!poll) {
    return res.json({ success: true, data: { poll: null, userVotes: [] } });
  }

  // Check if current user has already voted
  let userVotes: string[] = [];
  if (req.user) {
    const votes = await prisma.pollVote.findMany({
      where: { pollId: poll.id, userId: req.user.id },
      select: { pollOptionId: true },
    });
    userVotes = votes.map((v) => v.pollOptionId);
  }

  const totalVotes = poll.options.reduce((acc, opt) => acc + opt.voteCount, 0);

  const isAdmin = req.user?.role === "ADMIN";
  const hideResults = poll.hideResultsUntilClosed && !isAdmin;

  res.json({
    success: true,
    data: {
      poll: {
        ...poll,
        totalVotes: hideResults ? 0 : totalVotes,
        options: poll.options.map((opt) => ({
          ...opt,
          votes: hideResults ? 0 : opt.voteCount,
          percentage: hideResults || totalVotes === 0 ? 0 : Math.round((opt.voteCount / totalVotes) * 100),
          voteCount: hideResults ? undefined : opt.voteCount,
        })),
      },
      userVotes,
      userVoteOptionId: userVotes[0] ?? null,
      userVotedOptionId: userVotes[0] ?? null,
    },
  });
});

/** Get closed / historical polls and their outcomes */
router.get("/history", async (_req, res) => {
  const polls = await prisma.coursePoll.findMany({
    where: { status: "CLOSED" },
    orderBy: { updatedAt: "desc" },
    take: 10,
    include: {
      options: {
        orderBy: { voteCount: "desc" },
      },
    },
  });

  const formatted = polls.map((poll) => {
    const totalVotes = poll.options.reduce((acc, opt) => acc + opt.voteCount, 0);
    return {
      ...poll,
      totalVotes,
      options: poll.options.map((opt) => ({
        ...opt,
        percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0,
      })),
    };
  });

  res.json({ success: true, data: { polls: formatted } });
});

/** Cast or update a vote with transactional integrity */
router.post(
  "/:id/vote",
  requireAuth,
  validate({
    body: z.object({
      optionId: z.string().min(1),
    }),
  }),
  async (req, res) => {
    const { optionId } = body<{ optionId: string }>(req);
    const pollId = req.params.id;
    const userId = req.user!.id;

    const result = await castPollVote(pollId, optionId, userId);

    audit(userId, "poll.voted", "coursePoll", pollId, { optionId, title: result.optionTitle });

    res.json({
      success: true,
      data: {
        votedOptionId: result.votedOptionId,
        totalVotes: result.totalVotes,
        options: result.options.map((opt) => ({
          ...opt,
          percentage: result.totalVotes > 0 ? Math.round((opt.voteCount / result.totalVotes) * 100) : 0,
        })),
      },
    });
  },
);

/** Learner suggestion for next course / skill */
router.post(
  "/suggest",
  pollSuggestLimiter,
  optionalAuth,
  validate({
    body: z.object({
      title: z.string().trim().min(3).max(160),
      category: z.string().trim().max(80).optional(),
    }),
  }),
  async (req, res) => {
    const { title, category } = body<{ title: string; category?: string }>(req);

    // Find active poll or fallback to newest
    const poll = await prisma.coursePoll.findFirst({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
    });

    if (!poll || (poll.endDate && poll.endDate < new Date())) {
      return res.json({ success: true, data: { message: "Suggestion noted for upcoming polls." } });
    }

    const existing = await prisma.pollOption.findFirst({
      where: { pollId: poll.id, title: { equals: title, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) {
      return res.json({ success: true, data: { option: { id: existing.id }, duplicate: true } });
    }

    const optionCount = await prisma.pollOption.count({ where: { pollId: poll.id } });
    if (optionCount >= MAX_POLL_OPTIONS) {
      throw ApiError.badRequest("This poll is no longer accepting new suggestions.", "POLL_SUGGESTIONS_CLOSED");
    }

    const last = await prisma.pollOption.findFirst({
      where: { pollId: poll.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    // Suggestions start at zero: only an explicit vote adds a vote, and an
    // anonymous suggestion must never be able to inflate the tally.
    const newOption = await prisma.pollOption.create({
      data: {
        pollId: poll.id,
        title,
        description: "",
        category: category ?? "",
        domain: "",
        difficulty: null,
        voteCount: 0,
        order: (last?.order ?? 0) + 1,
      },
    });

    res.status(201).json({ success: true, data: { option: newOption } });
  },
);

// ────────────────────────────────────────────────────────────────────
// Admin Poll Management
// ────────────────────────────────────────────────────────────────────

router.use(requireAuth, requireRole("ADMIN"));

router.get("/admin/all", async (_req, res) => {
  const polls = await prisma.coursePoll.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      options: { orderBy: { voteCount: "desc" } },
      _count: { select: { votes: true } },
    },
  });

  res.json({
    success: true,
    data: {
      polls: polls.map((p) => ({
        ...p,
        totalVotes: p._count.votes,
      })),
    },
  });
});

const optionInputSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(5).max(1000),
  category: z.string().trim().max(80).default("General"),
  domain: z.string().trim().max(80).default("General"),
  difficulty: z.string().trim().max(40).default("Beginner"),
  estimatedDuration: z.string().trim().max(60).optional(),
  outcomes: z.array(z.string().trim().min(1).max(160)).max(10).default([]),
});

const pollCreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(5).max(2000),
  status: z.enum(["DRAFT", "OPEN", "CLOSED"]).default("DRAFT"),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  allowVoteChange: z.boolean().default(true),
  hideResultsUntilClosed: z.boolean().default(false),
  options: z.array(optionInputSchema).min(1).max(20),
});

router.post(
  ["/admin", "/admin/polls"],
  validate({ body: pollCreateSchema }),
  async (req, res) => {
    const { options, ...pollData } = body<z.infer<typeof pollCreateSchema>>(req);

    const created = await prisma.$transaction(async (tx) => {
      const poll = await tx.coursePoll.create({
        data: {
          ...pollData,
          createdById: req.user!.id,
        },
      });

      for (const [index, opt] of options.entries()) {
        await tx.pollOption.create({
          data: {
            pollId: poll.id,
            title: opt.title,
            description: opt.description,
            category: opt.category,
            domain: opt.domain,
            difficulty: opt.difficulty,
            estimatedDuration: opt.estimatedDuration ?? null,
            outcomes: opt.outcomes ?? [],
            order: index + 1,
          },
        });
      }

      return poll;
    });

    audit(req.user!.id, "poll.created", "coursePoll", created.id, { title: created.title });
    res.status(201).json({ success: true, data: { poll: created } });
  },
);

router.all(
  ["/admin/polls/:id", "/admin/:id", "/admin/polls/:id/status", "/admin/:id/status"],
  validate({
    body: z.object({
      title: z.string().trim().min(3).max(160).optional(),
      description: z.string().trim().min(5).max(2000).optional(),
      status: z.enum(["DRAFT", "OPEN", "CLOSED"]).optional(),
      startDate: z.coerce.date().nullable().optional(),
      endDate: z.coerce.date().nullable().optional(),
      allowVoteChange: z.boolean().optional(),
      hideResultsUntilClosed: z.boolean().optional(),
    }),
  }),
  async (req, res) => {
    const input = body<Record<string, unknown>>(req);
    const poll = await prisma.coursePoll.update({
      where: { id: req.params.id },
      data: input as never,
    });
    audit(req.user!.id, "poll.updated", "coursePoll", poll.id);
    res.json({ success: true, data: { poll } });
  },
);

/** Admin publishes / posts the poll live to all users */
router.post(
  ["/admin/polls/:id/publish", "/admin/:id/publish", "/admin/polls/:id/post-to-users", "/admin/:id/post-to-users"],
  async (req, res) => {
    const pollId = String(req.params.id);

    const existing = await prisma.coursePoll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!existing) {
      throw ApiError.notFound("Poll not found");
    }

    if (existing.options.length < 2) {
      throw ApiError.badRequest("Cannot post a poll with fewer than 2 course proposals.");
    }

    // Set poll to OPEN and startDate to now
    const poll = await prisma.coursePoll.update({
      where: { id: pollId },
      data: {
        status: "OPEN",
        startDate: new Date(),
      },
    });

    // Notify all active learners about the new poll
    const learners = await prisma.user.findMany({
      where: { role: "USER", deactivatedAt: null },
      select: { id: true },
      take: 500,
    });

    if (learners.length > 0) {
      await prisma.notification.createMany({
        data: learners.map((l) => ({
          recipientId: l.id,
          senderId: req.user!.id,
          title: "New Course Poll is Live!",
          body: `Vote now on "${poll.title}". Have your say on which course we build next!`,
        })),
      }).catch(() => undefined);
    }

    audit(req.user!.id, "poll.published", "coursePoll", poll.id, {
      title: poll.title,
      notifiedLearners: learners.length,
    });

    res.json({
      success: true,
      data: {
        poll,
        notifiedCount: learners.length,
        message: `Poll "${poll.title}" is now posted live to users!`,
      },
    });
  },
);

router.post("/admin/options/:optionId/mark-winner", async (req, res) => {
  const option = await prisma.pollOption.update({
    where: { id: req.params.optionId },
    data: { isWinner: true },
  });
  res.json({ success: true, data: { option } });
});

router.delete("/admin/polls/:id", async (req, res) => {
  await prisma.coursePoll.delete({ where: { id: req.params.id } });
  audit(req.user!.id, "poll.deleted", "coursePoll", req.params.id);
  res.json({ success: true, data: { ok: true } });
});

router.post(
  "/admin/polls/:id/options",
  validate({ body: optionInputSchema }),
  async (req, res) => {
    const input = body<z.infer<typeof optionInputSchema>>(req);
    const last = await prisma.pollOption.findFirst({
      where: { pollId: req.params.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const option = await prisma.pollOption.create({
      data: {
        pollId: req.params.id,
        title: input.title,
        description: input.description,
        category: input.category,
        domain: input.domain,
        difficulty: input.difficulty,
        estimatedDuration: input.estimatedDuration ?? null,
        outcomes: input.outcomes,
        order: (last?.order ?? 0) + 1,
      },
    });

    res.status(201).json({ success: true, data: { option } });
  },
);

router.patch(
  "/admin/options/:optionId",
  validate({
    body: z.object({
      title: z.string().trim().min(2).max(160).optional(),
      description: z.string().trim().min(5).max(1000).optional(),
      category: z.string().trim().max(80).optional(),
      domain: z.string().trim().max(80).optional(),
      difficulty: z.string().trim().max(40).optional(),
      isWinner: z.boolean().optional(),
    }),
  }),
  async (req, res) => {
    const input = body<Record<string, unknown>>(req);
    const option = await prisma.pollOption.update({
      where: { id: req.params.optionId },
      data: input as never,
    });
    res.json({ success: true, data: { option } });
  },
);

/** Convert a winning proposal directly into an actual Course draft */
router.post("/admin/options/:optionId/convert-to-course", async (req, res) => {
  const option = await prisma.pollOption.findUnique({
    where: { id: req.params.optionId },
    include: { poll: true },
  });

  if (!option) throw ApiError.notFound("Poll option not found");

  if (option.convertedCourseId) {
    const existingCourse = await prisma.course.findUnique({
      where: { id: option.convertedCourseId },
      select: { id: true, slug: true, title: true },
    });
    if (existingCourse) {
      return res.json({
        success: true,
        data: { course: existingCourse, alreadyConverted: true },
      });
    }
  }

  let slug = slugify(option.title);
  if (!slug) slug = `course-${Date.now().toString(36)}`;
  if (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const course = await prisma.$transaction(async (tx) => {
    const created = await tx.course.create({
      data: {
        title: option.title,
        slug,
        description: option.description,
        category: option.category || "General",
        domain: option.domain || "General",
        level: option.difficulty || "Beginner",
        status: "DRAFT",
        pricePaise: 0,
        learningOutcomes: option.outcomes.length > 0 ? option.outcomes : ["Course outcomes defined by community demand."],
        createdById: req.user!.id,
      },
    });

    await tx.pollOption.update({
      where: { id: option.id },
      data: { isWinner: true, convertedCourseId: created.id },
    });

    return created;
  });

  audit(req.user!.id, "pollOption.convertedToCourse", "course", course.id, {
    pollId: option.pollId,
    optionId: option.id,
    courseTitle: course.title,
  });

  res.status(201).json({ success: true, data: { course, alreadyConverted: false } });
});

export default router;
