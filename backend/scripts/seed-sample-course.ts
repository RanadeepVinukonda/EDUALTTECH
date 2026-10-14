/**
 * Creates (or refreshes) fully-populated sample courses so every course
 * surface can be exercised on the live site: curriculum, lesson content,
 * roadmap, features, a capstone project, an assigned mentor and learners.
 *
 *   cd backend && npx tsx scripts/seed-sample-course.ts
 *
 * Non-destructive to other courses: only touches the courses in SAMPLES.
 * Idempotent — re-running replaces each sample's curriculum.
 */
import "dotenv/config";
import { PrismaClient, type LessonType } from "@prisma/client";

const prisma = new PrismaClient();

const MENTOR_EMAIL = "mentor@edualttech.demo";
const STUDENT_EMAILS = ["student1@edualttech.demo", "student2@edualttech.demo", "student3@edualttech.demo"];

interface ChapterSpec {
  title: string;
  summary?: string;
  topics: string[];
}

interface ProjectSpec {
  title: string;
  description: string;
  milestones: string[];
}

interface SampleCourse {
  slug: string;
  title: string;
  description: string;
  domain: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
  features: string[];
  thumbnailUrl: string;
  roadmapTitle: string;
  roadmapSummary: string;
  chapters: ChapterSpec[];
  project: ProjectSpec;
}

const SAMPLES: SampleCourse[] = [
  {
    slug: "sample-course",
    title: "Sample Course — Learn Python (Demo)",
    description:
      "A fully populated sample course for testing the platform end to end: six chapters, guided lessons with content, a capstone project, an assigned mentor and live enrolment.",
    domain: "Programming",
    level: "Beginner",
    tags: ["Sample", "Python"],
    features: ["6 chapters", "Guided lessons", "Capstone project", "Mentor support"],
    thumbnailUrl: "/media/courses/python-for-kids.jpg",
    roadmapTitle: "Your first steps in Python",
    roadmapSummary: "From printing your first line to building a small game — a complete, bitesize Python path.",
    chapters: [
      { title: "Getting Started with Python", topics: ["What Python is", "Installing Python", "Running your first script", "Printing and comments"] },
      { title: "Variables and Data", topics: ["Storing values", "Numbers and text", "Converting types", "Naming variables"] },
      { title: "Making Decisions", topics: ["Comparing values", "if, elif and else", "Combining conditions", "A tiny quiz program"] },
      { title: "Loops", topics: ["for loops", "while loops", "range and break", "Loop practice"] },
      { title: "Functions", topics: ["Defining a function", "Parameters and return", "Scope", "Reusing code"] },
      { title: "Lists and Dictionaries", topics: ["Lists", "Adding and removing items", "Dictionaries", "Iterating over collections"] },
    ],
    project: {
      title: "Build a Number Guessing Game",
      description:
        "Bring the whole sample together: build a game where the computer picks a secret number and the player guesses. Use variables, decisions, loops and functions — then test it with a friend and improve the hints.",
      milestones: ["Plan the game rules", "Generate the secret number", "Loop the guesses with hints", "Add attempts and a replay"],
    },
  },
  {
    slug: "sample-course-web",
    title: "Sample Course — Build a Website (Demo)",
    description:
      "A second fully populated sample course covering HTML and CSS end to end: six chapters, guided lessons with content, a capstone project, an assigned mentor and live enrolment.",
    domain: "Web Development",
    level: "Beginner",
    tags: ["Sample", "HTML", "CSS"],
    features: ["6 chapters", "Guided lessons", "Capstone project", "Mentor support"],
    thumbnailUrl: "/media/courses/html-css.jpg",
    roadmapTitle: "From blank page to a real website",
    roadmapSummary: "Learn how the web works, structure pages with HTML, style them with CSS, and publish your own site.",
    chapters: [
      { title: "How the Web Works", topics: ["What a webpage is", "Browsers and servers", "Your first HTML file", "Viewing a page"] },
      { title: "HTML Structure", topics: ["Tags and elements", "Headings and paragraphs", "Links", "Images"] },
      { title: "Lists, Tables and Sections", topics: ["Bulleted and numbered lists", "Tables", "Semantic sections", "Forms and inputs"] },
      { title: "Styling with CSS", topics: ["What CSS is", "Selectors", "Colours and fonts", "The box model"] },
      { title: "Layout", topics: ["Spacing and padding", "Flexbox basics", "Simple grids", "Responsive basics"] },
      { title: "Building and Shipping a Page", topics: ["Planning the page", "Structuring content", "Styling sections", "Publishing online"] },
    ],
    project: {
      title: "Build a Personal Portfolio Page",
      description:
        "Combine everything into a responsive personal portfolio: a header, an about section, a projects list with images, and a contact area — styled with CSS and published online.",
      milestones: ["Sketch the layout", "Write the HTML structure", "Style with CSS", "Test on mobile and publish"],
    },
  },
];

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

async function seedCourse(spec: SampleCourse, authorId: string, mentorId: string | null): Promise<void> {
  const course = await prisma.course.upsert({
    where: { slug: spec.slug },
    update: {
      status: "PUBLISHED",
      pricePaise: 0,
      title: spec.title,
      description: spec.description,
      category: "Sample",
      domain: spec.domain,
      level: spec.level,
      tags: spec.tags,
      features: spec.features,
      thumbnailUrl: spec.thumbnailUrl,
      roadmapTitle: spec.roadmapTitle,
      roadmapSummary: spec.roadmapSummary,
    },
    create: {
      slug: spec.slug,
      title: spec.title,
      description: spec.description,
      type: "EDUCATION",
      category: "Sample",
      domain: spec.domain,
      level: spec.level,
      tags: spec.tags,
      features: spec.features,
      pricePaise: 0,
      currency: "INR",
      status: "PUBLISHED",
      thumbnailUrl: spec.thumbnailUrl,
      createdById: authorId,
      roadmapTitle: spec.roadmapTitle,
      roadmapSummary: spec.roadmapSummary,
    },
  });

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

  if (mentorId) {
    await prisma.courseParticipant.upsert({
      where: { courseId_userId: { courseId: course.id, userId: mentorId } },
      update: { role: "MENTOR", status: "ACTIVE", capacity: 20 },
      create: { courseId: course.id, userId: mentorId, role: "MENTOR", status: "ACTIVE", capacity: 20 },
    });
  }

  for (const email of STUDENT_EMAILS) {
    const student = await prisma.user.findUnique({ where: { email } });
    if (!student || student.id === mentorId) continue;
    await prisma.courseParticipant.upsert({
      where: { courseId_userId: { courseId: course.id, userId: student.id } },
      update: { role: "LEARNER", status: "ACTIVE", mentorUserId: mentorId },
      create: { courseId: course.id, userId: student.id, role: "LEARNER", status: "ACTIVE", mentorUserId: mentorId },
    });
  }

  console.log(`course: /courses/${spec.slug} — ${chapters.length} chapters, ${topicCount} topics, ${lessonCount} lessons`);
}

async function main(): Promise<void> {
  const author =
    (await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } })) ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));
  if (!author) throw new Error("No user found — create an admin before seeding.");

  const mentor = await prisma.user.findUnique({ where: { email: MENTOR_EMAIL } });
  if (!mentor) console.log(`mentor ${MENTOR_EMAIL} not found — run create-demo-users.ts to add demo accounts`);

  for (const spec of SAMPLES) {
    await seedCourse(spec, author.id, mentor?.id ?? null);
  }

  console.log(`\nseeded ${SAMPLES.length} sample course(s)`);
}

main()
  .catch((err) => {
    console.error("\n[sample] failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
