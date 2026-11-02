import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SAMPLE_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

type ResourceSeed = { title: string; description: string; kind: string; url: string };
type LessonSeed = {
  title: string;
  type: "READING" | "VIDEO";
  text?: string;
  videoUrl?: string;
  resource?: ResourceSeed;
};
type TopicSeed = { title: string; summary: string; lessons: LessonSeed[]; resource?: ResourceSeed };
type ChapterSeed = { title: string; summary: string; topics: TopicSeed[] };

const reading = (title: string, text: string): LessonSeed => ({ title, type: "READING", text });
const video = (title: string, resource?: ResourceSeed): LessonSeed => ({
  title,
  type: "VIDEO",
  videoUrl: SAMPLE_VIDEO,
  resource,
});

const courseChapters: ChapterSeed[] = [
  {
    title: "Orientation",
    summary: "Understand the course, set up your workspace, and meet the way the programme runs.",
    topics: [
      {
        title: "Welcome and how the course works",
        summary: "The learning model, mentor support, and how progress is tracked.",
        lessons: [
          video("Watch: Course walkthrough"),
          reading(
            "Read: What you will build",
            `# What you will build

By the end of this course you will have a complete product concept, a tested prototype, and a launch plan.

## What to expect
- Weekly mentor check-ins
- One build task per topic
- A final review before launch

## How to move through the course
1. Read the topic overview.
2. Complete the lesson.
3. Submit your work in the next live session.

> Tip: mark each lesson complete as you go so your progress stays accurate.`,
          ),
        ],
        resource: {
          title: "Course syllabus",
          description: "One-page outline of all chapters, topics, and deliverables.",
          kind: "link",
          url: "https://www.figma.com/resource-library/design-basics/",
        },
      },
      {
        title: "Set up your workspace",
        summary: "Accounts, tools, and a simple folder structure for the course.",
        lessons: [
          reading(
            "Read: Tools checklist",
            `# Tools checklist

You only need three things to start:

- A notes app
- A design or whiteboard tool
- A place to keep files

## Suggested setup
1. Create a course folder.
2. Add subfolders for notes, research, and exports.
3. Bookmark the mentor meeting link.

Nothing else is required for the first chapter.`,
          ),
          video("Watch: Workspace setup"),
        ],
        resource: {
          title: "Workspace setup guide",
          description: "Step-by-step setup notes with links to the free tools used in the course.",
          kind: "link",
          url: "https://www.notion.so/templates",
        },
      },
    ],
  },
  {
    title: "Core concepts",
    summary: "Plan the experience and apply the design fundamentals used throughout the build.",
    topics: [
      {
        title: "Planning the experience",
        summary: "Turn a rough brief into a clear user journey.",
        lessons: [
          reading(
            "Read: Planning canvas",
            `# Planning canvas

Use these four questions before you design anything:

1. Who is this for?
2. What problem are they solving?
3. What is the smallest useful outcome?
4. What could stop them?

## Output
Write one sentence for each question and keep it visible while you build.`,
          ),
          video("Watch: From brief to plan"),
        ],
      },
      {
        title: "Design fundamentals",
        summary: "Layout, hierarchy, spacing, and accessible colour choices.",
        lessons: [
          reading(
            "Read: Layout and hierarchy",
            `# Layout and hierarchy

A clear layout answers three things at a glance:

- What is this page about?
- What should I do next?
- What else is available?

## Practical rules
- One primary action per screen.
- Group related controls.
- Keep body text readable at small sizes.
- Never rely on colour alone to communicate state.`,
          ),
          video("Watch: Design in practice"),
        ],
        resource: {
          title: "Design review checklist",
          description: "A short checklist for spacing, hierarchy, contrast, and states.",
          kind: "link",
          url: "https://www.figma.com/resource-library/design-basics/",
        },
      },
    ],
  },
  {
    title: "Build and test",
    summary: "Build the first end-to-end flow and validate it with real users.",
    topics: [
      {
        title: "Build your first flow",
        summary: "Assemble the screens and connect the main user journey.",
        lessons: [
          reading(
            "Read: Step-by-step build",
            `# Step-by-step build

Build the smallest complete flow, not the widest set of screens.

## Steps
1. Create the entry screen.
2. Add the main action.
3. Show the result or confirmation.
4. Add empty, loading, and error states.

Test the flow once before adding polish.`,
          ),
          video("Watch: Build demo"),
        ],
      },
      {
        title: "Test with real users",
        summary: "Run a short usability session and capture useful feedback.",
        lessons: [
          reading(
            "Read: Test script",
            `# Test script

Ask the participant to complete the flow without prompting.

## Questions
- What do you think this screen is for?
- What would you do next?
- Was anything unclear?

Record observations, not opinions. Fix the biggest blocker first.`,
          ),
          video("Watch: Test session"),
        ],
        resource: {
          title: "Feedback template",
          description: "Session notes template for observations, blockers, and follow-ups.",
          kind: "link",
          url: "https://www.notion.so/templates",
        },
      },
    ],
  },
  {
    title: "Launch",
    summary: "Package the work, prepare the launch, and plan the next iteration.",
    topics: [
      {
        title: "Package your work",
        summary: "Prepare the final files, summary, and review materials.",
        lessons: [
          reading(
            "Read: Launch checklist",
            `# Launch checklist

Before you call the work finished:

- [ ] Main flow works end to end
- [ ] Empty and error states exist
- [ ] Copy is proofread
- [ ] Files are exported and named clearly
- [ ] A short summary is written

Ship the smallest version that delivers the promised outcome.`,
          ),
          video("Watch: Final review"),
        ],
        resource: {
          title: "Launch checklist",
          description: "Printable checklist for the final review.",
          kind: "link",
          url: "https://www.atlassian.com/software/jira/templates",
        },
      },
      {
        title: "Share and reflect",
        summary: "Present the outcome and decide what to improve next.",
        lessons: [
          reading(
            "Read: Reflection prompts",
            `# Reflection prompts

Answer these in your course notes:

1. What changed between the first plan and the final build?
2. Which decision had the biggest impact?
3. What would you test next?

Bring your answers to the final mentor session.`,
          ),
        ],
      },
    ],
  },
];

