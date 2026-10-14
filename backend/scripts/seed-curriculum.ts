/**
 * Populates the authored syllabus (course-curriculum.ts) for every catalogue
 * course: six chapters × four topics of lessons, plus a capstone project
 * chapter. Non-destructive and idempotent — it only replaces the chapters of
 * the courses named in CURRICULUM, and never touches enrolments or other data.
 *
 *   cd backend && npx tsx scripts/seed-curriculum.ts
 */
import "dotenv/config";
import { PrismaClient, type LessonType } from "@prisma/client";
import { CURRICULUM, type ChapterSpec } from "./course-curriculum.js";

const prisma = new PrismaClient();

const LESSON_PATTERNS: Array<{ label: string; type: LessonType }> = [
  { label: "Overview", type: "VIDEO" },
  { label: "Key concepts", type: "VIDEO" },
  { label: "Hands-on practice", type: "READING" },
  { label: "Check your understanding", type: "READING" },
];

function lessonsFor(topic: string, chapter: string, count: number) {
  return LESSON_PATTERNS.slice(0, count).map((p) => {
    const title = `${p.label}: ${topic}`;
    const body = [
      `## ${title}`,
      "",
      `This lesson is part of **${chapter}** and covers **${topic}**.`,
      "",
      "What you will do:",
      "",
      "- Read the idea in plain language",
      "- Follow the worked example",
      "- Finish with a short exercise",
      "",
      "> Lesson content — edit or replace this from the admin lesson editor.",
    ].join("\n");
    return { title, type: p.type, body };
  });
}

async function seedOne(slug: string, authorId: string): Promise<{ chapters: number; topics: number; lessons: number } | null> {
  const spec = CURRICULUM[slug];
  if (!spec) return null;

  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
  if (!course) {
    console.log(`  skip ${slug} — course not found`);
    return null;
  }

  await prisma.chapter.deleteMany({ where: { courseId: course.id } });

  const chapters: ChapterSpec[] = [
    ...spec.chapters,
    { title: `Capstone Project: ${spec.project.title}`, summary: spec.project.description, topics: spec.project.milestones },
  ];

  let topicCount = 0;
  let lessonCount = 0;

  for (let ci = 0; ci < chapters.length; ci++) {
    const ch = chapters[ci]!;
    const isProject = ci === chapters.length - 1;
    await prisma.chapter.create({
      data: {
        courseId: course.id,
        title: ch.title,
        summary: ch.summary ?? null,
        order: ci + 1,
        topics: {
          create: ch.topics.map((topic, ti) => {
            const count = isProject ? 2 : ti % 2 === 0 ? 3 : 4;
            const lessons = lessonsFor(topic, ch.title, count);
            topicCount++;
            lessonCount += lessons.length;
            return {
              courseId: course.id,
              title: topic,
              order: ti + 1,
              lessons: {
                create: lessons.map((l, li) => ({
                  courseId: course.id,
                  title: l.title,
                  type: l.type,
                  textContent: l.body,
                  order: li + 1,
                  isPublished: true,
                  createdById: authorId,
                })),
              },
            };
          }),
        },
      },
    });
  }

  console.log(`  ${slug} — ${chapters.length} chapters, ${topicCount} topics, ${lessonCount} lessons`);
  return { chapters: chapters.length, topics: topicCount, lessons: lessonCount };
}

async function main(): Promise<void> {
  const author =
    (await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } })) ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));
  if (!author) throw new Error("No user found — create an admin before seeding.");

  const slugs = Object.keys(CURRICULUM);
  console.log(`seeding curriculum for ${slugs.length} courses…`);

  let ok = 0;
  let chapters = 0;
  let topics = 0;
  let lessons = 0;
  for (const slug of slugs) {
    const r = await seedOne(slug, author.id);
    if (r) {
      ok++;
      chapters += r.chapters;
      topics += r.topics;
      lessons += r.lessons;
    }
  }
  console.log(`\ndone — ${ok}/${slugs.length} courses, ${chapters} chapters, ${topics} topics, ${lessons} lessons`);
}

main()
  .catch((err) => {
    console.error("\n[curriculum] failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
