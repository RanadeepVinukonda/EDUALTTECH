# EduAltTech — Improvement Plan (audit → problems → priority)

Pair with `WEBSITE-MAP.md` (system map) — this doc is the gap analysis against the master spec, then the execution order.

Status legend: ✅ done · ⚠️ partial · ❌ missing · 🔴 bug/unacceptable

---

## A. Security & correctness (🔴 — fix first)

| # | Item | Status | Note |
|---|---|---|---|
| A1 | 🔴 `GET /api/notifications` has **no `requireAuth`** but reads `req.user` → anonymous 500. | 🔴 | Add guard. |
| A2 | 🔴 Auth tokens in **localStorage**, readable by any injected JS. Spec requires HttpOnly/secure cookies + short-lived access + refresh rotation. | ⚠️ | Cookie mode built (`AUTH_COOKIE=true` + `NEXT_PUBLIC_AUTH_COOKIE=1`): HttpOnly SameSite=Lax cookies, access+refresh rotation, `requireAuth`/refresh/logout cookie-aware, client never touches tokens. **Enable only when API + web share a site/subdomain** (cross-origin needs SameSite=None + credentialed CORS). Currently off by default. |
| A3 | Register's `educationLevel` state is **never submitted** (dead UI field). | ✅ | Removed (T1). |
| A4 | Enroll writes `ActivityLog` kind `"lesson"` (collides with lesson-complete). | ✅ | Now `"enroll"` (T1). |
| A5 | `ActivityLog.kind` still admits `"ai"` (AI tutor removed). | ✅ | Dropped from allowed set (T1). |
| A6 | Unused deps: `bcryptjs`, `jsonwebtoken`, `optionalAuth` middleware. | ✅ | Removed (T1). |
| A7 | Stale `backend/dist/ai` artifact + stale `.next` type refs after route deletions. | ✅ | `dist` gitignored; rebuild refreshes (T1). |
| A8 | 🔴 Phone OTP is sent **by email**, not SMS (`devOtp` leaked in non-prod responses). Spec: real SMS provider, no OTP in prod responses. | ⚠️ | Twilio Verify wiring built (`TWILIO_ACCOUNT_SID`/`AUTH_TOKEN`/`VERIFY_SERVICE_SID`); used automatically when configured, email-OTP fallback otherwise. `devOtp` never in prod. |
| A9 | 🔴 Code judge: `node:vm` in-process, JS-only. Spec: isolated sandbox w/ CPU/mem/time/net limits; advertise only supported languages. | 🔴 | Currently advertises JAVASCRIPT only (others 400 → **mismatch with advertised languages** in UI). |
| A10 | Frontend has **no server-side auth gating** — all route guards are client-side. | ⚠️ | UX-only by design; fine, but documented. |
| A11 | PDF/slides/etc. private course resources: permanent public URLs (no signed URLs). | ⚠️ | When paid-course resources exist, move to private bucket + signed URLs. |

## B. Database (foundation)

| # | Item | Status | Note |
|---|---|---|---|
| B1 | No migrations — `prisma db push` only. Spec: `prisma migrate` + committed history for prod. | 🔴 | High priority for prod safety. |
| B2 | `CourseChapter.resources Json[]` — spec wants relational `ChapterResource`/`LessonResource`. | ⚠️ | Normalize when resource auth/ordering is needed. |
| B3 | Indexes: mostly present (`@@index` on common filters); add per query-plan as new queries land. | ✅ | Review when adding work/programs/orgs. |
| B4 | No `Organization`, `MediaAsset`, `WorkItem`, `Program`, `Conversation` models yet. | ❌ | New business area (see G/H). |

## C. Auth & onboarding

| # | Item | Status | Note |
|---|---|---|---|
| C1 | A2 cookie migration affects all flows. | ⚠️ | Cookie mode built + opt-in flag; login/refresh/logout/OAuth/forgot all cookie-aware. Enable per deployment. |
| C2 | OAuth (Google/Microsoft) — not wired. | ⚠️ | Wired: `/auth/oauth/url` + login buttons + `/auth/oauth/import` (profile sync + cookies). Needs Supabase provider creds to go live. |
| C3 | Forgot/reset password — via Supabase not wired. | ✅ | `/auth/forgot-password` (enumeration-safe) + `/reset-password` page (T3). |
| C4 | Phone verification — see A8. | ⚠️ | Twilio Verify auto-used when configured (T3). |
| C5 | Onboarding = single step (topics + education) — matches "keep short". | ✅ | Good. |

## D. Payments (already strong)