const resourceChapters: ChapterSeed[] = [
  {
    title: "Getting started",
    summary: "A plain-language introduction to digital skills and the tools you will use.",
    topics: [
      {
        title: "What digital skills actually mean",
        summary: "The everyday skills behind confident computer use.",
        lessons: [
          reading(
            "Read: Why digital skills matter",
            `# Why digital skills matter

Digital skills are not about knowing every app. They are about being able to:

- Find information you can trust
- Organise files so you can find them later
- Communicate clearly in writing
- Protect your accounts

## Try this
Open your files app and create three folders: **Work**, **Personal**, and **Learning**. Move five files into the right folders.`,
          ),
          reading(
            "Read: Your first 30 minutes",
            `# Your first 30 minutes

Use this short session to set up the basics:

1. Update your device.
2. Turn on two-factor authentication for your main email.
3. Create a password manager entry for your email account.
4. Bookmark the tools you use every day.

Small setup steps prevent most everyday problems.`,
          ),
        ],
      },
      {
        title: "Set up your toolkit",
        summary: "Free tools for notes, files, and communication.",
        lessons: [
          reading(
            "Read: Free tools list",
            `# Free tools list

## Notes
Use any notes app you will actually open. Keep one page per project.

## Files
Use cloud storage with version history. Name files with a date and a short description.

## Communication
Keep email short: context, request, deadline.

Bookmark the three tools you use most and remove the rest from your home screen.`,
          ),
        ],
        resource: {
          title: "Starter toolkit links",
          description: "Links to the free tools referenced in this chapter.",
          kind: "link",
          url: "https://www.notion.so/templates",
        },
      },
    ],
  },
  {
    title: "Core practices",
    summary: "Organise information, search effectively, and write clear messages.",
    topics: [
      {
        title: "Organise information",
        summary: "A simple folder and naming system that scales.",
        lessons: [
          reading(
            "Read: Files and folders",
            `# Files and folders

Use a shallow structure. Three levels is usually enough:

\`\`\`text
Course
  Notes
  Research
  Final
\`\`\`

## Naming pattern
\`2026-01-15-project-notes.md\`

A date first makes sorting predictable.`,
          ),
          reading(
            "Read: Search like a pro",
            `# Search like a pro

## Search operators
- \`site:\` limits results to one website
- \`filetype:pdf\` finds documents
- Quotation marks find an exact phrase

Example: \`site:gov.uk filetype:pdf "digital skills"\`

Check the source date before using a result.`,
          ),
        ],
      },
      {
        title: "Communicate clearly",
        summary: "Short, useful messages for email and meetings.",
        lessons: [
          reading(
            "Read: Email basics",
            `# Email basics

A useful email has three parts:

1. **Context** — one sentence on why you are writing.
2. **Request** — exactly what you need.
3. **Deadline** — when you need it.

Keep the subject line specific. Put the ask in the first two lines.`,
          ),
          reading(
            "Read: Meeting notes",
            `# Meeting notes

Capture four things:

- Decisions
- Owners
- Deadlines
- Open questions

Send the notes within an hour of the meeting. Short notes sent quickly beat perfect notes sent late.`,
          ),
        ],
        resource: {
          title: "Meeting notes template",
          description: "A four-section template for decisions, owners, deadlines, and questions.",
          kind: "link",
          url: "https://www.notion.so/templates",
        },
      },
    ],
  },
  {
    title: "Practice project",
    summary: "Build a simple personal dashboard and review the result.",
    topics: [
      {
        title: "Build a personal dashboard",
        summary: "A one-page dashboard for tasks, links, and notes.",
        lessons: [
          reading(
            "Read: Project brief",
            `# Project brief

Build a one-page dashboard with:

- Three task checkboxes
- Four useful links
- A notes area

Keep it to one screen. The goal is a page you will open every morning.`,
          ),
          reading(
            "Read: Step-by-step",
            `# Step-by-step

1. Create a new page in your notes app.
2. Add a heading with today's date.
3. Create a task list with three items.
4. Add four bookmarks.
5. Add a notes block at the bottom.

Pin the page. Use it for one week before changing the layout.`,
          ),
        ],
      },
      {
        title: "Review and next steps",
        summary: "Check the result and choose one improvement.",
        lessons: [
          reading(
            "Read: Self review",
            `# Self review

Ask yourself:

1. Did I open the dashboard more than once this week?
2. Which section did I ignore?
3. What is the one change that would make it more useful?

Make one change only. Then use it for another week.`,
          ),
        ],
        resource: {
          title: "Project review checklist",
          description: "A short checklist for reviewing the practice project.",
          kind: "link",
          url: "https://www.atlassian.com/software/jira/templates",
        },
      },
    ],
  },
];

