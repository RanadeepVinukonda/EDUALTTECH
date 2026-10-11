import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const EMAIL = "admin@edualttech.demo";
const PASSWORD = "Demo@12345";

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in backend/.env");

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw new Error(`listUsers failed: ${listErr.message}`);
  let authUser = listed?.users.find((u) => u.email?.toLowerCase() === EMAIL);

  if (!authUser) {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: "Admin", last_name: "EduAltTech" },
    });
    if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
    authUser = data.user;
    console.log(`[admin] created Supabase auth user ${EMAIL}`);
  } else {
    console.log(`[admin] reusing Supabase auth user ${EMAIL}`);
  }

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { id: authUser.id, role: "ADMIN", isActive: true },
    create: {
      id: authUser.id,
      email: EMAIL,
      firstName: "Admin",
      lastName: "EduAltTech",
      role: "ADMIN",
      emailVerifiedAt: new Date(),
      mobile: "+910000000000",
      mobileVerifiedAt: new Date(),
      onboardingDone: true,
    },
  });

  console.log(`[admin] ready: ${user.email} (${user.id})  password: ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("[admin] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
