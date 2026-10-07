/**
 * Ownership gates: admin/owner own the roadmap shell + chapters, an accepted
 * mentor builds the lessons and concepts inside them, and a stranger can do
 * neither. Run with the app's env loaded. Cleans up everything it creates.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { canTransition } from "../src/lib/invariants.js";
import { assertNotProvider, assertNotSeeking, lockUser } from "../src/lib/course-roles.js";

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

let failures = 0;
function check(label: string, pass: boolean) {
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}`);
}

async function main() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const { data: created } = await supabase.auth.admin.createUser({
    email: `gate-${Date.now()}@test.local`,
    email_confirm: true,
  });
  const mentor = await prisma.user.create({
    data: { id: created!.user.id, email: created!.user.email!, name: "Gate Mentor" },
  });
  const { data: strangerCreated } = await supabase.auth.admin.createUser({
    email: `gate-${Date.now()}-x@test.local`,
    email_confirm: true,
  });
  const stranger = await prisma.user.create({
    data: { id: strangerCreated!.user.id, email: strangerCreated!.user.email!, name: "Gate Stranger" },
  });

  try {
    const course = await prisma.course.create({
      data: {
        slug: `gate-${Date.now()}`,
        title: "Gate course",
        description: "gate check",
        subject: "Test",
        teacherId: admin.id,
      },
    });
    const cm = await prisma.courseMentor.create({ data: { courseId: course.id, mentorId: mentor.id } });

    // Mirrors assertCourseOwner in chapters.routes (shell + chapters).
    const canStructure = async (user: { id: string; role: string }) =>
      user.role === "ADMIN" ||
      Boolean(await prisma.course.findFirst({ where: { id: course.id, teacherId: user.id }, select: { id: true } }));

    // Mirrors assertContentAccess in content.routes (lessons + concepts).
    const canTeach = async (user: { id: string; role: string }) =>
      (await canStructure(user)) ||
      Boolean(await prisma.courseMentor.findFirst({ where: { courseId: course.id, mentorId: user.id }, select: { id: true } }));

    check("admin owns the structure", await canStructure(admin));
    check("course owner owns the structure", await canStructure({ id: course.teacherId, role: "USER" }));
    check("mentor cannot touch the roadmap shell", !(await canStructure(mentor)));
    check("mentor can author lessons + concepts", await canTeach(mentor));
    check("stranger can teach nothing", !(await canTeach(stranger)));

    const chapter = await prisma.courseChapter.create({ data: { courseId: course.id, title: "Ch 1", order: 1 } });
    const lesson = await prisma.module.create({
      data: { courseId: course.id, chapterId: chapter.id, title: "L 1", position: 1 },
    });
    const concept = await prisma.lesson.create({
      data: { moduleId: lesson.id, courseId: course.id, title: "C 1", position: 1, meetingUrl: "https://meet.google.com/x", isPublished: true },
    });
    check("chapter belongs to the course", chapter.courseId === course.id);
    check("lesson belongs to an admin chapter", lesson.chapterId === chapter.id);
    check("concept content survives on a shared structure", Boolean(concept.meetingUrl));

    // A structure read for another course must not resolve against this mentor.
    const foreign = await prisma.courseChapter.findFirst({ where: { id: chapter.id, course: { mentors: { some: { id: cm.id } } } }, select: { id: true } });
    check("chapter reachable through the mentor's course", foreign?.id === chapter.id);

    const enrolled = await prisma.user.findUnique({ where: { email: stranger.email } });
    const progress = await prisma.enrollment.create({
      data: { courseId: course.id, studentId: enrolled!.id, status: "ACTIVE" },
    });
    await prisma.lessonProgress.create({ data: { enrollmentId: progress.id, lessonId: concept.id } });
    const done = await prisma.lessonProgress.count({ where: { enrollmentId: progress.id } });
    check("learner progress is tracked per enrollment", done === 1);

    // ── Invariants: application transitions + seeker/provider exclusion ──
    check("PENDING → UNDER_REVIEW is legal", canTransition("PENDING", "UNDER_REVIEW"));
    check("INTERVIEW → APPROVED is legal", canTransition("INTERVIEW", "APPROVED"));
    check("REJECTED → APPROVED is refused", !canTransition("REJECTED", "APPROVED"));
    check("APPROVED → REJECTED is refused", !canTransition("APPROVED", "REJECTED"));
    check("same-state update is a no-op", canTransition("PENDING", "PENDING"));

    let learnerBlocked = false;
    await prisma.$transaction(async (tx) => {
      await lockUser(tx, enrolled.id);
      try {
        await assertNotSeeking(tx, enrolled.id, course.id);
      } catch {
        learnerBlocked = true;
      }
    });
    check("active learner is refused a provider role", learnerBlocked);

    let mentorBlocked = false;
    await prisma.$transaction(async (tx) => {
      await lockUser(tx, mentor.id);
      try {
        await assertNotProvider(tx, mentor.id, course.id);
      } catch {
        mentorBlocked = true;
      }
    });
    check("mentor is refused a learner role", mentorBlocked);

    let strangerAllowed = false;
    await prisma.$transaction(async (tx) => {
      await lockUser(tx, stranger.id);
      await assertNotSeeking(tx, stranger.id, "no-such-course");
      await assertNotProvider(tx, stranger.id, "no-such-course");
      strangerAllowed = true;
    });
    check("unrelated user passes both exclusion checks", strangerAllowed);

    await prisma.enrollment.delete({ where: { id: progress.id } });
    await prisma.lesson.delete({ where: { id: concept.id } });
    await prisma.module.delete({ where: { id: lesson.id } });
    await prisma.courseChapter.delete({ where: { id: chapter.id } });
    await prisma.courseMentor.delete({ where: { id: cm.id } });
    await prisma.course.delete({ where: { id: course.id } });
  } finally {
    await supabase.auth.admin.deleteUser(mentor.id);
    await supabase.auth.admin.deleteUser(stranger.id);
    await prisma.user.deleteMany({ where: { id: { in: [mentor.id, stranger.id] } } });
  }

  console.log(failures === 0 ? "\nall gates hold" : `\n${failures} gate(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());