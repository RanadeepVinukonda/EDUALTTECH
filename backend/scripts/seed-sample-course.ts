/**
 * Creates (or refreshes) ONE fully-populated sample course so every course
 * surface can be exercised on the live site: curriculum, lesson content,
 * roadmap, features, a capstone project, an assigned mentor and learners.
 *
 *   cd backend && npx tsx scripts/seed-sample-course.ts
 *
 * Non-destructive to other courses: only touches the course with SLUG below.
 * Idempotent — re-running replaces that course's curriculum.
 */
import "dotenv/config";
import { PrismaClient, type LessonType } from "@prisma/client";

const prisma = new PrismaClient();

const SLUG = "sample-course";
const MENTOR_EMAIL = "mentor@edualttech.demo";
const STUDENT_EMAILS = ["student1@edualttech.demo", "student2@edualttech.demo", "student3@edualttech.demo"];

interface ChapterSpec {
  title: string;
  summary?: string;
  topics: string[];
}

const CHAPTERS: ChapterSpec[] = [
  { title: "Getting Started with Python", topics: ["What Python is", "Installing Python", "Running your first script", "Printing and comments"] },
  { title: "Variables and Data", topics: ["Storing values", "Numbers and text", "Converting types", "Naming variables"] },
  { title: "Making Decisions", topics: ["Comparing values", "if, elif and else", "Combining conditions", "A tiny quiz program"] },
  { title: "Loops", topics: ["for loops", "while loops", "range and break", "Loop practice"] },
  { title: "Functions", topics: ["Defining a function", "Parameters and return", "Scope", "Reusing code"] },
  { title: "Lists and Dictionaries", topics: ["Lists", "Adding and removing items", "Dictionaries", "Iterating over collections"] },
];

const PROJECT = {
  title: "Build a Number Guessing Game",
  description:
    "Bring the whole sample together: build a game where the computer picks a secret number and the player guesses. Use variables, decisions, loops and functions — then test it with a friend and improve the hints.",
  milestones: ["Plan the game rules", "Generate the secret number", "Loop the guesses with hints", "Add attempts and a replay"],
};

// First two lessons read as video, the rest as reading — enough to show both types.
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
      "> Sample lesson content — edit or replace this from the admin lesson editor.",
    ].join("\n");
    return { title, type: p.type, body };
  });
}

async function main(): Promise<void> {
  const author =
    (await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } })) ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));
  if (!author) throw new Error("No user found — create an admin before seeding.");

  const course = await prisma.course.upsert({
    where: { slug: SLUG },
    update: {
      status: "PUBLISHED",
      pricePaise: 0,
      title: "Sample Course — Learn Python (Demo)",
      description:
        "A fully populated sample course for testing the platform end to end: six chapters, guided lessons with content, a capstone project, an assigned mentor and live enrolment.",
      category: "Sample",
      domain: "Programming",
      level: "Beginner",
      tags: ["Sample", "Python"],
      features: ["6 chapters", "Guided lessons", "Capstone project", "Mentor support"],
      roadmapTitle: "Your first steps in Python",
      roadmapSummary: "From printing your first line to building a small game — a complete, bitesize Python path.",
    },
    create: {
      slug: SLUG,
      title: "Sample Course — Learn Python (Demo)",
      description:
        "A fully populated sample course for testing the platform end to end: six chapters, guided lessons with content, a capstone project, an assigned mentor and live enrolment.",
      type: "EDUCATION",
      category: "Sample",
      domain: "Programming",
      level: "Beginner",
      tags: ["Sample", "Python"],
      features: ["6 chapters", "Guided lessons", "Capstone project", "Mentor support"],
      pricePaise: 0,
      currency: "INR",
      status: "PUBLISHED",
      thumbnailUrl: "/media/courses/python-for-kids.jpg",
      createdById: author.id,
      roadmapTitle: "Your first steps in Python",
      roadmapSummary: "From printing your first line to building a small game — a complete, bitesize Python path.",
    },
  });
  console.log(`course: ${course.title} (${course.slug})`);

  await prisma.chapter.deleteMany({ where: { courseId: course.id } });

  const specs: Array<{ title: string; summary?: string; topics: string[] }> = [
    ...CHAPTERS,
    { title: `Capstone Project: ${PROJECT.title}`, summary: PROJECT.description, topics: PROJECT.milestones },
  ];

  let topicCount = 0;
  let lessonCount = 0;

  for (let ci = 0; ci < specs.length; ci++) {
    const ch = specs[ci]!;
    const isProject = ci === specs.length - 1;
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
                  createdById: author.id,
                })),
              },
            };
          }),
        },
      },
    });
  }
  console.log(`curriculum: ${specs.length} chapters, ${topicCount} topics, ${lessonCount} lessons`);

  const mentor = await prisma.user.findUnique({ where: { email: MENTOR_EMAIL } });
  if (mentor) {
    await prisma.courseParticipant.upsert({
      where: { courseId_userId: { courseId: course.id, userId: mentor.id } },
      update: { role: "MENTOR", status: "ACTIVE", capacity: 20 },
      create: { courseId: course.id, userId: mentor.id, role: "MENTOR", status: "ACTIVE", capacity: 20 },
    });
    console.log(`mentor: ${MENTOR_EMAIL}`);
  } else {
    console.log(`mentor: ${MENTOR_EMAIL} not found — run create-demo-users.ts to add demo accounts`);
  }

  let enrolled = 0;
  for (const email of STUDENT_EMAILS) {
    const student = await prisma.user.findUnique({ where: { email } });
    if (!student || (mentor && student.id === mentor.id)) continue;
    await prisma.courseParticipant.upsert({
      where: { courseId_userId: { courseId: course.id, userId: student.id } },
      update: { role: "LEARNER", status: "ACTIVE", mentorUserId: mentor?.id ?? null },
      create: { courseId: course.id, userId: student.id, role: "LEARNER", status: "ACTIVE", mentorUserId: mentor?.id ?? null },
    });
    enrolled++;
  }
  if (enrolled) console.log(`learners: enrolled ${enrolled} demo student(s)`);

  console.log(`\nopen: /courses/${SLUG}`);
}

main()
  .catch((err) => {
    console.error("\n[sample] failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