| # | Item | Status | Note |
|---|---|---|---|
| D1 | Order/Payment/Subscription/Enrollment separated; idempotency keys; ACID guarded transitions; append-only webhook ledger. | ✅ | Matches spec §67. |
| D2 | No confirmation email for enrollment/payment. | ✅ | `planConfirmationEmail` on verify/webhook, `enrollmentConfirmationEmail` on enroll — non-blocking (T1). |
| D3 | No `Entitlement` model (trial/full only; no scholarship/admin-grant/school). | ⚠️ | Add when needed. |

## E. API architecture

| # | Item | Status | Note |
|---|---|---|---|
| E1 | Raw `fetch` scattered in components (CourseChat, register, admin, etc.) vs a typed `api.*` layer. | ⚠️ | Centralize `features/` API modules. |
| E2 | No TanStack Query — server state held in component state + polls. | ⚠️ | Adopt for authenticated data (pagination/invalidation). |
| E3 | Dashboard endpoint purpose-built (`GET /dashboard/me`) — but query does multiple calls (acceptable). | ⚠️ | Combine with `include`/`aggregate`. |
| E4 | Cursor pagination: chat messages ✅; notifications/activity/resources/admin tables use offset or "last N". | ⚠️ | As datasets grow. |
| E5 | DTOs: `PUBLIC_SELECT`/`stripUser` exist; course lists use `_count`. No formal DTO layer. | ✅/⚠️ | Adequate for now. |

## F. Design system & public website

| # | Item | Status | Note |
|---|---|---|---|
| F1 | No shadcn/ui; home-grown Tailwind components. | ⚠️ | Spec prefers shadcn/ui — evaluate cost/benefit before importing (may be churn). |
| F2 | Tokens exist ad-hoc (green `#2A7A3A`, `#F5F5F0`, `#0D0D0D`, Inter/JetBrains Mono in layout). No formal design tokens/design system file. | ✅ | Formal `@theme` token layer in `globals.css`: brand/ink scales, M3 tints, radii, elevations, fonts (T4 check — present). |
| F3 | Homepage = single `HomeLanding` client component, not the narrative 16-section structure. | ✅ | Editorial sections exist: hero → stats band → trust marquee → learn/teach doors → live featured → how-it-works → proof → Setsuzoku → CTA (T4 check — matches spec order). |
| F4 | Nav structure ≠ spec §6 (Learn/Mentorship/Work/Company). Current: Home/About/Services/Contact + user links. | ✅ | GUEST_NAV now Learn(/courses)/Mentorship(/services)/Work(/work)/Company(/about) (T4). |
| F5 | `/work`, `/impact`, provider showcase page (marketing) — only `/teachers/providers` API exists (feeds nothing yet?). | ✅ | `/work` page shipped (T4); model-driven refresh when WorkItem lands (G3). `/impact` merged into `/about`. |
| F6 | Schools section: no models/media (spec §10, G1). | ❌ | After models. |
| F7 | Setsuzoku page: `/services` exists; dedicated Setsuzoku relationship page missing. | ✅ | `/setsuzoku` page shipped (T4). |
| F8 | Hero: current marketing copy; spec wants product-specific hero + CTA "Explore Courses"/"See Our Work". | ✅ | Hero CTA now links "explore courses" + "see our work" (T4). |
| F9 | GuideBubble already replaces AI assistant (static, matches spec "assistant as supporting feature"). | ✅ | Keep. |
| F10 | Accessibility: no formal a11y review yet; forms have labels. | ⚠️ | Review pass (§81). |
| F11 | SEO: metadata exists per page; no sitemap/robots in output, no OG/Twitter JSON-LD beyond homepage. | ✅ | `sitemap.ts` + `robots.ts` (admins/auth paths disallowed); homepage has OG/Twitter/JSON-LD (T4). Broaden per page in T7. |

## G. New business domains (content systems)

| # | Item | Status | Note |
|---|---|---|---|
| G1 | `Organization` + `OrganizationMembership` (schools/partners) | ❌ | Spec §49 |
| G2 | `MediaAsset` (logos, photos, screenshots, marketing video) | ❌ | §47 |
| G3 | `WorkItem` + `/work`, `/work/[slug]` portfolio | ❌ | §48/98/99 |
| G4 | `Program` (tuition, school programs, workshops) | ❌ | §50 |
| G5 | `Conversation` + `ConversationMessage` (mentor↔student per enrollment; no student↔student) | ❌ | §35. Today: one course-wide `ChatRoom` (CLASSROOM) — approved as announcements; private mentor/student DMs missing. |
| G6 | Admin CRUD for all of the above + media management | ❌ | §44/97/151 |

## H. Mentor platform gaps

