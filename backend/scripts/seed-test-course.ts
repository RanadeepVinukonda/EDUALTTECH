/**
 * Replaces the platform's demo/test courses with a single fresh test course.
 *
 *   cd backend && npx tsx scripts/seed-test-course.ts
 *
 * - Deletes the previous test courses (sample-course, sample-course-web).
 * - Creates one published test course with curriculum (chapters → topics →
 *   lesson titles only, all unpublished).
 * - Enrols two learners with NO mentor assigned.
 *
 * Lessons carry no text, video or resources on purpose - building lesson
 * content is the mentor's job, done from the teaching workspace after they
 * take the course.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OLD_SLUGS = ["sample-course", "sample-course-web"];
const NEW_SLUG = "test-course";
const LEARNER_EMAILS = ["student1@edualttech.demo", "student2@edualttech.demo"];

const CHAPTERS: Array<{ title: string; topics: string[] }> = [
  { title: "Getting Started with Python", topics: ["What Python is", "Installing Python", "Running your first script", "Printing and comments"] },
  { title: "Variables and Data", topics: ["Storing values", "Numbers and text", "Converting types", "Naming variables"] },
  { title: "Making Decisions", topics: ["Comparing values", "if, elif and else", "Combining conditions", "A tiny quiz program"] },
  { title: "Loops", topics: ["for loops", "while loops", "range and break", "Loop practice"] },
  { title: "Functions", topics: ["Defining a function", "Parameters and return", "Scope", "Reusing code"] },
  { title: "Lists and Dictionaries", topics: ["Lists", "Adding and removing items", "Dictionaries", "Iterating over collections"] },
];

const LESSON_LABELS = ["Overview", "Key concepts", "Hands-on practice", "Check your understanding"];

async function main(): Promise<void> {
  const author =
    (await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } })) ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));
  if (!author) throw new Error("No user found - create an admin before seeding.");

  const removed = await prisma.course.deleteMany({ where: { slug: { in: OLD_SLUGS } } });
  console.log(`removed ${removed.count} previous test course(s)`);

  const course = await prisma.course.upsert({
    where: { slug: NEW_SLUG },
    update: {
      status: "PUBLISHED",
      pricePaise: 0,
      title: "Test Course - Python Foundations",
      description:
        "A fresh test course with curriculum ready to be taught. Lesson content is added by the mentor from the teaching workspace.",
    },
    create: {
      slug: NEW_SLUG,
      title: "Test Course - Python Foundations",
      description:
        "A fresh test course with curriculum ready to be taught. Lesson content is added by the mentor from the teaching workspace.",
      type: "EDUCATION",
      category: "Test",
      domain: "Programming",
      level: "Beginner",
      tags: ["Test", "Python"],
      features: ["6 chapters", "Guided lessons", "Hands-on practice", "Mentor support"],
      pricePaise: 0,
      currency: "INR",
      status: "PUBLISHED",
      thumbnailUrl: "/media/courses/python-for-kids.jpg",
      createdById: author.id,
      roadmapTitle: "Your first steps in Python",
      roadmapSummary: "From printing your first line to building a small game - a complete, bitesize Python path.",
    },
  });

  await prisma.chapter.deleteMany({ where: { courseId: course.id } });

  let topicCount = 0;
  let lessonCount = 0;

  for (let ci = 0; ci < CHAPTERS.length; ci++) {
    const ch = CHAPTERS[ci]!;
    await prisma.chapter.create({
      data: {
        courseId: course.id,
        title: ch.title,
        order: ci + 1,
        topics: {
          create: ch.topics.map((topic, ti) => {
            const count = ti % 2 === 0 ? 3 : 4;
            const lessons = LESSON_LABELS.slice(0, count);
            topicCount++;
            lessonCount += lessons.length;
            return {
              courseId: course.id,
              title: topic,
              order: ti + 1,
              lessons: {
                create: lessons.map((label, li) => ({
                  courseId: course.id,
                  title: `${label}: ${topic}`,
                  type: "READING",
                  order: li + 1,
                  isPublished: false,
                  createdById: author.id,
                })),
              },
            };
          }),
        },
      },
    });
  }

  // Two learners, no mentor - a mentor can take the course later.
  for (const email of LEARNER_EMAILS) {
    const student = await prisma.user.findUnique({ where: { email } });
    if (!student) {
      console.log(`learner ${email} not found - run create-demo-users.ts`);
      continue;
    }
    await prisma.courseParticipant.upsert({
      where: { courseId_userId: { courseId: course.id, userId: student.id } },
      update: { role: "LEARNER", status: "ACTIVE", mentorUserId: null },
      create: { courseId: course.id, userId: student.id, role: "LEARNER", status: "ACTIVE", mentorUserId: null },
    });
  }

  console.log(`course: /courses/${NEW_SLUG} - ${CHAPTERS.length} chapters, ${topicCount} topics, ${lessonCount} lessons (unpublished), 2 learners, no mentor`);
}

main()
  .catch((err) => {
    console.error("\n[test-course] failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
