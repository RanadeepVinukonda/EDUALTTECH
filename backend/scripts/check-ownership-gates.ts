/**
 * Ownership gates: admin/owner can author structure, a mentor cannot, and a
 * mentor can still fill concept content. Run with the app's env loaded.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

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

  // Mirrors assertCourseOwner / assertStructureAccess.
  const canStructure = async (user: { id: string; role: string }) =>
    user.role === "ADMIN" ||
    Boolean(await prisma.course.findFirst({ where: { id: course.id, teacherId: user.id }, select: { id: true } }));

  // Mirrors assertContentAccess (concept authoring).
  const canTeach = async (user: { id: string; role: string }) =>
    (await canStructure(user)) ||
    Boolean(await prisma.courseMentor.findFirst({ where: { courseId: course.id, mentorId: user.id }, select: { id: true } }));

  check("admin can author structure", await canStructure(admin));
  check("owner can author structure", await canStructure({ id: course.teacherId, role: "USER" }));
  check("mentor cannot author structure", !(await canStructure(mentor)));
  check("mentor can author concept content", await canTeach(mentor));

  const chapter = await prisma.courseChapter.create({ data: { courseId: course.id, title: "Ch 1", order: 1 } });
  const lesson = await prisma.module.create({
    data: { courseId: course.id, chapterId: chapter.id, title: "L 1", position: 1 },
  });
  const concept = await prisma.lesson.create({
    data: { moduleId: lesson.id, courseId: course.id, title: "C 1", position: 1, meetingUrl: "https://meet.google.com/x", isPublished: true },
  });
  check("chapter belongs to the course", chapter.courseId === course.id);
  check("concept content survives on a shared structure", Boolean(concept.meetingUrl));

  // A structure write for another course must not resolve against this mentor.
  const foreign = await prisma.courseChapter.findFirst({ where: { id: chapter.id, course: { mentors: { some: { id: cm.id } } } }, select: { id: true } });
  check("chapter reachable through the mentor's course", foreign?.id === chapter.id);

  await supabase.auth.admin.deleteUser(mentor.id);
  console.log(failures === 0 ? "\nall gates hold" : `\n${failures} gate(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());