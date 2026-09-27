import { prisma } from "../lib/prisma.js";
import { admin } from "../lib/supabase.js";

const EMAIL = "demo.user@edualttech.com";
const PASSWORD = "Demo@2024!";
const NAME = "Demo Student Mentor";

async function ensureUser() {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existing) {
    console.log("user exists", existing.id);
    return existing;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name: NAME, firstName: "Demo", lastName: "Student Mentor" },
  });
  if (error) throw new Error(`supabase create failed: ${error.message}`);
  const user = await prisma.user.create({
    data: {
      id: data.user.id,
      email: EMAIL,
      name: NAME,
      firstName: "Demo",
      lastName: "Student Mentor",
      emailVerifiedAt: new Date(),
      interestedTopics: ["Computer Science", "Mathematics"],
      education: "B.Tech CSE",
      educationBoard: null,
      educationClass: null,
      qualification: "Engineering",
      degree: "B.Tech",
      college: "Demo College",
      gradYear: 2025,
      bio: "Demo user to see the product UI end to end.",
      onboardingDone: true,
    },
  });
  console.log("user created", user.id);
  return user;
}

async function seedSubscription(userId: string) {
  const count = await prisma.subscription.count({ where: { userId, isActive: true } });
  if (count > 0) return;
  await prisma.subscription.create({
    data: { userId, plan: "FULL", isActive: true },
  });
  console.log("subscription active");
}

async function seedOrders(userId: string) {
  const count = await prisma.order.count({ where: { userId } });
  if (count > 0) return;
  const now = Date.now();
  await prisma.order.createMany({
    data: [
      {
        userId,
        razorpayOrderId: `order_demo_success_${Date.now()}`,
        orderNumber: `ORD-DEMO-${Date.now()}`,
        amountPaise: 49900,
        plan: "FULL",
        status: "PAID",
        createdAt: new Date(now - 30 * 864e5),
        notes: { plan: "FULL", source: "seed" },
      },
      {
        userId,
        razorpayOrderId: `order_demo_failed_${Date.now()}`,
        orderNumber: `ORD-DEMO-FAIL-${Date.now()}`,
        amountPaise: 100,
        plan: "TRIAL",
        status: "FAILED",
        createdAt: new Date(now - 12 * 864e5),
        notes: { plan: "TRIAL", source: "seed" },
      },
      {
        userId,
        razorpayOrderId: `order_demo_open_${Date.now()}`,
        orderNumber: `ORD-DEMO-OPEN-${Date.now()}`,
        amountPaise: 49900,
        plan: "FULL",
        status: "CREATED",
        createdAt: new Date(now - 2 * 864e5),
        notes: { plan: "FULL", source: "seed", abandoned: true },
      },
    ],
  });
  console.log("orders seeded: PAID + FAILED + CREATED");
}

async function seedSeeking(userId: string) {
  const course = await prisma.course.findUnique({ where: { slug: "intro-to-programming" } });
  if (!course) throw new Error("intro-to-programming missing");
  const mentor = await prisma.courseMentor.findFirst({ where: { courseId: course.id } });
  const existing = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: userId, courseId: course.id } },
  });
  let enrollment = existing;
  if (!enrollment) {
    enrollment = await prisma.enrollment.create({
      data: {
        studentId: userId,
        courseId: course.id,
        courseMentorId: mentor?.id ?? null,
        status: "ACTIVE",
        progressPct: 42,
      },
    });
  }
  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { courseMentorId: mentor?.id ?? null, status: "ACTIVE", progressPct: 42 },
  });
  await prisma.lessonProgress.deleteMany({ where: { enrollmentId: enrollment.id } });
  const lessons = await prisma.lesson.findMany({
    where: { courseId: course.id },
    orderBy: { position: "asc" },
    take: 2,
  });
  if (lessons.length) {
    await prisma.lessonProgress.createMany({
      data: lessons.map((l) => ({ enrollmentId: enrollment.id, lessonId: l.id })),
    });
  }
  console.log("seeking enrollment:", enrollment.id);
  return enrollment.id;
}

async function seedMentoring(userId: string) {
  const course = await prisma.course.findUnique({ where: { slug: "python-course" } });
  if (!course) throw new Error("python-course missing");
  let cm = await prisma.courseMentor.findUnique({
    where: { courseId_mentorId: { courseId: course.id, mentorId: userId } },
  });
  if (!cm) {
    cm = await prisma.courseMentor.create({
      data: { courseId: course.id, mentorId: userId, capacity: 20 },
    });
  }
  const chapters = ["Week 1 — Python Basics", "Week 2 — Functions & Files", "Week 3 — Mini Project"];
  let order = 0;
  for (const title of chapters) {
    const exists = await prisma.courseChapter.findUnique({
      where: { courseMentorId_order: { courseMentorId: cm.id, order } },
    });
    if (!exists) {
      await prisma.courseChapter.create({
        data: {
          courseMentorId: cm.id,
          title,
          order,
          summary: "Hands-on session for " + title,
          meetingUrl: "https://meet.example.com/demo",
        },
      });
    }
    order++;
  }
  const modules = ["Basics", "Data Structures", "Projects"];
  let pos = 0;
  for (const title of modules) {
    const mod = await prisma.module.findUnique({ where: { courseId_position: { courseId: course.id, position: pos } } });
    if (!mod) {
      await prisma.module.create({
        data: {
          courseId: course.id,
          title,
          position: pos,
          lessons: {
            create: [
              { title: `Lesson 1 — ${title}`, type: "READING", courseId: course.id, position: 0, isPublished: true },
              { title: `Lesson 2 — ${title} exercises`, type: "QUIZ", courseId: course.id, position: 1, isPublished: true },
            ],
          },
        },
      });
    }
    pos++;
  }
  const meetings = await prisma.liveMeeting.count({ where: { courseId: course.id } });
  if (meetings === 0) {
    await prisma.liveMeeting.create({
      data: {
        courseId: course.id,
        title: "Live Q&A — Python kickoff",
        description: "First live session for enrolled students.",
        scheduledAt: new Date(Date.now() + 3 * 864e5),
        durationMin: 60,
        meetingUrl: "https://meet.example.com/demo",
        createdById: userId,
      },
    });
  }
  console.log("mentoring ended at course", course.id);
}

