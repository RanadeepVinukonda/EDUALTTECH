import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const course = await prisma.course.findUnique({
    where: { slug: "intro-to-web-development-demo" },
    include: {
      createdBy: { select: { email: true } },
      participants: {
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
        orderBy: { enrolledAt: "asc" },
      },
    },
  });
  if (!course) {
    console.log("no demo course found");
    return;
  }
  console.log(`COURSE: ${course.title} (${course.slug})  status=${course.status}  owner=${course.createdBy.email}`);
  console.log(`PARTICIPANTS (${course.participants.length}):`);
  for (const p of course.participants) {
    console.log(`  ${p.role.padEnd(7)} ${p.user.email.padEnd(30)} ${p.user.firstName} ${p.user.lastName}`);
  }
  const users = await prisma.user.findMany({
    where: { email: { endsWith: "@edualttech.demo" } },
    select: { email: true, role: true },
    orderBy: { email: "asc" },
  });
  console.log(`\nALL DEMO ACCOUNTS (${users.length}):`);
  for (const u of users) console.log(`  ${u.role.padEnd(6)} ${u.email}`);
}

main().finally(() => prisma.$disconnect());
