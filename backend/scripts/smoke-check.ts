// End-to-end smoke check against a running backend.
// Usage:  npx tsx scripts/smoke-check.ts            (defaults to http://localhost:5000)
//         CHECK_BASE=https://your-api npx tsx scripts/smoke-check.ts
const BASE = process.env.CHECK_BASE ?? "http://localhost:5000";

let pass = 0;
let fail = 0;

function record(name: string, ok: boolean, detail = ""): void {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}${detail ? "  - " + detail : ""}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? "  - " + detail : ""}`);
  }
}

async function get<T>(path: string, token?: string): Promise<{ status: number; body: T | null }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let body: T | null = null;
  try {
    body = (await res.json()) as T;
  } catch {
    /* non-json */
  }
  return { status: res.status, body };
}

async function login(email: string): Promise<string | null> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Demo@12345" }),
  });
  const body = (await res.json().catch(() => null)) as { data?: { accessToken?: string } } | null;
  return body?.data?.accessToken ?? null;
}

async function main(): Promise<void> {
  console.log(`\nSmoke check against ${BASE}\n`);

  console.log("[ server ]");
  const health = await get<{ data?: { ok?: boolean } }>("/health");
  record("GET /health 200", health.status === 200 && health.body?.data?.ok === true);

  console.log("\n[ database-backed public API ]");
  const courses = await get<{ data?: { total?: number } }>("/api/courses");
  record("GET /api/courses 200", courses.status === 200, `total=${courses.body?.data?.total}`);
  const cats = await get("/api/courses/categories");
  record("GET /api/courses/categories 200", cats.status === 200);

  console.log("\n[ authentication ]");
  const admin = await login("admin@edualttech.demo");
  const mentor = await login("mentor@edualttech.demo");
  const student = await login("student1@edualttech.demo");
  record("login admin", !!admin);
  record("login mentor", !!mentor);
  record("login student1", !!student);
  if (!admin || !mentor || !student) return;

  console.log("\n[ role-gated API ]");
  const me = await get<{ data?: { user?: { role?: string } } }>("/api/auth/me", admin);
  record("admin GET /api/auth/me", me.status === 200 && me.body?.data?.user?.role === "ADMIN");

  const stats = await get<{ data?: { users?: number; courses?: { total?: number }; enrollments?: number } }>(
    "/api/admin/stats",
    admin,
  );
  record(
    "admin GET /api/admin/stats",
    stats.status === 200 && typeof stats.body?.data?.users === "number",
    `users=${stats.body?.data?.users}, courses=${stats.body?.data?.courses?.total}, enrollments=${stats.body?.data?.enrollments}`,
  );

  const noAuth = await get("/api/admin/stats");
  record("admin route rejects no token (401)", noAuth.status === 401);

  const studentBlocked = await get("/api/admin/stats", student);
  record("admin route rejects student (403)", studentBlocked.status === 403);

  console.log("\n[ course / mentor / learner flow ]");
  const mine = await get<{ data?: { mentoring?: Array<{ course?: { title?: string } }> } }>(
    "/api/courses/mine",
    mentor,
  );
  const mentoring = mine.body?.data?.mentoring ?? [];
  record("mentor owns a course", mentoring.length > 0, mentoring.map((m) => m.course?.title).join(", "));

  const dash = await get<{
    data?: { learning?: Array<{ course?: { title?: string }; mentor?: { firstName?: string; lastName?: string } | null }> };
  }>("/api/dashboard", student);
  const learning = dash.body?.data?.learning ?? [];
  const first = learning[0];
  record(
    "student enrolled + assigned mentor",
    learning.length > 0 && !!first?.mentor,
    first ? `${first.course?.title} -> ${first.mentor?.firstName} ${first.mentor?.lastName}` : "",
  );

  console.log(`\n──────── ${pass} passed, ${fail} failed ────────\n`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error("smoke check crashed:", err);
  process.exitCode = 1;
});
