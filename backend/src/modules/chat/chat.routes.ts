import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { param } from "../../utils/params.js";

const router = Router();

router.use(requireAuth);

type MaybeUser = { id: string; role: string };

/** A participant can read/post in a room: admin, course owner, a mentor of the course, or an ACTIVE enrolled learner. */
async function isParticipant(user: MaybeUser, room: { courseId: string }): Promise<boolean> {
  if (user.role === "ADMIN") return true;

  const [ownsCourse, mentors, enrolled] = await Promise.all([
    prisma.course.findFirst({ where: { id: room.courseId, teacherId: user.id }, select: { id: true } }),
    prisma.courseMentor.findFirst({ where: { courseId: room.courseId, mentorId: user.id }, select: { id: true } }),
    prisma.enrollment.findFirst({
      where: { courseId: room.courseId, studentId: user.id, status: "ACTIVE" },
      select: { id: true },
    }),
  ]);
  return Boolean(ownsCourse || mentors || enrolled);
}

async function requireRoomAccess(user: MaybeUser, roomId: string): Promise<{ id: string; courseId: string }> {
  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) throw ApiError.notFound("Room not found");
  if (!(await isParticipant(user, room))) {
    throw ApiError.forbidden("You are not a participant of this classroom");
  }
  return room;
}

router.get("/rooms", async (req, res, next) => {
  try {
    // One list covering both sides of a user's life on the platform: rooms for
    // courses they learn in, and rooms for courses they own or mentor.
    const where =
      req.user!.role === "ADMIN"
        ? {}
        : {
            course: {
              OR: [
                { enrollments: { some: { studentId: req.user!.id, status: "ACTIVE" as const } } },
                { teacherId: req.user!.id },
                { mentors: { some: { mentorId: req.user!.id } } },
              ],
            },
          };

    const rooms = await prisma.chatRoom.findMany({
      where,
      include: {
        course: { select: { id: true, title: true, slug: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: { rooms } });
  } catch (err) {
    next(err);
  }
});

router.get("/rooms/course/:courseId", async (req, res, next) => {
  try {
    const courseId = param(req, "courseId");
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true } });
    if (!course) throw ApiError.notFound("Course not found");
    if (!(await isParticipant(req.user!, { courseId }))) {
      throw ApiError.forbidden("Join the course to access its classroom chat");
    }

    // Lazy-create the classroom room on first visit — live courses get a room
    // without needing a seed or an admin step.
    const room = await prisma.chatRoom.upsert({
      where: { courseId },
      update: {},
      create: { courseId, type: "CLASSROOM", title: `${course.title} — Classroom` },
    });

    res.json({ success: true, data: { room } });
  } catch (err) {
    next(err);
  }
});

router.get("/rooms/:id/messages", async (req, res, next) => {
  try {
    const q = z
      .object({
        before: z.string().datetime().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      })
      .parse(req.query);

    const room = await requireRoomAccess(req.user!, param(req, "id"));

    const messages = await prisma.classroomMessage.findMany({
      where: { roomId: room.id, ...(q.before ? { createdAt: { lt: new Date(q.before) } } : {}) },
      orderBy: { createdAt: "desc" },
      take: q.limit,
      include: { sender: { select: { id: true, name: true, role: true, avatarUrl: true } } },
    });

    res.json({ success: true, data: { messages: messages.reverse() } });
  } catch (err) {
    next(err);
  }
});

const messageSchema = z.object({ body: z.string().trim().min(1).max(2_000) });

router.post("/rooms/:id/messages", validate(messageSchema), async (req, res, next) => {
  try {
    const room = await requireRoomAccess(req.user!, param(req, "id"));

    const message = await prisma.classroomMessage.create({
      data: { roomId: room.id, senderId: req.user!.id, body: req.body.body },
      include: { sender: { select: { id: true, name: true, role: true, avatarUrl: true } } },
    });

    res.status(201).json({ success: true, data: { message } });
  } catch (err) {
    next(err);
  }
});

export default router;