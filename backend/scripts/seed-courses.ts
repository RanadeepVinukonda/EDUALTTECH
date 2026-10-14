/**
 * Replaces the entire course catalogue with the curated list in course-catalog.ts.
 *
 *   cd backend && npx tsx scripts/seed-courses.ts
 *
 * Destructive: deletes every existing course (cascades chapters/lessons/
 * participants/applications). Thumbnails live in frontend/public/media/courses.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { COURSES } from "./course-catalog";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });
  if (!admin) throw new Error("No ADMIN user found — create one before seeding courses.");

  const orders = await prisma.order.count();
  if (orders > 0) throw new Error(`Refusing to delete courses: ${orders} order(s) exist. Clear orders first.`);

  const removed = await prisma.course.deleteMany({});
  console.log(`[courses] removed ${removed.count} existing course(s)`);

  await prisma.course.createMany({
    data: COURSES.map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      type: "EDUCATION" as const,
      category: c.category,
      domain: c.domain,
      level: c.level,
      thumbnailUrl: `/media/courses/${c.slug}.jpg`,
      tags: c.tags,
      features: c.features,
      pricePaise: c.pricePaise,
      currency: "INR",
      status: "PUBLISHED" as const,
      createdById: admin.id,
      roadmapTitle: c.title,
      roadmapSummary: c.description,
    })),
  });

  console.log(`[courses] created ${COURSES.length} course(s) under ${admin.email}`);
}

main()
  .catch((err) => {
    console.error("[courses] failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
