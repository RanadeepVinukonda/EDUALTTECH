/**
 * Clean-slate reset: drops the entire public schema and recreates it.
 *
 *   npm run db:reset            → drop + create schema + prisma db push + generate
 *   npm run db:reset -- --keep  → (not supported; resets are total by design)
 *
 * Irreversible. The tagged commit archive/pre-clean-slate holds the old schema.
 */
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

async function main() {
  const prisma = new PrismaClient();
  await prisma.$executeRawUnsafe(`DROP SCHEMA public CASCADE`);
  await prisma.$executeRawUnsafe(`CREATE SCHEMA public`);
  await prisma.$disconnect();
  console.log("schema public dropped + recreated");

  execSync("npx prisma db push", { stdio: "inherit" });
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("db push + client generated");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
