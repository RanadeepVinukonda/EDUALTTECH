# Edu-Alt-Tech — Full Website System Map

Complete technical map of the platform: frontend, backend, database, and every user flow (guest → user → mentor → admin). Written for AI-assisted improvement: it lists the actual routes, the data models each flow reads/writes, and known issues.

## 1. Big picture

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router, React 19, TypeScript, Tailwind) |
| Backend | Express 5 (TypeScript, ESM), Prisma ORM |
| Database | Postgres via Supabase (Prisma `schema.prisma`) |
| Auth | Supabase GoTrue (login/password, JWT). No OAuth providers wired. |
| Files | Supabase Storage (public bucket, raw-body PUT, no multer) |
| Payments | Razorpay (orders, checkout, webhook) |
| Email | Resend (verification codes, OTP, teacher-application alerts) |

- **Two roles only: `USER` and `ADMIN`.** A learner and a mentor are the *same* `USER` role — "provider-ness" is inferred from data (approved teacher application, mentor rows, owned courses). There is no separate teacher role.
- **Auth model:** Bearer JWT in the `Authorization` header, tokens stored in browser **localStorage** (`eat.access`, `eat.refresh`, `eat.user` cache). No cookies. Frontend `api()` helper auto-refreshes on 401 once using `/auth/refresh`.
- Frontend `middleware.ts` only handles **maintenance mode**; all role gating is client-side (admin pages gated by `admin/layout.tsx`, others by redirect checks).

---

## 2. Database (Prisma schema — all models & enums)

**DataSource:** Postgres (`DATABASE_URL` + `DIRECT_URL`). No migrations — schema pushed with `prisma db push`.

### 2.1 Enums
| Enum | Values |
|---|---|
| `Role` | `USER`, `ADMIN` |
| `TeacherApplicationStatus` | `PENDING`, `UNDER_REVIEW`, `INTERVIEW`, `APPROVED`, `REJECTED` |
| `EnrollmentStatus` | `ACTIVE`, `COMPLETED`, `DROPPED`, `SUSPENDED` |
| `LessonType` | `VIDEO`, `READING`, `QUIZ`, `ASSIGNMENT` |
| `PracticeLanguage` | `JAVASCRIPT`, `TYPESCRIPT`, `PYTHON`, `JAVA`, `CPP`, `SQL`, `OTHER` |
| `AttemptResult` | `ACCEPTED`, `WRONG_ANSWER`, `TIME_LIMIT`, `RUNTIME_ERROR`, `COMPILE_ERROR` |
| `MessageRoomType` | `CLASSROOM`, `DIRECT` |
| `OrderStatus` | `CREATED`, `PAID`, `FAILED`, `REFUNDED` |
| `PlanType` | `TRIAL` (₹1), `FULL` (₹499) |
| `VerificationChannel` | `EMAIL` |

