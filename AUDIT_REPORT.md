# Frontend Audit & Mobile Responsiveness — Report

**Date:** 26 October 2026  
**Scope:** entire `frontend/` app — public marketing, auth, learner, mentor, and admin surfaces  
**Status:** mobile fixes applied · design proposals awaiting approval

---

## 1. What was requested

1. Audit the whole frontend for issues.
2. Make mobile responsiveness right first — starting with the missing **EduAltTech** wordmark beside the logo.
3. Write a report of what was found and what was done.
4. Produce `suggestions.html` with **visual before / after** for the shipped fixes and a proposal index for every page.
5. Do not apply design suggestions until explicitly approved.

---

## 2. Outcome at a glance

| Item | Result |
| --- | --- |
| Route files audited | 63 `page.tsx` files + 404 / error shells |
| Mobile issue groups fixed | 6 (8 files) |
| Design proposals written | 61 proposals indexed in `suggestions.html` |
| New dependencies | 0 |
| `npm run typecheck -w frontend` | pass |
| `npm run lint` | pass |
| Browser / device visual QA | **not run** — no browser harness available in this environment |

Deliverables:

- `suggestions.html` — visual before/after for the 7 shipped change groups, plus a code-free index of the 61 remaining proposals.
- this report.

---

## 3. Mobile fixes shipped

### 3.1 Brand wordmark missing beside logo

The name was hidden below Tailwind’s `sm` breakpoint (640px) in both the public header and the signed-in header. Auth pages had no name at all.

| File | Line | Before | After |
| --- | --- | --- | --- |
| `frontend/src/components/layout/PublicHeader.tsx` | 45 | `wordmarkClassName="hidden text-base sm:inline"` | `wordmarkClassName="text-sm sm:text-base"` |
| `frontend/src/components/app/DashboardShell.tsx` | 126 | `wordmarkClassName="hidden sm:inline"` | `wordmarkClassName="text-sm sm:text-base"` |
| `frontend/src/components/auth/AuthShell.tsx` | 19 | `<BrandLogo />` | `<BrandLogo withWordmark wordmarkClassName="text-base" />` |
| `frontend/src/components/brand/BrandLogo.tsx` | 26–30 | always `text-lg`; caller size class could not win | `wordmarkClassName ?? "text-lg"` so callers control size |

The signed-in header still fits at 320px: logo + wordmark + notifications + avatar + chevron ≈ 241px inside 288px of usable width.

### 3.2 Admin navigation consumed the whole first screen on phones

Five labelled nav groups stacked vertically before any page content.

- File: `frontend/src/app/(app)/dashboard/admin/layout.tsx:97`
- Mobile: one horizontally scrollable chip row; group labels hidden.
- Desktop (`lg`): unchanged sticky sidebar.
- Active state and `aria-current="page"` preserved.

### 3.3 One-time-code input overflowed small screens

Six fixed-width inputs (`.pin-input`, `2.5em` each + gaps ≈ 280px) overflowed inside the verify card (≈ 240px of content on a 320px phone). This affected verify-email, settings → mobile verification, and checkout OTP.

- `frontend/src/app/globals.css:341` — inputs now `flex: 1 1 0; min-width: 0; max-width: 2.75rem; height: 2.75rem; padding: 0`.
- `frontend/src/components/ui/PinInput.tsx:45` — wrapper is `w-full justify-center gap-1.5 sm:gap-2`.
- `frontend/src/app/globals.css:317` — verify card padding drops to `24px 16px` below 420px.

Inputs stay at a 44px tap height and shrink instead of overflowing.

### 3.4 Mobile number field forced overflow

- File: `frontend/src/components/app/MobileVerification.tsx:80`
- Before: `min-w-[200px]` inside a 192px phone column.
- After: `min-w-[10rem]`; the input shrinks and the button wraps below.

### 3.5 Files changed in this pass

```
frontend/src/components/layout/PublicHeader.tsx
frontend/src/components/app/DashboardShell.tsx
frontend/src/components/auth/AuthShell.tsx
frontend/src/app/(app)/dashboard/admin/layout.tsx
frontend/src/components/ui/PinInput.tsx
frontend/src/components/app/MobileVerification.tsx
frontend/src/components/brand/BrandLogo.tsx
frontend/src/app/globals.css
```

---

## 4. Verification

- `npm run typecheck -w frontend` → no errors.
- `npm run lint` → no errors.
- Responsive behaviour was reviewed at the code level for 320px, 375px, 390px, 768px, and `lg` breakpoints (width arithmetic, fixed widths, overflow containers).
- **Gap:** no browser or device screenshots were captured. A visual pass with Playwright or real devices is still recommended before release.

---

## 5. Audit results

### 5.1 Public / pre-login

**Already sound:** hero layout, course grids, course detail curriculum, contact two-column layout, FAQ search + category filters, legal typography, public footer, skip-to-content link, responsive course cards.