async function seedQuizzes(userId: string) {
  const count = await prisma.quizAttempt.count({ where: { studentId: userId } });
  if (count > 0) return;
  const quiz = await prisma.quiz.findFirst();
  if (!quiz) return;
  await prisma.quizAttempt.createMany({
    data: [
      { quizId: quiz.id, studentId: userId, score: 82, passed: true, answers: { latest: true } },
      { quizId: quiz.id, studentId: userId, score: 55, passed: false, answers: { latest: false } },
    ],
  });
  await prisma.quizAttempt.create({
    data: { quizId: quiz.id, studentId: userId, score: 94, passed: true, answers: {}, createdAt: new Date(Date.now() - 3 * 864e5) },
  });
  console.log("quiz attempts: 3");
}

async function seedPractice(userId: string) {
  const count = await prisma.practiceAttempt.count({ where: { studentId: userId } });
  if (count > 0) return;
  const probs = await prisma.practiceProblem.findMany({ take: 3 });
  const ups: string[] = ["ACCEPTED", "WRONG_ANSWER", "ACCEPTED", "TIME_LIMIT", "ACCEPTED"];
  for (let i = 0; i < ups.length; i++) {
    const p = probs[i % probs.length];
    await prisma.practiceAttempt.create({
      data: { problemId: p.id, studentId: userId, result: ups[i] as never, code: "// seeded", runtimeMs: 45 + i },
    });
  }
  console.log("practice attempts: 5");
}

async function seedStreakActivity(userId: string) {
  await prisma.streak.upsert({
    where: { userId },
    update: { current: 6, longest: 9, lastActiveOn: new Date() },
    create: { userId, current: 6, longest: 9, lastActiveOn: new Date() },
  });
  const kinds = ["lesson", "quiz", "practice", "enroll"];
  for (let i = 0; i < 12; i++) {
    const day = new Date(Date.now() - i * 864e5);
    for (const kind of kinds) {
      await prisma.activityLog.upsert({
        where: { userId_day_kind: { userId, day, kind } },
        update: {},
        create: { userId, day, kind, count: 3 + i },
      });
    }
  }
  console.log("streak + activity seeded");
}

async function seedBookmarks(userId: string) {
  const want = ["intro-to-programming", "python-course"];
  const wish = await prisma.wishlistItem.count({ where: { userId } });
  if (wish === 0) {
    const courses = await prisma.course.findMany({ where: { slug: { in: want } } });
    await prisma.wishlistItem.createMany({ data: courses.map((c) => ({ userId, courseId: c.id })) });
  }
  const rb = await prisma.resourceBookmark.count({ where: { userId } });
  if (rb === 0) {
    const resources = await prisma.resource.findMany({ take: 2 });
    if (resources.length) await prisma.resourceBookmark.createMany({ data: resources.map((r) => ({ userId, resourceId: r.id })) });
  }
  console.log("bookmarks (wishlist + resources) seeded");
}

async function seedNotifications(userId: string) {
  const count = await prisma.notification.count();
  if (count === 0) {
    await prisma.notification.createMany({
      data: [
        { title: "Welcome to EduAltTech", body: "Explore your dashboard, courses and practice zone.", scope: "ALL" },
        { title: "New live class scheduled", body: "Live Q&A — Python kickoff is on in 3 days.", scope: "ALL" },
      ],
    });
  }
  console.log("notifications seeded");
}

async function seedConversation(userId: string, enrollmentId: string) {
  const conv = await prisma.conversation.findUnique({ where: { enrollmentId } });
  if (conv) return;
  const mentor = await prisma.courseMentor.findFirst();
  const created = await prisma.conversation.create({
    data: { enrollmentId, mentorId: mentor?.mentorId ?? userId, title: "1-on-1 with your mentor" },
  });
  await prisma.conversationMessage.createMany({
    data: [
      { conversationId: created.id, senderId: userId, body: "Hi mentor! I'm stuck on the loops module — could we sync this week?" },
      { conversationId: created.id, senderId: mentor?.mentorId ?? userId, body: "Sure! Thrive on Friday 6pm. Bring your code, we'll walk through it." },
    ],
  });
  console.log("conversation seeded");
}

async function main() {
  const user = await ensureUser();
  await seedSubscription(user.id);
  await seedOrders(user.id);
  const enrollmentId = await seedSeeking(user.id);
  await seedMentoring(user.id);
  await seedQuizzes(user.id);
  await seedPractice(user.id);
  await seedStreakActivity(user.id);
  await seedBookmarks(user.id);
  await seedNotifications(user.id);
  await seedConversation(user.id, enrollmentId);
  console.log("\nDONE. Login:", EMAIL, "/", PASSWORD);
}

main()
  .catch((err) => {
    console.error("SEED FAILED", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());