### 2.2 Models (table → key fields → purpose)
| Table | Key columns | Purpose |
|---|---|---|
| `User` | id, email (unique), name, firstName, lastName, role, avatarUrl, schoolName, className, isActive, emailVerifiedAt, phone, phoneVerifiedAt, phoneOtpHash/ExpiresAt, interestedTopics[], education, educationBoard, educationClass, qualification, degree, college, gradYear, bio, onboardingDone | One account for students & mentors |
| `VerificationCode` | channel, identifier, codeHash (sha256 of `email:code`), attempts, verifiedAt, expiresAt | Pre-registration email-code proof of ownership; keyed by email since account doesn't exist yet |
| `WishlistItem` | userId+courseId (unique) | Saved courses |
| `LiveMeeting` | courseId, chapterId?, title, scheduledAt, durationMin, meetingUrl, createdById | Scheduled live classes |
| `AuditLog` | actorId, action, targetType, targetId, meta(Json) | Admin action trail (fire-and-forget) |
| `TeacherApplication` | userId (unique), status, subject, experience?, courseId?, resumeUrl?, message?, meetingLink?, reviewedBy/At, reviewNote | Mentor application queue |
| `Course` | slug (unique), title, description, thumbnailUrl, subject, gradeLevel, isPublished, teacherId (owner) | Course catalog |
| `CourseMentor` | courseId+mentorId (unique) | Mentors assigned to a course (teaching team) |
| `CourseChapter` | courseMentorId, title, summary, order (unique per mentor), meetingUrl?, recordingUrl?, resources(Json array) | Each mentor's own roadmap |
| `Module` | courseId, title, position | Course curriculum grouping |
| `Lesson` | moduleId, courseId, title, type, contentUrl/textContent, position, isPublished | Curriculum units |
| `Quiz` | lessonId (unique), title, passScore | Attached to a lesson |
| `QuizQuestion` | quizId, prompt, options[], correct(index), position | Quiz items |
| `QuizAttempt` | quizId, studentId, score, passed, answers(Json) | Quiz results |
| `Enrollment` | studentId+courseId (unique), courseMentorId?, status, progressPct | Course membership + chosen mentor |
| `LessonProgress` | enrollmentId+lessonId (unique), completedAt | Lesson completion |
| `PracticeProblem` | slug (unique), title, description, topic, category (default "DSA": DSA/Aptitude/Exam Prep/Science/Math/English), difficulty(1-3), language, starterCode, solution, testCases(Json) | Coding/problem practice |
| `PracticeAttempt` | problemId, studentId, result, code, runtimeMs | Attempted submissions |
| `ActivityLog` | userId+day+kind (unique), count | Daily activity tracking (dashboard) |
| `Streak` | userId (pk), current, longest, lastActiveOn | Daily streaks |
| `Resource` | title, subject, kind (pdf/doc/slides/video/link/audio), thumbnailUrl, fileUrl, fileSizeBytes, storagePath, ownerId, downloads | Library uploads |
| `ChatRoom` | courseId (unique), type (default CLASSROOM) | One classroom per course |
| `ClassroomMessage` | roomId, senderId, body, createdAt | Chat messages |
| `Notification` | senderId?, title, body, scope (ALL/COURSE/USER), courseId? | Announcements/notifications |
| `Order` | orderNumber (unique), userId, razorpayOrderId (unique), amountPaise, currency, plan, status, idempotencyKey (unique), receiptUrl | Razorpay order ledger |
| `Payment` | orderId, razorpayPaymentId (unique), signature, method, verified, rawPayload | Captured payment records |
| `WebhookEvent` | provider, eventId (unique), eventType, signature, processed, payload | Append-only webhook trail |
| `Subscription` | userId, plan, startsAt, expiresAt, orderRef, isActive | Active plan entitlement |
| `ContactMessage` | name, email, school?, subject?, body, isRead, handledAt | Contact form inbox |
| `Setting` | key, value(Json) | Key/value platform settings |

### 2.3 Where plans gate features
- **Enroll** (`POST /courses/:id/enroll`) requires an **active Subscription** (TRIAL or FULL) unless already enrolled → otherwise **402** (drives the pay modal in the UI).
- `hasActiveSubscription` flag is computed on login/`me`: any `isActive` subscription with null/future `expiresAt`.

---

## 3. Backend structure

**Mounts** (`app.ts`): `/api/auth`, `/api/courses`, `/api/practice`, `/api/resources`, `/api/chat`, `/api/notifications`, `/api/dashboard`, `/api/teachers`, `/api/payments`, `/api/admin`, `/api/contact`, `/api/chapters`, `/api/wishlist`, `/api/meetings`. Health checks at `/health` and `/api/health`.

**Middleware chain:** `requestId` → `helmet` → `cors` (single `APP_ORIGIN`) → `compression` → `express.json({limit:"2mb"})` → rate limit (600 req/15min/IP on all `/api`) → routes → `notFoundHandler` → `errorHandler`.

**Auth guards:** `requireAuth` (resolves Supabase bearer JWT → loads Prisma user; if a valid JWT has no Prisma row it lazily synthesizes a `USER`) · `requireRole("ADMIN")` · `optionalAuth` (exists but unused on all routes). Per-route inline helpers: `isParticipant` (chat), chapter ownership checks, meeting manage checks.

