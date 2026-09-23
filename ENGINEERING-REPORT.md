# EDUALTTECH — Engineering Report #1

Single-iteration production rebuild: audit + close highest-value gaps. No reset, no rewrite — the existing codebase was audited and the gaps below were implemented against it.

## What already held up (audited, no change needed)

- **Modular monolith**: Express backend with 13 modules (`modules/*/routes.ts`), clean mounts in `app.ts` under `/api`.
- **API envelope**: success `{success, data}` / error `{success:false, error}` everywhere via central `errorHandler`.
- **Hardening**: Helmet, single-origin CORS, `trust proxy`, 2MB body limit, compression, morgan, request-id, global rate limit (600/15min), centralized 404 + error handler.
- **Auth**: Supabase Auth; JWT verified per-request by middleware; `signOut` on admin role change; enrollment is pay-then-active (no PENDING/CANCELLED — correct for this flow).
- **Payments**: append-only Razorpay webhook ledger with signature verification + client idempotency keys.
- **Chat gating**: participants limited to admin / course owner / mentor / ACTIVE-enrolled — server-side, per-room.
- **Catalog**: paginated course listing (page/limit, max 50), DTO projections (no slug/stripe leaks), subject filter + search.
- **Seed**: demo data only, explicitly dev-marked. No production fabrication anywhere.

## Gaps closed this iteration

### 1. Error envelope now has `code` + `requestId` (spec §14)
- `ApiError` gained a machine-readable `code`; status→code map: 400 `VALIDATION_ERROR`, 401 `UNAUTHENTICATED`, 402 `PAYMENT_REQUIRED`, 403 `FORBIDDEN`, 404 `NOT_FOUND`, 409 `CONFLICT`, 429 `RATE_LIMITED`, 500 `INTERNAL_ERROR`, 502 `BAD_GATEWAY`, 503 `SERVICE_UNAVAILABLE`.
- `error.ts` now emits `{success:false, error:{code, message, details, requestId}}`; `requestId` is the per-request id already set by middleware (also in `x-request-id` header) — client can correlate log lines with support tickets.
- Prisma constraint failures → `DATABASE_CONSTRAINT`; malformed JSON → `VALIDATION_ERROR`.

### 2. Wishlist (spec §13)
- New `WishlistItem` model — `@@unique([userId, courseId])` (DB-level, can't double-save), cascade delete both ways.
- `GET /api/wishlist` (my saved, published-only, newest first), `POST /api/wishlist/:courseId` (upsert, idempotent), `DELETE /api/wishlist/:courseId` (quiet remove).
- Course page: "Save for later" toggle (requires sign-in, redirects to `/login`).

### 3. Live meetings (spec §17)
- New `LiveMeeting` model — course-scoped, optional chapter (`onDelete: SetNull`), index on `(courseId, scheduledAt)`.
- `GET /api/meetings/course/:courseId` → upcoming only (future `scheduledAt`), visible to enrolled / mentors / owner / admin only — a non-enrolled learner gets 403, not a leak.
- `POST /api/meetings` → owner/mentor/admin only; validations: future start, 15–480 min duration, valid URL, chapter must belong to the course. Creates a COURSE-scope notification → every enrolled student sees it in their notifications list.
- `PATCH/DELETE /api/meetings/:id` → same manage gate.
- Course page shows "Upcoming live classes" (Join link) for those with access; mentor workspace has a "Schedule live class" form (native `datetime-local` picker, no date library).

### 4. Admin audit trail (spec §22)
- New `AuditLog` model — actor, action, target type/id, optional JSON `meta`, indexes on `(actorId, createdAt)` + `(targetType, targetId)`.
- `lib/audit.ts` — fire-and-forget `audit(actorId, action, targetType, targetId?, meta?)`; a failed audit write never fails the recorded action.
- Wired into: user create/update/delete, mentor assign/unassign, platform settings (admin module), and teacher-application review (status changes). Records before/after for user role/status patches.
- `GET /api/admin/audit` (paginated, filter by `targetType`) — ready for an admin-panel "Audit log" table.

## Applying the schema (NOT done intentionally)

No `prisma/migrations` dir exists — this repo's workflow is `prisma db push`. All schema changes are **additive** (new tables only, no column edits), so `db push` is safe. **Run once before deploying:**

```
cd backend
npm run prisma:push
```

Generate already ran locally (Prisma Client v6.19.3). Do not run against the production DB without doing this first.

## Remaining issues / known debt (next iteration candidates)

- **Backend test suite is thin** — auth/middleware/payments are the highest-value targets. No E2E on the enroll→pay→unlock path.
- `Notification` model has no index; fine at current volume, index `(scope, createdAt)` when notifications grow.
- Homepage + course page carry the bulk of the visual polish; responsive + dark-mode pass still outstanding (spec §1/§28).
- `backend/public/` holds ~6MB of leftover local uploads — untracked, harmless; remove when confident nothing references it.
- Admin panel has no audit-log screen yet (API is ready).
- No per-enrollment progress/streak fraud guard (spec §29) — streak is honor-system today.

## Deploy checklist for live signup/login/verify (env, not code)

| Where | Variable | Value |
|---|---|---|
| Render | `APP_ORIGIN` | `https://www.edualttech.com` (CORS origin) |
| Render | `APP_BASE_URL` | `https://www.edualttech.com` (email-verification redirect base) |
| Render | `api_base_url` | **delete** — dead key, no code reads it |
| Vercel | `NEXT_PUBLIC_API_BASE` | `https://edualttech.onrender.com/api` (missing `/api` was breaking register) |

Flow verified in code: register → Supabase confirmation email links to `/auth/callback` (route exists under the `(auth)` group) → verifies + marks `eat:email-verified` → user signs in. Duplicate `/auth/callback` route removed to fix the build collision.