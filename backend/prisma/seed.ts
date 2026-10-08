import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const firstName = process.env.ADMIN_FIRST_NAME ?? "Admin";
  const lastName = process.env.ADMIN_LAST_NAME ?? "EduAltTech";

  // Platform settings the app reads on first use.
  await prisma.setting.upsert({
    where: { key: "mentor_capacity" },
    update: {},
    create: { key: "mentor_capacity", value: 20 },
  });

  if (!email || !password) {
    console.log("[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set — created settings only.");
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.log("[seed] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping admin user.");
    return;
  }

  const admin = createClient(url, serviceKey);

  // Upsert the auth identity first — User.id IS the Supabase auth id.
  const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let authUser = existing?.users.find((u) => u.email?.toLowerCase() === email);

  if (!authUser) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    });
    if (error || !data.user) {
      console.error("[seed] failed to create Supabase auth user:", error?.message);
      return;
    }
    authUser = data.user;
    console.log(`[seed] created Supabase auth user ${email}`);
  }

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", isActive: true },
    create: {
      id: authUser.id,
      email,
      firstName,
      lastName,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`[seed] admin ready: ${email}`);
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
