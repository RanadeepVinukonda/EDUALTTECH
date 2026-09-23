/**
 * Seed script — creates demo accounts (behind Supabase Auth) and starter data.
 * Run: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

/** Create the auth identity if missing, then return the auth.users row. */
async function ensureAuthUser(email: string, name: string, password = "Password123!") {
  const existing = (await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })).data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (existing) return existing;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error && !/already registered/i.test(error.message)) throw error;
  return (await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })).data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  )!;
}

/** Profile row keyed to the Supabase auth id. */
async function upsertProfile(authUser: { id: string; email?: string }, extra: Record<string, unknown>) {
  const email = (authUser.email ?? "").toLowerCase();
  return prisma.user.upsert({
    where: { email },
    update: { id: authUser.id, emailVerifiedAt: new Date(), onboardingDone: true, ...extra },
    create: { id: authUser.id, email, emailVerifiedAt: new Date(), onboardingDone: true, ...extra },
  });
}

async function main(): Promise<void> {
  const authAdmin = await ensureAuthUser("admin@edualttech.com", "Edu-Alt-Tech Admin");
  const authTeacher = await ensureAuthUser("teacher@edualttech.com", "Priya Sharma");
  const authMentor = await ensureAuthUser("mentor@edualttech.com", "Rahul Verma");
  const authStudent = await ensureAuthUser("student@edualttech.com", "Aarav Kumar");

  const adminUser = await upsertProfile(authAdmin, { name: "Edu-Alt-Tech Admin", role: "ADMIN" });

  const teacher = await upsertProfile(authTeacher, { name: "Priya Sharma", role: "USER", schoolName: "Springfield High" });

  const teacher2 = await upsertProfile(authMentor, {
    name: "Rahul Verma",
    role: "USER",
    schoolName: "Northfield Academy",
    bio: "Teaches robotics and Python with a project-first approach.",
    education: "B.Tech, Computer Science",
  });

  const student = await upsertProfile(authStudent, {
    name: "Aarav Kumar",
    role: "USER",
    schoolName: "Springfield High",
    className: "9-A",
  });
  void adminUser;

  // Two dedicated test learners:
  //   learner1 — has an active plan already, so enrollment works without Razorpay.
  //   learner2 — brand new, no plan: exercises the verify-email + paid-gate paths.
  const authLearner1 = await ensureAuthUser("learner1@edualttech.com", "Aanya Singh");
  const authLearner2 = await ensureAuthUser("learner2@edualttech.com", "Kabir Patel");
  const learner1 = await upsertProfile(authLearner1, {
    name: "Aanya Singh",
    role: "USER",
    schoolName: "Northfield Academy",
    className: "8-B",
  });
  await upsertProfile(authLearner2, {
    name: "Kabir Patel",
    role: "USER",
    schoolName: "Springfield High",
    className: "10-A",
  });

  const activeSubscription = await prisma.subscription.findFirst({
    where: { userId: learner1.id, isActive: true, expiresAt: { gt: new Date() } },
  });
  if (!activeSubscription) {
    await prisma.subscription.create({
      data: {
        userId: learner1.id,
        plan: "TRIAL",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        orderRef: "seed-learner1",
      },
    });
  }

  const course = await prisma.course.upsert({
    where: { slug: "intro-to-programming" },
    update: {},
    create: {
      slug: "intro-to-programming",
      title: "Intro to Programming",
      description: "First steps in coding: variables, loops and functions with hands-on classroom exercises.",
      subject: "Computer Science",
      gradeLevel: "Class 9",
      isPublished: true,
      teacherId: teacher.id,
    },
  });

  const mentorship = await prisma.courseMentor.upsert({
    where: { courseId_mentorId: { courseId: course.id, mentorId: teacher2.id } },
    update: {},
    create: { courseId: course.id, mentorId: teacher2.id },
  });

  const chapters = [
    {
      order: 1,
      title: "Orientation & setup",
      summary: "Meet your mentor, install the tools and run your first program.",
      meetingUrl: "https://meet.example.com/intro-orientation",
      recordingUrl: null as string | null,
      resources: [{ label: "Setup guide", url: "https://example.com/setup-guide" }],
    },
    {
      order: 2,
      title: "Variables & data types",
      summary: "Storing values, naming them well and printing results.",
      meetingUrl: "https://meet.example.com/intro-variables",
      recordingUrl: "https://youtube.com/watch?v=example-variables",
      resources: [
        { label: "Class slides", url: "https://example.com/slides-variables" },
        { label: "Practice sheet", url: "https://example.com/variables-practice" },
      ],
    },
    {
      order: 3,
      title: "Loops & conditionals",
      summary: "Making decisions and repeating work without repeating yourself.",
      meetingUrl: "https://meet.example.com/intro-loops",
      recordingUrl: null as string | null,
      resources: [{ label: "Loop cheat-sheet", url: "https://example.com/loops-cheatsheet" }],
    },
  ];

  for (const chapter of chapters) {
    await prisma.courseChapter.upsert({
      where: { courseMentorId_order: { courseMentorId: mentorship.id, order: chapter.order } },
      update: {},
      create: { courseMentorId: mentorship.id, ...chapter },
    });
  }

  const module1 = await prisma.module.upsert({
    where: { courseId_position: { courseId: course.id, position: 1 } },
    update: {},
    create: {
      courseId: course.id,
      title: "Getting Started",
      position: 1,
    },
  });

  await prisma.lesson.upsert({
    where: { moduleId_position: { moduleId: module1.id, position: 1 } },
    update: {},
    create: {
      moduleId: module1.id,
      courseId: course.id,
      title: "What is code?",
      type: "READING",
      position: 1,
      isPublished: true,
      textContent: "Code is a set of instructions...",
    },
  });

  await prisma.lesson.upsert({
    where: { moduleId_position: { moduleId: module1.id, position: 2 } },
    update: {},
    create: {
      moduleId: module1.id,
      courseId: course.id,
      title: "Your first program",
      type: "VIDEO",
      position: 2,
      isPublished: true,
      contentUrl: "https://example.com/video",
    },
  });

  const module2 = await prisma.module.upsert({
    where: { courseId_position: { courseId: course.id, position: 2 } },
    update: {},
    create: {
      courseId: course.id,
      title: "Loops & Logic",
      position: 2,
    },
  });

  await prisma.lesson.upsert({
    where: { moduleId_position: { moduleId: module2.id, position: 1 } },
    update: {},
    create: {
      moduleId: module2.id,
      courseId: course.id,
      title: "If/else",
      type: "READING",
      position: 1,
      isPublished: true,
      textContent: "Conditionals let programs decide...",
    },
  });

  const quizLesson = await prisma.lesson.upsert({
    where: { moduleId_position: { moduleId: module2.id, position: 2 } },
    update: {},
    create: {
      moduleId: module2.id,
      courseId: course.id,
      title: "Loops quiz",
      type: "QUIZ",
      position: 2,
      isPublished: true,
    },
  });

  const existingQuiz = await prisma.quiz.findUnique({ where: { lessonId: quizLesson.id } });
  if (!existingQuiz) {
    await prisma.quiz.create({
      data: {
        lessonId: quizLesson.id,
        title: "Loops & Logic Check",
        passScore: 60,
        questions: {
          create: [
            { prompt: "Which keyword starts a loop in JavaScript?", options: ["loop", "for", "repeat", "again"], correct: 1, position: 1 },
            { prompt: "How many times does `for (let i=0; i<3; i++)` run?", options: ["2", "3", "4", "Infinite"], correct: 1, position: 2 },
          ],
        },
      },
    });
  }

  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
    update: {},
    create: { studentId: student.id, courseId: course.id, progressPct: 25 },
  });

  const chatRoom = await prisma.chatRoom.upsert({
    where: { id: "seed-room-intro" },
    update: {},
    create: {
      id: "seed-room-intro",
      courseId: course.id,
      type: "CLASSROOM",
      title: "Intro to Programming — Classroom",
      messages: {
        create: [
          { senderId: teacher.id, body: "Welcome to the classroom! Ask anything anytime." },
        ],
      },
    },
  });

  const problems = [
    {
      slug: "sum-two-numbers",
      title: "Sum of Two Numbers",
      topic: "Basics",
      difficulty: 1,
      language: "JAVASCRIPT" as const,
      description: "Read two numbers and return their sum.",
      starterCode: "function solve(a, b) {\n  // your code\n}\n",
      testCases: [
        { input: [2, 3], expected: 5 },
        { input: [-1, 1], expected: 0 },
        { input: [10, 25], expected: 35 },
      ],
    },
    {
      slug: "reverse-string",
      title: "Reverse a String",
      topic: "Strings",
      difficulty: 1,
      language: "JAVASCRIPT" as const,
      description: "Return the input string reversed.",
      starterCode: "function solve(s) {\n  // your code\n}\n",
      testCases: [
        { input: ["abc"], expected: "cba" },
        { input: ["Aarav"], expected: "varaA" },
        { input: [""], expected: "" },
      ],
    },
    {
      slug: "fizzbuzz",
      title: "FizzBuzz",
      topic: "Loops",
      difficulty: 2,
      language: "JAVASCRIPT" as const,
      description: "For each number 1..n, return 'Fizz' for multiples of 3, 'Buzz' for 5, 'FizzBuzz' for both, else the number.",
      starterCode: "function solve(n) {\n  // your code\n}\n",
      testCases: [
        { input: [1], expected: ["1"] },
        { input: [3], expected: ["1", "2", "Fizz"] },
        { input: [5], expected: ["1", "2", "Fizz", "4", "Buzz"] },
        { input: [15], expected: ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"] },
      ],
    },
    {
      slug: "max-of-array",
      title: "Max of Array",
      topic: "Arrays",
      difficulty: 2,
      language: "JAVASCRIPT" as const,
      description: "Return the largest number in the array.",
      starterCode: "function solve(arr) {\n  // your code\n}\n",
      testCases: [
        { input: [[3, 7, 2]], expected: 7 },
        { input: [[-5, -1, -9]], expected: -1 },
        { input: [[42]], expected: 42 },
      ],
    },
    {
      slug: "two-sum",
      title: "Two Sum",
      topic: "Arrays",
      difficulty: 3,
      language: "JAVASCRIPT" as const,
      description: "Return indices of the two numbers that add up to the target.",
      starterCode: "function solve(nums, target) {\n  // your code\n}\n",
      testCases: [
        { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
        { input: [[3, 2, 4], 6], expected: [1, 2] },
        { input: [[3, 3], 6], expected: [0, 1] },
      ],
    },
  ];
  for (const p of problems) {
    const { slug, ...rest } = p;
    await prisma.practiceProblem.upsert({ where: { slug }, update: rest, create: p });
  }

  if ((await prisma.resource.count()) === 0) {
    const resources = [
      { title: "Class 9 Maths Formula Sheet", subject: "Mathematics", kind: "pdf", fileUrl: "https://example.com/maths.pdf", description: "All formulas in one page." },
      { title: "Science Lab Safety Guide", subject: "Science", kind: "pdf", fileUrl: "https://example.com/safety.pdf", description: "Rules every student should know." },
      { title: "English Grammar Basics", subject: "English", kind: "doc", fileUrl: "https://example.com/grammar.pdf", description: "Tenses, articles, punctuation." },
      { title: "Intro to Programming Slides", subject: "Computer Science", kind: "slides", fileUrl: "https://example.com/slides.pdf", description: "Deck used in class." },
    ];
    for (const r of resources) {
      await prisma.resource.create({ data: r });
    }
  }

  await prisma.setting.upsert({
    where: { key: "platform" },
    update: {},
    create: {
      key: "platform",
      value: {
        name: "Edu-Alt-Tech",
        website: "https://www.edualttech.com",
        contactEmail: "info@edualttech.com",
        impact: { schools: 11, students: 1000, resources: 100, satisfaction: 98 },
      },
    },
  });

  console.log("Seed complete:");
  console.log("  admin@edualttech.com   / Password123!  (admin panel)");
  console.log("  teacher@edualttech.com / Password123!  (course owner)");
  console.log("  mentor@edualttech.com  / Password123!  (assigned mentor)");
  console.log("  student@edualttech.com / Password123!  (enrolled learner)");
  console.log("  learner1@edualttech.com / Password123!  (active plan — can enroll)");
  console.log("  learner2@edualttech.com / Password123!  (fresh — no plan, unverified)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