async function clearCourseContent(courseId: string): Promise<void> {
  await prisma.resource.deleteMany({ where: { courseId } });
  await prisma.liveMeeting.deleteMany({ where: { courseId } });
  await prisma.chapter.deleteMany({ where: { courseId } });
}

async function seedContent(courseId: string, adminId: string, chapters: ChapterSeed[]) {
  await clearCourseContent(courseId);
  const ids: { chapterId?: string; topicId?: string; lessonId?: string } = {};

  for (let c = 0; c < chapters.length; c += 1) {
    const chapterSeed = chapters[c];
    const chapter = await prisma.chapter.create({
      data: {
        courseId,
        title: chapterSeed.title,
        summary: chapterSeed.summary,
        order: c + 1,
      },
    });
    ids.chapterId ??= chapter.id;

    for (let t = 0; t < chapterSeed.topics.length; t += 1) {
      const topicSeed = chapterSeed.topics[t];
      const topic = await prisma.topic.create({
        data: {
          courseId,
          chapterId: chapter.id,
          title: topicSeed.title,
          summary: topicSeed.summary,
          order: t + 1,
        },
      });
      ids.topicId ??= topic.id;

      for (let l = 0; l < topicSeed.lessons.length; l += 1) {
        const lessonSeed = topicSeed.lessons[l];
        const lesson = await prisma.lesson.create({
          data: {
            courseId,
            topicId: topic.id,
            title: lessonSeed.title,
            type: lessonSeed.type,
            textContent: lessonSeed.text ?? null,
            contentUrl: lessonSeed.videoUrl ?? null,
            order: l + 1,
            createdById: adminId,
          },
        });
        ids.lessonId ??= lesson.id;

        if (lessonSeed.resource) {
          await prisma.resource.create({
            data: {
              ...lessonSeed.resource,
              courseId,
              topicId: topic.id,
              lessonId: lesson.id,
              ownerId: adminId,
            },
          });
        }
      }

      if (topicSeed.resource) {
        await prisma.resource.create({
          data: {
            ...topicSeed.resource,
            courseId,
            topicId: topic.id,
            ownerId: adminId,
          },
        });
      }
    }
  }

  return ids;
}

