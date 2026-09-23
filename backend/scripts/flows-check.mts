const BASE = "http://localhost:5000/api";

let pass = 0;
let fail = 0;

function check(name: string, ok: boolean, detail = ""): void {
  if (ok) {
    pass++;
    console.log(`PASS  ${name}`);
  } else {
    fail++;
    console.log(`FAIL  ${name} ${detail}`);
  }
}

async function call<T>(path: string, init: RequestInit = {}, token?: string): Promise<{ status: number; body: T }> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const body = (await res.json().catch(() => null)) as T;
  return { status: res.status, body };
}

async function main(): Promise<void> {
  const email = `smoke-${Date.now()}@example.com`;
  const password = "Password123!";

  // 1. Register a brand new user
  const reg = await call<{ data?: { user: { id: string; role: string; emailVerifiedAt: string | null }; accessToken: string; emailSent: boolean; devVerifyUrl?: string; error?: { message: string } } }>(
    "/auth/register",
    { method: "POST", body: JSON.stringify({ name: "Smoke User", email, password }) },
  );
  check("register returns 201", reg.status === 201, `got ${reg.status}`);
  check("new account role is USER", reg.body?.data?.user.role === "USER");
  check("new account is unverified", reg.body?.data?.user.emailVerifiedAt === null);

  // 2. Login before verifying must be blocked
  const blocked = await call<{ error?: { message: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  check("login blocked until email verified", blocked.status === 403, `got ${blocked.status}`);

  // 3. Dev-only helper confirms the email (real path = Supabase email link)
  const confirmed = await call("/auth/dev/confirm-email", { method: "POST", body: JSON.stringify({ email }) });
  check("dev email confirmation succeeds", confirmed.status === 200, `got ${confirmed.status}`);

  // 5. Login now works and reports onboarding step
  const login = await call<{ data: { accessToken: string; user: { emailVerifiedAt: string | null; phoneVerifiedAt: string | null; onboardingDone: boolean } } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  check("login works after verification", login.status === 200, `got ${login.status}`);
  const access = login.body.data.accessToken;
  check("phone not yet verified", login.body.data.user.phoneVerifiedAt === null);
  check("onboarding not yet done", login.body.data.user.onboardingDone === false);

  // 6. Phone OTP
  const otpSend = await call<{ data: { devOtp?: string } }>("/auth/phone/send-otp", { method: "POST", body: JSON.stringify({ phone: "+91 98765 43210" }) }, access);
  check("otp sent with dev code", typeof otpSend.body?.data?.devOtp === "string", JSON.stringify(otpSend.body));

  const wrongOtp = await call("/auth/phone/verify-otp", { method: "POST", body: JSON.stringify({ otp: "000000" }) }, access);
  check("wrong otp rejected", wrongOtp.status === 400, `got ${wrongOtp.status}`);

  const otpOk = await call<{ data: { user: { phone: string | null; phoneVerifiedAt: string | null } } }>(
    "/auth/phone/verify-otp",
    { method: "POST", body: JSON.stringify({ otp: otpSend.body.data.devOtp }) },
    access,
  );
  check("correct otp verifies phone", otpOk.status === 200 && otpOk.body.data.user.phoneVerifiedAt !== null, `got ${otpOk.status}`);

  // 7. Onboarding
  const onboard = await call<{ data: { user: { onboardingDone: boolean; interestedTopics: string[] } } }>(
    "/auth/onboarding",
    { method: "POST", body: JSON.stringify({ interestedTopics: ["Programming", "Robotics"], education: "Class 11" }) },
    access,
  );
  check("onboarding completes", onboard.status === 200 && onboard.body.data.user.onboardingDone === true, `got ${onboard.status}`);

  // 7b. Resource uploads: quota endpoint works; upload needs Supabase storage configured
  const quota = await call<{ data: { items: unknown[]; quotaBytes: number; usedBytes: number } }>("/resources/my", {}, access);
  check("my-resources quota endpoint", quota.status === 200 && quota.body.data.usedBytes >= 0, `got ${quota.status}`);
  const upload = await call<{ status: number }>("/resources/upload", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream", "x-resource-title": "Smoke doc" },
    body: new Uint8Array([1, 2, 3]),
  }, access);
  check("upload trades unconfigured(503) vs configured(201)", upload.status === 503 || upload.status === 201, `got ${upload.status}`);

  // 8. Course with a mentor requires choosing one
  const courses = await call<{ data: { items: Array<{ id: string }> } }>("/courses?limit=5");
  const courseId = courses.body.data.items[0]?.id;
  const detail = await call<{ data: { course: { mentors: Array<{ id: string; mentor: { id: string; name: string } }> } } }>(`/courses/${(await call<{ data: { items: Array<{ slug: string }> } }>("/courses?limit=1")).body.data.items[0].slug}`);
  check("course detail exposes mentors", Array.isArray(detail.body?.data?.course?.mentors));

  const mentorId = detail.body.data.course.mentors[0]?.id;
  const mentorUserId = detail.body.data.course.mentors[0]?.mentor.id;
  if (courseId && mentorId && mentorUserId) {
    const noMentor = await call("/courses/" + courseId + "/enroll", { method: "POST", body: JSON.stringify({}) }, access);
    check("enroll without mentor rejected", noMentor.status === 400, `got ${noMentor.status}`);

    const enrolled = await call<{ data: { enrollment: { courseMentorId: string | null } } }>(
      "/courses/" + courseId + "/enroll",
      { method: "POST", body: JSON.stringify({ courseMentorId: mentorId }) },
      access,
    );
    check("enroll blocked without an active plan", enrolled.status === 402, `got ${enrolled.status}`);

    const chapters = await call<{ data: { chapters: unknown[] } }>(`/chapters/mentor/${mentorUserId}`, {}, access);
    check("unpaid learner cannot read mentor chapters", chapters.status === 403, `got ${chapters.status}`);
  } else {
    check("course has a seeded mentor", false, "no mentor found on first course");
  }

  // 9. Provider workspace for the seeded mentor account
  const mentorLogin = await call<{ data: { accessToken: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "mentor@edualttech.com", password }),
  });
  check("seeded mentor can log in", mentorLogin.status === 200, `got ${mentorLogin.status}`);
  const mentorAccess = mentorLogin.body.data.accessToken;
  const mine = await call<{ data: { mentorship: Array<{ chapters: unknown[] }> } }>("/chapters/mine", {}, mentorAccess);
  check("mentor sees own mentorship", mine.status === 200 && mine.body.data.mentorship.length > 0, `got ${mine.status}`);
  check("mentor has seeded chapters", (mine.body.data.mentorship[0]?.chapters.length ?? 0) >= 3);

  // 10. Admin endpoints
  const adminLogin = await call<{ data: { accessToken: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@edualttech.com", password }),
  });
  const adminAccess = adminLogin.body.data.accessToken;
  check("seeded admin can log in", adminLogin.status === 200, `got ${adminLogin.status}`);

  const stats = await call<{ data: { users: number; providers: number } }>("/admin/stats", {}, adminAccess);
  check("admin stats uses new shape", stats.status === 200 && typeof stats.body.data.users === "number", JSON.stringify(stats.body));

  const adminCourses = await call<{ data: { courses: unknown[] } }>("/admin/courses", {}, adminAccess);
  check("admin courses list", adminCourses.status === 200 && adminCourses.body.data.courses.length > 0);

  const nonAdmin = await call("/admin/stats", {}, access);
  check("normal user blocked from admin", nonAdmin.status === 403, `got ${nonAdmin.status}`);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});