**Env vars (see `backend/src/config/env.ts`):** `DATABASE_URL`*, `SUPABASE_URL`*, `SUPABASE_SERVICE_ROLE_KEY`*, `SUPABASE_ANON_KEY`*, `NODE_ENV`, `PORT`, `APP_ORIGIN`, `APP_BASE_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `SUPABASE_STORAGE_BUCKET` (default `resources`), `MAX_UPLOAD_BYTES` (25 MB), `QUOTA_PER_USER_BYTES` (100 MB), `LOG_LEVEL`. (*required at boot; email/payments are lazy — boot OK without, routes fail soft.)

---

## 4. Guests (pre-login) — flows, endpoints, DB

Guest nav: **Home, About, Services, Contact us** + **Log in / Sign up** buttons. Global **GuideBubble** bottom-right shows a 3-step "new around here" intro (create account → pick course & mentor → learn/practice/ask) with Sign up / Browse courses CTAs.

### 4.1 Landing `/` (public, static SEO)
- Server component + `HomeLanding`. Meta + Organization JSON-LD.
- No DB reads (all marketing copy). No AI claims.

### 4.2 About & Services `/about`, `/services` (public, static)
- Static marketing. No DB. `/services` describes the parent-group offering (websites, ERP, AI services, classroom programs, teacher training) — these are **business pages, not app features**.

### 4.3 Contact `/contact` (public)
- Form: `{name, email, body}` required; `school, subject, website` optional. **`website` is a honeypot** — if non-empty the API fakes success and stores nothing.
- **POST `/api/contact`** (rate-limited 5/15min) → writes `ContactMessage` row. Read later by admin at `/admin/messages`.

### 4.4 Course catalog `/courses` (public)
- **GET `/api/courses?subject=&search=&page=&limit=`** → published `Course` rows + teacher name + `_count` enrollments/modules. Uses `iLIKE` search on title/description.
- Card links to `/courses/<slug>`.

### 4.5 Course detail `/courses/<slug>` (public to view; actions need login)
- **GET `/api/courses/:slug`** → course, teacher, **mentors** (each with their `CourseChapter` roadmaps incl. meeting/recording/resource links), published modules→lessons, enrollment count. Unpublished/missing → 404.
- Guest actions bounce to `/login`: enroll, wishlist heart, live-meeting list, **CourseChat**.
- **Upcoming classes**: `GET /api/meetings/course/:courseId` (guest gets 403 → box hidden).

### 4.6 Practice browser `/practice` (public)
- **GET `/api/practice?topic=&category=&language=&difficulty=&page=&limit=`** → `PracticeProblem` list (category chips: DSA/Aptitude/Exam Prep; topic chips per problem).
- Problem detail `/practice/<slug>`: **GET `/api/practice/:slug`** (description + starterCode). Attempting requires login; guest attempts silently reject.

### 4.7 Resources library `/resources` (public browsing)
- **GET `/api/resources?subject=&kind=&search=&page=&limit=`** → published `Resource` rows with thumbnails.
- **POST `/api/resources/:id/download`** (public) bumps `downloads`, returns `fileUrl`.

### 4.8 Auth pages (public)
- **`/login`** → `POST /api/auth/login` → Supabase `signInWithPassword` → status check (`isActive`) → `{user + isProvider + hasActiveSubscription, accessToken, refreshToken}` → tokens saved to localStorage → redirect through the funnel (`nextAuthPath`).
- **`/register`** → see §5 signup ceremony.
- **`/verify-email`** → email-entry + resend: `POST /api/auth/resend-verification` (Supabase link resend). Cross-tab detection via `eat:email-verified:<email>` localStorage key.
- **`/auth/callback`** → Supabase email-confirm landing; exchanges `?code` and marks `eat:email-verified:<email>` (does NOT auto sign in).

### 4.9 The funnel after any login (also after onboarding steps)
`nextAuthPath(user)`: ADMIN → `/admin` · email not verified → `/verify-email` · phone not verified → `/verify-phone` · onboarding not done → `/onboarding` · else → `/dashboard`.

---

## 5. Signup flow (pre-login, the "foot in the door")

**Goal:** prove email ownership by code **before** creating the account, so no confirmation-link round trip is needed.

1. **Send code** — `POST /api/auth/send-email-code` `{email}` (rate 20/15min; 409 if account exists). Server: 6-digit code, stores `sha256(email:code)` in `VerificationCode`, 10-min TTL, replaces prior unverified code, purges expired. Email via Resend; **send failure does not fail the request** (`emailSent:false`); outside production returns `devOtp` so dev/tests can continue.
2. **Verify code** — `POST /api/auth/verify-email-code` `{email, code}`. Timing-safe compare; **5 wrong attempts delete the code** (lockout); idempotent on already-verified; sets `verifiedAt`. The register page's modal disables submit until this succeeds.
3. **Register** — `POST /api/auth/register` `{firstName, lastName, email, password, phone?, education?, educationBoard?, educationClass?, qualification?, degree?, college?, gradYear?, interestedTopics[]}` (rate 20/15min). **Requires a verified unexpired EMAIL code** (else 400) — that's the anti-spam gate. 409 if email exists. Creates Supabase auth user (`email_confirm:true`, no confirmation email — code already proved ownership) **and** the Prisma `User` row in the same request (id = Supabase UUID). Deletes all codes for that email (single-use). Returns `{user}` with **no tokens** — the client must log in.
4. **Login** — `POST /api/auth/login` → funnel. Guest who registers lands back at `/login?created=1&email=`.

**DB touched by signup:** `VerificationCode` (write/verify/delete), `auth.users` (via Supabase), `User` (create).

**Other pre-login auth endpoints:** `POST /api/auth/refresh` (`refreshSession`); `POST /api/auth/dev/confirm-email` (dev-only, 404 in production — simulates clicking the confirm link); `POST /api/auth/logout` (revokes token, user only).

---

## 6. Signed-in USER — flows, endpoints, DB

User nav: **Dashboard, Courses, Practice, Resources** + name pill (bell → `/notifications`, Dashboard, Sign out). GuideBubble switches to personal mode (see §6.9). Root `layout.tsx` mounts `SiteHeader`, `SiteFooter`, `GuideBubble` on **every** page.

### 6.1 Dashboard `/dashboard` (USER)
- **GET `/api/dashboard/me`** aggregates: enrollments (with course + progress), 10 latest `QuizAttempt` scores, `PracticeAttempt` grouped by result, `Streak`, 30-day `ActivityLog`. Computes `avgQuizScore`.
- Metric cards: enrolled count, avg quiz %, current streak, problems solved + progress bars on my courses + recent quiz scores.

### 6.2 Course enroll, wishlist, pay (on `/courses/<slug>`)
- **Wishlist** — `GET /api/wishlist` · `POST /api/wishlist/:courseId` (upsert, idempotent) · `DELETE /api/wishlist/:courseId` (quiet `deleteMany`). DB: `WishlistItem`.
- **Enroll** — `POST /api/courses/:id/enroll` `{courseMentorId?}`:
  - Mentors exist → `courseMentorId` required and must match.
  - **No active subscription, not already enrolled → 402** → frontend opens the Razorpay modal.
  - Else: upsert `Enrollment` (ACTIVE), write `ActivityLog` (kind "lesson"), return enrollment.
  - DB: `Enrollment`, `Subscription` (check), `ActivityLog`.
- **Pay modal (Razorpay, inline on course page):**
  1. `POST /api/payments/orders` `{plan: TRIAL|FULL, idempotencyKey: "enroll-<courseId>-<uuid>"}` → idempotent by key (reuse returns `reused:true`, different user on same key → 403; same-plan active subscription → 409) → creates Razorpay order then writes `Order` row (CREATED) only after Razorpay accepts.
  2. Lazy-loads `checkout.razorpay.com/v1/checkout.js`, opens checkout with `order_id`.
  3. Success handler → `POST /api/payments/verify` `{razorpay_order_id, razorpay_payment_id, razorpay_signature}` → HMAC check → **ACID idempotent transition** (`updateMany WHERE status=CREATED`; if 0 rows a racing webhook already activated — adopt) → `Payment` + `Subscription` rows.
  4. Re-POST enroll (now 200), refresh `GET /api/auth/me` → `updateCachedUser`.
  - Webhook safety net: `POST /api/payments/webhook` (raw body, `x-razorpay-signature` HMAC) — append-only `WebhookEvent` ledger, duplicate-safe, same guarded `Subscription` creation on `payment.captured`/`order.paid`. Exactly one path can activate a plan per order.
  - DB: `Order`, `Payment`, `Subscription`, `WebhookEvent`.
- **No plan management page** — `/orders` is read-only history. Plan purchase happens only at the enroll-402 moment.

### 6.3 Courseware (now enrolled)
- **Lesson completion** — `POST /api/courses/lessons/:lessonId/complete` (enrolled only) → `LessonProgress` row, recomputes `Enrollment.progressPct`, flips COMPLETED at 100%, `ActivityLog` increment.
- **Quiz** — attempts stored via `QuizAttempt` (score, passed, answers JSON). Shown on dashboard "recent quiz scores".

### 6.4 Course chat (localized per course)
- Chat lives **only inside the course page** (`<CourseChat courseId>` at the bottom of `/courses/<slug>`). No global chat page, no nav entry, no websockets — messages **poll every 5 s**.
- **`GET /api/chat/rooms/course/:courseId`** (participant: admin / owner / mentor / ACTIVE-enrolled) **lazy-creates one CLASSROOM `ChatRoom` per course** (upsert on unique `courseId`).
- **`GET /api/chat/rooms/:id/messages?before=&limit=`** cursor pagination (participant only) · **`POST /api/chat/rooms/:id/messages`** `{body ≤2000}` → `ClassroomMessage`.
- DB: `ChatRoom`, `ClassroomMessage`.

### 6.5 Practice attempts (on `/practice/<slug>`)
- JS-only sandbox judge (1500 ms timeout). Server evaluates against stored `testCases`, server-side.
- **`POST /api/practice/:id/attempts`** `{code}` → verdict (`PracticeAttempt` row, `ActivityLog` increment) · **`GET /api/practice/:id/attempts/me`** → last 20.
- DB: `PracticeAttempt`.

### 6.6 Resources (library + my uploads)
- **Upload** — `POST /api/resources/upload` (USER, raw octet-stream body; metadata via headers `x-resource-title`, `x-resource-subject`, `x-resource-kind`, `x-resource-file`, `x-resource-mime`, `x-resource-thumb`). Limits: per-file 25 MB, **lifetime quota 100 MB** (sum of `fileSizeBytes` on storage-backed rows). PUTs bytes to Supabase Storage (path `{userId}/{uuid}-{name}`, overwrites impossible), then writes `Resource` row. DB + Storage.
- **My uploads** — `GET /api/resources/my` → items + `{quotaBytes, usedBytes}`. Displayed on `/resources` (my tab).
- **Delete** — `DELETE /api/resources/:id` (owner): deletes storage object (failure swallowed), then row.
- DB: `Resource`.

### 6.7 Notifications (bell → `/notifications`)
- **`GET /api/notifications`** → 50 latest (scope ALL + COURSE I'm enrolled in/sent by me + sent by me; admin sees all). **⚠️ Known bug: this handler has no `requireAuth` yet reads `req.user` — anonymous request 500s.**
- **Create** (owner/mentor of that course or admin): `POST /api/notifications` `{title, body, scope: ALL|COURSE|USER, courseId?}` (COURSE scope requires ownership/mentorship; `courseId` rejected outside COURSE).
- DB: `Notification`.

### 6.8 Profile & account
- **`/profile`** — `PATCH /api/auth/me` `{name, interestedTopics[≤20], schoolName?, className?, education?, bio?}` · change password `POST /api/auth/change-password` `{currentPassword, newPassword}` (no current-password check on server by design — live session is proof; revokes token, forces re-login). Guard: no last-active-admin demotion, etc. (user side only).
- **Phone verification** — `POST /api/auth/phone/send-otp` `{phone}` (OTP emailed via Resend — **no SMS provider wired**, `devOtp` in dev) → `POST /api/auth/phone/verify-otp` `{otp}` → sets `phoneVerifiedAt`. Funnel step 2.
- **`/verify-phone`** — the funnel's step-2 page (send → verify → `nextAuthPath`).

### 6.9 Onboarding (funnel step 3)
- **`/onboarding`** — "Step 3 of 3": 12 topic chips + `education` (required) + `bio?` → `POST /api/auth/onboarding` → sets `interestedTopics`, `education`, `onboardingDone:true`.
- DB: `User`.

### 6.10 GuideBubble (post-login, no LLM)
- Reads cached user (name, `interestedTopics`, `isProvider`).
- **Suggested career paths** — static regex keyword map (programming/code/web/django/react/python → Software & web development; data/SQL/ML/AI → Data science; physics/circuits → Engineering; chem → Chemical; bio/medicine → Life sciences; math/quant → Math/data/finance; english/writing → Communication; GATE/JEE/NEET → Exam-prep; design/UI/UX → Design; business/marketing → Business). Max 3, dedup, no interests → "shape your path" → `/onboarding`.
- **Mentoring guidance** — branches on `isProvider` ("teach one idea per chapter" vs "pick any course → Mentor this course").
- **Quick tips** — static list.
- No AI, no course-level guidance (mentoring is human).

---

## 7. Mentor (teacher) — the USER-as-provider side

Still `Role.USER`. "Provider-ness" (`isProvider`) = approved `TeacherApplication` ∨ any `CourseMentor` row ∨ owns ≥1 course.

### 7.1 Apply to mentor
- **`/teachers/apply`** (guest → "create account first"; existing application → status screen P/UNDER_REVIEW/INTERVIEW/APPROVED/REJECTED with interview link).
- **`POST /api/teachers/apply`** `{courseId?, subject, experience?, qualifications?, resumeUrl?, message?}`. 409 if already PENDING. Optional `courseId` (must exist; 409 if already a mentor there). Upsert resets to PENDING, clears review fields. **Emails all active admins.** 201.
- **`GET /api/teachers/me`** → my application (or null). DB: `TeacherApplication`.
- Preselect: opener `/teachers/apply?course=<slug>` from the course page's **"Mentor this course"** button.

### 7.2 Mentor workspace `/teacher` (USER, 401 → error)
- **`GET /api/teachers/panel`** → courses I own/mentor (admin: all) with counts + active students + my last 10 outgoing notifications.
- **CRUD roadmaps** — my `CourseMentor` rows + chapters: `GET /api/chapters/mine` · `POST /api/chapters` (order auto = last+1; `{courseMentorId, title, summary?, meetingUrl?, recordingUrl?, resources[] ≤30}`) · `PATCH /api/chapters/:id` · `PATCH /api/chapters/:id/order` (409 if position taken) · `DELETE /api/chapters/:id`. Owner-gated (chapter's mentor or admin).
- **Mentor-chapter visibility for students** — `GET /api/chapters/mentor/:mentorId` (self, admin, or ACTIVE enrollment under that mentor).
- **Schedule live classes** — `POST /api/meetings` `{courseId, title, scheduledAt, meetingUrl}` (future enforced, 15–480 min) **automatically creates a COURSE-scope notification** → `PATCH /api/meetings/:id` · `DELETE` (manage-gated).
- DB: `CourseMentor`, `CourseChapter`, `LiveMeeting`, `Notification`, `Course`.
- **Students pick their mentor** at enroll time (`Enrollment.courseMentorId`) — mentors own a cohort + their own chapter roadmap. Course chat is shared per course (single `ChatRoom` per course, not per mentor).

---

## 8. ADMIN — full platform control

Admin nav: **Overview, Users, Applications, Courses & mentors, Orders, Webhooks, Messages, Settings**. Gate: `admin/layout.tsx` (spinner → redirect non-admin to `/dashboard`, signed-out to `/login`). All `/api/admin/*` are `requireAuth` + `requireRole("ADMIN")` with fire-and-forget `AuditLog` on mutations.

| Page | Endpoint(s) | Data |
|---|---|---|
| `/admin` | `GET /api/admin/stats` | Counts: users, admins, providers (mentor rows), courses, enrollments, unread contacts, PAID FULL/TRIAL orders, resources |
| `/admin/users` | `GET /api/admin/users?role=&search=` · `POST /api/admin/users` (create account, email pre-confirmed, `onboardingDone:true`) · `PATCH /api/admin/users/:id` `{isActive, role}` (refuses self-change & demoting the **last admin**, role change forces Supabase sign-out) · `DELETE /api/admin/users/:id` (refuses self & last admin; deletes Prisma row + Supabase identity so email reusable) | `User`, `auth.users` |
| `/admin/applications` | `GET /api/admin/applications` (all + applicant + course) · `POST /api/admin/applications/:id/review` `{status, reviewNote?, meetingLink?}` (INTERVIEW requires link; **APPROVED + courseId → transactionally creates `CourseMentor`**, no role change; emails applicant per status; audit) | `TeacherApplication`, `CourseMentor` |
| `/admin/courses` | `GET /api/admin/courses` (all + mentors + counts) · `POST /api/courses` (create; slug auto-derived) · `POST /api/admin/courses/:id/mentors` `{mentorId}` · `DELETE /api/admin/courses/:id/mentors/:mentorId` · thumbnail upload `POST /api/courses/thumbnail` (raw image body, `x-thumbnail-mime`) | `Course`, `CourseMentor`, `Module` |
| `/admin/orders` | `GET /api/payments/orders?status=&page=&limit=` | Full `Order` ledger incl. user |
| `/admin/webhooks` | `GET /api/payments/webhook-events` | Last 100 raw `WebhookEvent` (`eventId, eventType, processed, receivedAt`) |
| `/admin/messages` | `GET /api/admin/messages` (last 100) · `PATCH /api/admin/messages/:id` `{isRead}` | `ContactMessage` |
| `/admin/settings` | `GET /api/admin/settings` · `PUT` `{key, value}` (JSON-parsed) | `Setting` |
| `/admin/audit` | `GET /api/admin/audit?targetType=&page=` | `AuditLog` incl. actor |

**Mentor assignment model:** admin can assign any active `USER` as mentor on a course directly (without an application). Mentors edit only their chapters — never the course itself (teacher/owner or admin).

---

## 9. Security & data-integrity notes (before "improving")

| Concern | Current posture |
|---|---|
| Email proof | Code verified **before account creation**; 5-attempt lockout; rate limits; address-enumeration-safe responses; `devOtp` only outside production |
| Session | Bearer JWT stored in localStorage (XSS-resilient? yes/no — **localStorage is readable by injected JS**, a Tradeoff to review) |
| Rate limits | Global 600/15min + auth-sensitive 20/15min + contact 5/15min |
| CORS | Single origin; helmet; 2 MB body cap |
| Payments | HMAC signatures (verify + webhook), idempotency keys, guarded ACID transitions, append-only webhook ledger, unknown events skipped |
| Uploads | Pre-buffered size checks (no streaming), per-file + per-user quota, storage-path collision-free (uuid), `x-upsert:false` |
| Abuse gates | Contact honeypot; register requires verified email; enroll requires paid plan; mentor application gated by review |
| Auditing | Admin mutations audit-logged; webhook events append-only |

## 10. Known issues / dead code (good first fixes for AI)

1. 🐞 **`GET /api/notifications` missing `requireAuth`** → anonymous 500. Needs the guard (or `optionalAuth`).
2. `bcryptjs` + `jsonwebtoken` in `backend/package.json` — **unused** (Supabase GoTrue does hashing/tokens). Drop.
3. `optionalAuth` middleware unused — can delete or wire in.
4. Enroll writes `ActivityLog` kind `"lesson"` (collision with lesson-complete) — should be a distinct kind.
5. `ActivityLog.kind` still includes `"ai"` from the removed AI tutor — leftover string.
6. `backend/dist/` contains a stale `ai` module (not in `src/`, not mounted) — clean build artifact.
7. Frontend: no server-side auth gating — any page's API call determines visibility; route-level guards are client-side only.
8. No migrations — schema changes are destructive `prisma db push` (fine in dev, risk in prod).
9. `optionalAuth` absence means `/api/notifications` create is owner-checked but GET isn't gated (see #1).
10. Practice judge is JS-only — other `PracticeLanguage` skills submit but get 400.

## 11. Deploy

- Backend: Node/Express (Express 5), listens `PORT` (default 5000), deployed on Render.
- Frontend: Next.js, deployed separately; `NEXT_PUBLIC_API_BASE` points at the backend (default dev: `http://localhost:3000/backend` proxy).
- DB + Auth + Storage: Supabase project.
- After any `schema.prisma` change in prod: run `prisma db push` in `backend/`, then redeploy both services.