async function main(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const admin = email
    ? await prisma.user.findUnique({ where: { email } })
    : await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });

  if (!admin) {
    throw new Error("No admin account found. Set ADMIN_EMAIL in backend/.env or create an admin first.");
  }

  const course = await prisma.course.upsert({
    where: { slug: "mentor-test-course" },
    update: {
      status: "PUBLISHED",
      thumbnailUrl: "/media/courses/ai-fundamentals.jpg",
      features: ["4 chapters", "Mentor guided", "Hands-on tasks", "Certificate"],
    },
    create: {
      slug: "mentor-test-course",
      title: "Mentor Test Course",
      description:
        "A complete sandbox course for testing chapters, lessons, resources, meetings, and the mentor application flow.",
      type: "EDUCATION",
      category: "Test",
      domain: "Product Design",
      thumbnailUrl: "/media/courses/ai-fundamentals.jpg",
      level: "Beginner",
      tags: ["Test", "Mentor flow"],
      features: ["4 chapters", "Mentor guided", "Hands-on tasks", "Certificate"],
      pricePaise: 0,
      currency: "INR",
      status: "PUBLISHED",
      roadmapTitle: "Test the complete learner journey",
      roadmapSummary: "Browse chapters, read lessons, open resources, join a meeting, then apply as a mentor.",
      createdById: admin.id,
    },
  });

  const courseIds = await seedContent(course.id, admin.id, courseChapters);

  await prisma.liveMeeting.create({
    data: {
      courseId: course.id,
      chapterId: courseIds.chapterId,
      topicId: courseIds.topicId,
      lessonId: courseIds.lessonId,
      title: "Live Q&A: Test the meeting flow",
      description: "Join this test session to verify meeting links, times, and reminders.",
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      durationMin: 45,
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      createdById: admin.id,
    },
  });

  const freeResource = await prisma.course.upsert({
    where: { slug: "test-free-resource" },
    update: {
      status: "PUBLISHED",
      thumbnailUrl: "/media/courses/basic-digital-skills.jpg",
      features: ["100% Free Resource", "Self-paced Tutorials", "3 chapters"],
    },
    create: {
      slug: "test-free-resource",
      title: "Test Free Resource",
      description: "A complete free resource for testing articles, code blocks, resources, and the Resources filter.",
      type: "EDUCATION",
      category: "Test",
      domain: "Digital Skills",
      thumbnailUrl: "/media/courses/basic-digital-skills.jpg",
      level: "Beginner",
      tags: ["Test", "Resource"],
      features: ["100% Free Resource", "Self-paced Tutorials", "3 chapters"],
      pricePaise: 0,
      currency: "INR",
      status: "PUBLISHED",
      roadmapTitle: "Read the complete test resource",
      roadmapSummary: "Three chapters of self-paced reading with templates and a practice project.",
      createdById: admin.id,
    },
  });

  await seedContent(freeResource.id, admin.id, resourceChapters);

  console.log("[test-course] ready");
  console.log(`  course:        ${course.title}`);
  console.log(`  slug:          ${course.slug}`);
  console.log(`  courseId:      ${course.id}`);
  console.log(`  chapters:      ${courseChapters.length}`);
  console.log(`  topics:        ${courseChapters.reduce((sum, ch) => sum + ch.topics.length, 0)}`);
  console.log(`  lessons:       ${courseChapters.reduce((sum, ch) => sum + ch.topics.reduce((n, t) => n + t.lessons.length, 0), 0)}`);
  console.log(`  free resource: ${freeResource.title} (${freeResource.id})`);
  console.log(`  res chapters:  ${resourceChapters.length}`);
  console.log(`  admin:         ${admin.email}`);
  console.log("");
  console.log("[test-course] apply at /dashboard/admin/courses, then review at /dashboard/admin/applications");
  console.log("[test-course] mentor applications need a verified mobile and a resume on your profile.");
}

main()
  .catch((err) => {
    console.error("[test-course] failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