| # | Item | Status | Note |
|---|---|---|---|
| H1 | Real SMS (A8) blocks "phone verified" mentor trust flow. | ⚠️ | Twilio Verify wired (T3); enable by adding Twilio creds. |
| H2 | No forget-password (C3). | ✅ | Wired + reset page (T3). |
| H3 | Mentor studio: chapters+meetings+panel exist; no full `/mentor/*` nav (Overview/Students/Resources/Messages), no curriculum module CRUD beyond chapters, no lesson CRUD UI. | ⚠️ | |
| H4 | Student→mentor private conversations (G5). | ❌ | |
| H5 | Lesson/module CRUD is admin-only (no mentor curriculum editor for their lessons). | ⚠️ | |
| H6 | Application state machine enforced? Review validates status transitions. | ⚠️ | Verify guards. |

## I. Live meetings

| # | Item | Status | Note |
|---|---|---|---|
| I1 | `LiveMeeting` model + CRUD + auto COURSE notification + participant gating. | ✅ | Matches §33/34 core. |
| I2 | Notifications for changed/cancelled/recording-available missing (only new-session auto). | ⚠️ | Add. |

## J. Testing & infra

| # | Item | Status | Note |
|---|---|---|---|
| J1 | No test suite (unit/integration/E2E), no addon configured. | 🔴 | Spec §88/89. |
| J2 | No Sentry/observability; request IDs exist. | ⚠️ | Add Sentry. |
| J3 | No analytics (PostHog). | ❌ | |
| J4 | No CI pipeline (lint→typecheck→test→build→migrate→deploy). | ❌ | §95 |
| J5 | No backups/rollback doc. | ❌ | §96 |
| J6 | Rate limiting: global 600 + specific auth 20/contact 5. Spec wants per-area policies (practice, messaging, uploads, admin, payments, AI). | ⚠️ | Extend. |
| J7 | Email is fail-open (send failure downgraded, `emailSent:false`). | ✅ | Matches §30. Follow-up D2 adds confirmation emails. |
| J8 | Production = `prisma db push` (B1). | 🔴 | |

---

## Execution order

### Tranche 1 — Security/correctness (small, high-value)
1. A1: `requireAuth` on `GET /api/notifications` (+ create: verify owner/mentor).
2. A4/A5: distinct `ActivityLog` kinds; drop `"ai"` from allowed set.
3. A6/A7: remove unused deps/middleware/stale artifacts (incl. `backend/dist/ai`).
4. A3: remove dead `educationLevel` field or actually submit it.
5. D2: enrollment/payment confirmation emails (Resend, non-blocking).

### Tranche 2 — Payments/entitlement hardening
- D3 entitlement groundwork, enrollment email §17 confirmation step, retry/duplicate UX on enroll-402 (already partially handled).
- ✅ Done: fixed post-verify stuck-state bug (enroll-402 → clear message + recoverable modal). D3 deferred deliberately: `Subscription` = entitlement; scholarship/admin-grant speculative.

### Tranche 3 — Auth upgrade
- A2 cookie migration (HttpOnly/Secure/SameSite, short access + rotating refresh), C2 OAuth (Google/Microsoft), C3 forgot password, A8 real SMS phone verification.
- ✅ Done: cookie mode (opt-in flag), OAuth url/import endpoints + login buttons + callback flow, forgot-password + reset-password page, Twilio Verify SMS auto-when-configured.
- ⚠️ To go live: enable `AUTH_COOKIE`/`NEXT_PUBLIC_AUTH_COOKIE` on a same-site deployment (or add SameSite=None + credentialed CORS cross-origin); add Supabase OAuth creds; add Twilio creds.

### Tranche 4 — Design system + public website
- F2 tokens → F3 homepage narrative rebuild → F4 nav IA → F8 hero copy → F5 `/work` + Setsuzoku → F11 SEO/sitemap/OG → F10 a11y pass.
- ✅ Done: tokens/formal `@theme` confirmed, homepage narrative confirmed (was already editorial), nav IA to spec §6 (Learn/Mentorship/Work/Company), `/work` + `/setsuzoku` pages, hero CTAs "explore courses"/"see our work", `sitemap.ts` + `robots.ts`. Frontend build + tsc green.
- ⚠️ Left: F10 formal a11y pass (→ T7 hardening, has §81 slot), F6 schools section (needs G1 models).

### Tranche 5 — New business domains
- G1 Organization → G2 Media → G3 Work → G4 Program → G5 Conversations → G6 admin CRUD. Additive schema + admin + public pages.

### Tranche 6 — Platform
- J2 Sentry → J3 PostHog → J1 testing scaffold (Vitest/Jest + Playwright) → J4 CI → B1 migrate history → J6 per-area rate limits.

### Tranche 7 — Hardening pass
- §88–90 E2E student/mentor/admin flows, §156–159 security review, §154–155 performance & query review, §160 rate limits, docs/README (§161–163).

---

## Working rule (from the spec)
Smallest coherent change per step. Backend+frontend+DB contracts move together. Typecheck → lint → test → verify flows → check authorization → check responsive. No fake features, no fake data, no secrets.