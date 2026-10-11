import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const PASSWORD = "Demo@12345";
const COURSE_SLUG = "intro-to-web-development-demo";

interface Person {
  email: string;
  firstName: string;
  lastName: string;
}

const MENTOR: Person = { email: "mentor@edualttech.demo", firstName: "Maya", lastName: "Mentor" };
const STUDENTS: Person[] = [
  { email: "student1@edualttech.demo", firstName: "Sam", lastName: "Student" },
  { email: "student2@edualttech.demo", firstName: "Riya", lastName: "Learner" },
  { email: "student3@edualttech.demo", firstName: "Arjun", lastName: "Pupil" },
];

function adminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Creates (or reuses) the Supabase auth identity for a person, returning its id. */
async function ensureAuthUser(admin: SupabaseClient, p: Person): Promise<string> {
  const email = p.email.toLowerCase();

  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw new Error(`listUsers failed: ${listErr.message}`);
  const existing = listed?.users.find((u) => u.email?.toLowerCase() === email);
  if (existing) {
    console.log(`  auth: reuse  ${email} (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: p.firstName, last_name: p.lastName },
  });
  if (error || !data.user) throw new Error(`createUser ${email} failed: ${error?.message}`);
  console.log(`  auth: create ${email} (${data.user.id})`);
  return data.user.id;
}

/** Upserts the Prisma User row (id === Supabase auth id). */
async function ensureDbUser(p: Person, id: string): Promise<string> {
  const email = p.email.toLowerCase();
  const user = await prisma.user.upsert({
    where: { email },
    update: { id, firstName: p.firstName, lastName: p.lastName, isActive: true },
    create: {
      id,
      email,
      firstName: p.firstName,
      lastName: p.lastName,
      role: "USER",
      emailVerifiedAt: new Date(),
      mobile: "+910000000000",
      mobileVerifiedAt: new Date(),
      onboardingDone: true,
    },
  });
  console.log(`  db:   upsert ${email} -> ${user.id}`);
  return user.id;
}

async function main(): Promise<void> {
  const admin = adminClient();

  console.log("\n[1/4] Creating users");
  const mentorId = await ensureDbUser(MENTOR, await ensureAuthUser(admin, MENTOR));
  const studentIds: string[] = [];
  for (const s of STUDENTS) {
    studentIds.push(await ensureDbUser(s, await ensureAuthUser(admin, s)));
  }

  console.log("\n[2/4] Creating course");
  const course = await prisma.course.upsert({
    where: { slug: COURSE_SLUG },
    update: { status: "PUBLISHED", createdById: mentorId },
    create: {
      slug: COURSE_SLUG,
      title: "Intro to Web Development (Demo)",
      description: "Demo course used to populate mentors and learners.",
      category: "General",
      gradeLevel: "Beginner",
      pricePaise: 0,
      status: "PUBLISHED",
      createdById: mentorId,
      roadmapTitle: "Your first steps into the web",
      roadmapSummary: "HTML, CSS and JavaScript foundations.",
    },
  });
  console.log(`  course: ${course.title} (${course.id})`);

  console.log("\n[3/4] Assigning mentor to course");
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${mentorId} FOR UPDATE`;
    await tx.courseParticipant.upsert({
      where: { courseId_userId: { courseId: course.id, userId: mentorId } },
      update: { role: "MENTOR", status: "ACTIVE", capacity: 20 },
      create: { courseId: course.id, userId: mentorId, role: "MENTOR", status: "ACTIVE", capacity: 20 },
    });
  });
  console.log(`  mentor seat ready for ${MENTOR.email}`);

  console.log("\n[4/4] Enrolling students");
  for (let i = 0; i < studentIds.length; i++) {
    const userId = studentIds[i]!;
    const email = STUDENTS[i]!.email.toLowerCase();
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      const existing = await tx.courseParticipant.findUnique({
        where: { courseId_userId: { courseId: course.id, userId } },
        select: { id: true },
      });
      if (existing) {
        console.log(`  learner: exists ${email}`);
        return;
      }
      await tx.courseParticipant.create({
        data: { courseId: course.id, userId, role: "LEARNER", status: "ACTIVE", mentorUserId: mentorId },
      });
      await tx.conversation.upsert({
        where: { courseId_learnerUserId: { courseId: course.id, learnerUserId: userId } },
        update: { mentorUserId: mentorId },
        create: { courseId: course.id, learnerUserId: userId, mentorUserId: mentorId },
      });
      console.log(`  learner: enrolled ${email} -> mentor ${MENTOR.email}`);
    });
  }

  console.log("\n──────── SUMMARY ────────");
  console.log(`Course : ${course.title}  (slug: ${COURSE_SLUG})`);
  console.log(`Mentor : ${MENTOR.email}  (${mentorId})`);
  for (const s of STUDENTS) console.log(`Student: ${s.email}`);
  console.log(`Password for all 4 accounts: ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("\n[demo] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