**Remaining issues / opportunities:**

| Priority | Issue | Where |
| --- | --- | --- |
| P2 | Social links are placeholders (`href="#"`) and look live | `PublicFooter.tsx` |
| P2 | Course detail enrol action sits after the full curriculum on mobile | `app/courses/[slug]/page.tsx:333` |
| P2 | Catalogue stacks three filter selects before results | `CourseBrowser.tsx` |
| P3 | Legal pages have no “On this page” wayfinding | `privacy`, `terms`, `refund-policy` |
| P3 | Auth desktop layout leaves half the viewport empty | `AuthShell.tsx` |
| P3 | Team page uses 80px thumbnails instead of portrait cards | `app/team/page.tsx` |

### 5.2 Auth and entry flows

**Already sound:** validation, focus-first-invalid, OTP flow, resend handling, password rules, reactivation, onboarding states.

**Remaining:** add step framing to signup/complete-registration, a resend countdown, and a stalled-OAuth fallback. All proposed in `suggestions.html`.

### 5.3 Learner area

**Already sound:** dashboard responsive grid, continue-learning cards, my-learning grid, course tabs, lesson viewer width, chat mobile thread switch, wishlist grid, settings cards.

**Remaining:**

| Priority | Issue | Where |
| --- | --- | --- |
| P2 | Checkout summary and mentor picker stack above the pay action on mobile | `CheckoutView.tsx` |
| P2 | Course home orders curriculum before the current lesson on phones | `CourseOverviewView.tsx` |
| P3 | No reading progress or persistent next action in long lessons | `LessonViewer.tsx` |
| P3 | Settings is three stacked cards with no tabs | `SettingsView.tsx` |
| P3 | Orders lack invoice download / status timeline | `OrdersView.tsx` |

### 5.4 Mentor area

**Already sound:** application form fields and validation, workspace grid, learner roster, meeting scheduling.

**Remaining:** one long apply form (needs steps), one long course workspace (needs tabs/sticky header), application state not shown as a timeline.

### 5.5 Admin / CMS

**Already sound:** desktop tables, `overflow-x-auto` wrappers, `AdminUsers` mobile card view, panels, status pills, skeletons, error and empty states.

**Remaining:**

| Priority | Issue | Where |
| --- | --- | --- |
| P2 | Most admin tables are desktop-only with horizontal scroll; only Users has a card view | `admin/*`, `cms/*` |
| P2 | Admin dashboard shows eight equal-weight metric cards | `AdminDashboard.tsx` |
| P2 | Course editor is one long form with a single save button at the bottom | `AdminCourseEditor.tsx` |
| P3 | CMS screens duplicate table + dialog layout five times | `cms/*` |
| P3 | Application review separates decision controls from evidence | `AdminApplicationReview.tsx` |

Deeper accessibility and code-quality findings are already documented in `ui-review-report.html` (focus traps, `:focus-visible`, reduced-motion timers, table `scope`, tabular figures, placeholders). They are not duplicated here.

---

## 6. Design suggestions — not applied

`suggestions.html` now shows the shipped mobile and footer work as device-width **Before / After** previews. The remaining 61 proposals are listed by page and intent only — no code blocks — grouped into shared patterns, public/auth, learner, mentor, and admin/CMS.

The proposals follow eight themes, all inside the existing design language (ink surfaces, brand green, 20px cards, Sora + Inter):

1. **Hierarchy** — one page header pattern; fewer, stronger KPI cards.
2. **Mobile task order** — the primary action comes first on phones (enrol, pay, apply, contact).
3. **Sticky actions** — enrol, save, pay, and lesson navigation stay reachable.
4. **Responsive data** — tables become card lists below `md`, not sideways scroll.
5. **State consistency** — loading, empty, error, and success use the same components everywhere.
6. **Auth confidence** — step framing, password guidance, resend counts, recovery links.
7. **Admin density** — filters, status chips, compact rows, detail drawers.
8. **Shared primitives** — one `PageHeader`, one `DataTable`, one `Modal`, one CMS editor shell.

Nothing in `suggestions.html` has been implemented. Approval can be per page, per section, or per theme.

---

## 7. Workspace note

The working tree already contained a large set of uncommitted changes from earlier work (≈ 89 files, including removal of the `/work` pages, footer/auth/admin edits, and new UI utilities). Those changes were **not** authored or re-verified in this pass. Only the eight files listed in §3.5 were changed here. Review the full diff before committing.

---

## 8. Recommended next steps

1. Run a visual mobile pass at 320 / 375 / 390 / 768px on the changed surfaces.
2. Approve a theme or page group from `suggestions.html`.
3. Fix the P2 items first: mobile enrol CTA, checkout order, and responsive admin tables.
4. Replace or remove the placeholder social links.
5. Keep `ui-review-report.html` as the accessibility backlog and close its P1 items before release.
