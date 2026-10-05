/**
 * Wipe every row in the database except the admin accounts.
 *
 *   npm run wipe            → dry run: prints the table list and row counts, changes nothing
 *   npm run wipe -- --yes            → executes (asks for --storage to also empty storage buckets)
 *   npm run wipe -- --yes --storage   → also deletes every file in every bucket
 *
 * Irreversible. No pg_dump on this machine, so there is no safety net — the dry run
 * exists so you can see exactly what goes before it goes.
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const KEEP_TABLE = "User"; // admin profile row(s) survive

const args = new Set(process.argv.slice(2));
const confirmed = args.has("--yes");
const wipeStorage = args.has("--storage");

type Bucket = { name: string; files: number };

async function main() {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>(
    Prisma.sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
  );
  const wipe = tables.map((t) => t.tablename).filter((t) => t !== KEEP_TABLE);

  const counts: Array<{ table: string; rows: number }> = [];
  for (const table of wipe) {
    const [{ count }] = await prisma.$queryRaw<Array<{ count: bigint }>>(
      Prisma.sql`SELECT count(*)::bigint AS count FROM ${Prisma.raw(`"${table}"`)}`,
    );
    counts.push({ table, rows: Number(count) });
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true, name: true },
    orderBy: { email: "asc" },
  });
  const otherUsers = await prisma.user.count({ where: { role: { not: "ADMIN" } } });

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const buckets: Bucket[] = [];
  const { data: bucketList } = await supabase.storage.listBuckets();
  for (const b of bucketList ?? []) {
    const { data: files } = await supabase.storage.from(b.name).list("", { limit: 1000 });
    buckets.push({ name: b.name, files: files?.length ?? 0 });
  }

  console.log(`\nTABLES TO WIPE (${wipe.length})`);
  for (const c of counts) console.log(`  ${c.table.padEnd(24)} ${String(c.rows).padStart(6)} rows`);
  console.log(`\nKEEPING "${KEEP_TABLE}"`);
  for (const a of admins) console.log(`  admin  ${a.email}  (${a.name})`);
  console.log(`  ${otherUsers} non-admin profile row(s) will be deleted`);
  console.log(`\nSTORAGE BUCKETS (${buckets.length})`);
  for (const b of buckets) console.log(`  ${b.name.padEnd(24)} ${String(b.files).padStart(6)} files  ${wipeStorage ? "-> DELETED" : "kept (pass --storage to wipe)"}`);

  if (!confirmed) {
    console.log(`\nDry run. Nothing was changed. Re-run with --yes to execute.`);
    return;
  }

  // CASCADE never touches User: other tables reference it, it references nothing.
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${wipe.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );

  const gone = await prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } });

  // Auth users that match a deleted profile must go too, or they can still sign in.
  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const adminEmails = new Set(admins.map((a) => a.email.toLowerCase()));
  const removedAuth: string[] = [];
  for (const u of authUsers?.users ?? []) {
    const email = (u.email ?? "").toLowerCase();
    if (!email || adminEmails.has(email)) continue;
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (!error) removedAuth.push(email);
  }

  if (wipeStorage) {
    for (const b of buckets) {
      const { data: files } = await supabase.storage.from(b.name).list("", { limit: 1000 });
      for (const f of files ?? []) await supabase.storage.from(b.name).remove([f.name]);
    }
  }

  console.log(`\nDone. ${wipe.length} tables emptied, ${gone.count} profile(s) deleted, ${removedAuth.length} auth user(s) deleted.`);
  console.log(`Admin login intact: ${admins.map((a) => a.email).join(", ")}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());