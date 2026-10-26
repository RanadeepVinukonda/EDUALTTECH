# Course Builder Upgrade — Admin + Mentor

What to add to EDUALTTECH so our course builder matches the depth of Moodle and Thinkific,
plus a full worked example on a **Deep Learning** course.

Companion doc: `COURSE_BUILDER_REFERENCE.md` (raw platform research this is built on).

---

## Part 0 — Where we already are (verified in code)

| Area | Exists today | Where |
|---|---|---|
| Course create/edit | `POST /courses` (ADMIN only), `PATCH /courses/:id`, status `DRAFT → PUBLISHED → ARCHIVED` | `backend/src/modules/courses/courses.routes.ts` |
| Course fields | title, slug, description, type, category (free text), domain, gradeLevel, level, tags, features[≤4], pricePaise, thumbnailUrl, roadmapTitle/Summary | `schema.prisma` `model Course` |
| Structure | Chapter → Topic → Lesson, explicit `order` + unique constraints; reorder endpoints for all three levels | `courses/roadmap.routes.ts` |
| Who owns structure | **Admin/course-creator only** (`assertCourseOwner`) | `lib/course-access.ts` |
| Who authors content | Mentor **or** owner: lesson create/patch/delete, private video upload (signed URL → private bucket), `isPublished` toggle with learner notification | `roadmap.routes.ts:218-320` |
| Live sessions | `LiveMeeting` — schedule, duration, meeting URL, reminder, recording upload, attach to chapter/topic/lesson | `modules/meetings` |
| Resource library | `Resource` — pdf/doc/slides/video/link/image, private storage + signed URLs, scoped to course/topic/lesson | `modules/resources` |
| Mentors | Application state machine (SUBMITTED → UNDER_REVIEW → INTERVIEW_SCHEDULED → ACCEPTED/REJECTED), admin assigns mentor to course, mentor seat `capacity` | `MentorApplication`, `CourseParticipant` |
| Learner view | Roadmap with locked/unpublished lessons shown with a lock, `open-topic`, `complete` endpoint, `LessonProgress`, `progressPct` | `courses.routes.ts`, `frontend/src/components/app/RoadmapView.tsx` |
| Admin UI | `AdminCourseEditor` (619 lines), `AdminRoadmapBuilder` (505 lines) | `frontend/src/components/app/admin/` |
| Mentor UI | `TeachingWorkspace` → `LessonManager` (list, publish/lock, notify) → `LessonWorkbench` (edit, upload, publish) | `frontend/src/components/app/` |

### The five real gaps

1. **One lesson = one thing.** `Lesson.type` is `VIDEO | READING` with a single `contentUrl`
   or `textContent`. No mixed content, no quizzes, assignments, downloads, embeds, files.
2. **No gates.** Nothing gates a lesson: no prerequisites, no drip, no "must pass quiz",
   no "watch 90% of the video".
3. **No certificates, no reviews, no cohorts** — completion exists (`LessonProgress`) but
   produces nothing for the learner.
4. **Admin builds structure, mentor fills it — with no review step.** Mentor publishes
   straight to learners (`isPublished` + notify). No draft → review → approve.
5. **No reuse.** Course duplication, templates, bulk import, course copy — none exist.

---

## Part 1 — Gap table (platform → us)

| Capability | Moodle | Thinkific | We have | Add |
|---|---|---|---|---|
| Course creation | long settings form, categories, templates, CSV bulk | products → courses → new | one API, flat fields | **wizard + richer fields + categories** |
| Structure | sections → subsections → activities | chapters → lessons → blocks | chapters → topics → lessons | **blocks inside lesson** |
| Mixed content per lesson | no (one activity = one item) | yes (blank canvas) | no | **yes (blocks)** |
| Content types | 15 activities + 6 resources + plugins | 12 blocks | 2 | **widen to ~10** |
| Drag reorder | yes (+ indent) | yes (drag + up/down arrows) | yes (reorder API) | keep + UI drag |
| Draft vs publish | hide + recycle bin | draft flag | `isPublished` on lesson only | **draft on all levels** |
| Prerequisites | restrict access (completion/date/grade/group/profile) | prerequisite lesson | none | **yes** |
| Drip / release | course relative dates | 3 drip types | none | **yes (2 modes)** |
| Completion rules | 4 states, manual/auto per module | video %, quiz pass %, auto-approve | binary complete | **completionMode + % + pass** |
| Course completion + certificate | course completion + badges | certificates at 100% published lessons | progressPct only | **certificate table** |
| Free preview | — (public courses) | free preview lesson | none | **yes** |
| Bulk import | CSV upload + restore from template | content uploader | none | **CSV/ZIP import** |
| Course copy | restore as template | course duplication, copy lessons | none | **duplicate course/topic/lesson** |
| AI assist | AI providers, "Explain" | AI outline, AI quizzes, AI landing pages | none | **AI outline + AI quiz gen** |
| Live sessions | BigBlueButton | Zoom live events | `LiveMeeting` + recording | keep, add **auto-attach recording to lesson** |
| Reviews | — | course reviews | none | **yes** |
| Cohorts/groups | cohorts, groups, self-enrol key | cohorts | seat-based mentor only | **cohorts (P2)** |
| Analytics | completion reports | engagement dashboard | `progressPct` + totals | **per-lesson funnel** |

---

## Part 2 — Admin-side additions

Ordered by value-per-effort. `S` ≈ 1-2 days, `M` ≈ 3-5 days, `L` ≈ 1-2 weeks.

### A1 — Course creation wizard (M) — *from Moodle's settings form, Thinkific's Settings tab*

Replace the single flat form with 4 steps so the admin never faces 20 fields at once.

| Step | Fields | New? |
|---|---|---|
| 1 Basics | title, domain, level, gradeLevel, category (from `Category` table), tags, thumbnail, promo video | category picker new |
| 2 Pitch | description, **what you will learn** (bullets), **requirements/audience**, roadmapTitle/Summary | 2 new arrays |
| 3 Structure | pick template / start blank / AI-outline → creates chapters+topics+lessons skeletons | new |
| 4 Access & pricing | pricePaise, currency, cohort/enrolment, **certificate on completion**, **drip mode**, publish | 3 new |

Save as `DRAFT` at every step; publish happens in step 4 with a **pre-publication checklist**
(Thinkific has the same): thumbnail set, ≥1 chapter, ≥1 lesson with content, price set,
certificate configured, mentor assigned, landing copy present.

### A2 — Content model: lessons become block containers (M/L) — *Thinkific content blocks*

```
Course → Chapter → Topic → Lesson → LessonContent(block)
```

One lesson can hold: text, image, video, PDF/download, external embed, quiz, assignment,
discussion, live session. This is the single biggest jump toward "best like these platforms".

Keep `Lesson` as the *unit of completion* (it already drives `LessonProgress`), and let
blocks be the *content inside* it. That way completion tracking doesn't need rewriting.

### A3 — Completion rules (S) — *Moodle activity completion + Thinkific video %*

Per lesson:
- `completionMode`: `MANUAL` (learner clicks "Mark done") | `AUTO` (system decides) | `NONE`
- `videoCompletionPercent` (e.g. 90) — for `VIDEO` lessons
- `requiresPassingGrade` + `passScore` — for `QUIZ` lessons
- `autoApprove` — for `ASSIGNMENT` (Thinkific)

Result: `LessonProgress` gains `completedAt`, `score`, `source` (manual/auto). Learner UI
gets a progress bar per lesson that reflects real rules, not "click to unlock".

### A4 — Gating: prerequisites + drip (M) — *Moodle restrict access + Thinkific drip*

Two independent mechanisms, both cheap:

```
Lesson.prerequisiteLessonId  → must be completed first (single link is enough; N-of-M later)
Lesson.releaseAt              → absolute date-time unlock
Course.dripMode: OFF | FIXED_DATE | WEEKLY_FROM_ENROLLMENT
```

`WEEKLY_FROM_ENROLLMENT` = unlock chapter N on day `7*(N-1)` from the learner's
`CourseParticipant.enrolledAt` (Thinkific "staggered from enrollment date"; Moodle's
"course relative dates" does the same thing). Locked items render with a **lock + reason +
unlock date** — the roadmap already renders locks, so it's a message, not a rebuild.

### A5 — Certificates (S/M) — *Thinkific certificates*

```
Certificate(id, courseId, userId, issuedAt, expiresAt?, serial, pdfPath?)
```

Issued when every **published** lesson of the course is completed (draft lessons don't
count). Learner gets a "Get your certificate" button; admin can list/revoke. PDF generated
server-side (puppeteer or pdfkit — pick one) with name, course, date, and your logo.

### A6 — Draft states everywhere (S) — *Thinkific draft, Moodle hide*

Add `isPublished` to `Chapter` and `Topic` (Lesson already has it). Rule of thumb:
unpublishing a chapter hides its topics and lessons; publishing a parent publishes nothing
automatically (you publish bottom-up). Soft-delete only: Moodle's **recycle bin** (1 week)
is worth copying — add `deletedAt` and a "Recently deleted" tray for admins.

### A7 — Reuse: duplicate + template + bulk import (M)

- `POST /courses/:id/duplicate` → clone structure **without** learners, progress, orders.
- `POST /topics/:id/duplicate`, `POST /lessons/:id/duplicate` → clone one node.
- CSV import (Moodle-style): `chapter,topic,lesson,title,type,order` → preview → import.
  Bulk upload of video/audio/PDF goes to the existing private bucket via signed URLs.
- "Course template" = a course flagged `isTemplate`; admin can create from it in one click.

### A8 — Categories (S) — *Moodle course categories*

`Course.category` is a free-text string today. Add `Category(id, name, slug, parentId?, order)`.
Nesting is optional; a flat list with parent pointer is enough. Categories appear in the
browse page filter and on the admin course list.

### A9 — Publish workflow + review queue (M) — *the missing middle step*

Today a mentor's `isPublished` toggle goes straight to learners. Add:

```
LessonReview(id, lessonId, mentorId, status: PENDING|APPROVED|CHANGES_REQUESTED, note, reviewedById, reviewedAt)
```

Mentor submits a draft for review → admin approves (lesson publishes + existing notify
fires) or requests changes (mentor sees the note). Add a course-level setting
`autoPublishMentorContent` to skip review for trusted mentors (Thinkific's auto-approve
equivalent).

### A10 — Per-lesson analytics (M) — *Thinkific engagement dashboard*

Today: `progressPct` + totals. Add a funnel per lesson:
`enrolled → lesson unlocked → lesson started → lesson completed → quiz passed`.
Show drop-off per lesson, per mentor, per cohort. This is what tells an admin *where* a
course fails, and it's the main reason Thinkific/Woodmark buyers upgrade.

### A11 — Cohort, self-enrolment, review polish (L, P2)

Self-enrol with a key, cohort-based enrolment, course reviews with star rating + comment,
certificate template designer. All doable, none blocking.

### A12 — Don't build (explicit)

No plugin marketplace, no contributed course formats, no SCORM authoring, no LTI provider
app store, no badge system. Not worth it at our scale.

---

## Part 3 — Mentor-side additions

### M1 — Rich block authoring inside `LessonWorkbench` (L) — *the mentor's main tool*

Replace the single-type form with a **block palette**:

| Block | Mentor does | We store |
|---|---|---|
| Text | rich text: headings, lists, code block, image inline, callouts | `body` (markdown/JSON) |
| Video | upload to private bucket (already works) or paste YouTube/Vimeo link | `mediaPath` or `url` |
| Image / PDF / File | upload, thumbnail, size shown | `mediaPath`, `mimeType`, `fileSizeBytes` |
| Embed | external URL (Colab, GitHub notebook, YT) → iframe/sandboxed embed | `url`, `provider` |
| Quiz | build 1-10 questions, one correct answer, pass %, shuffle | `quizId` → `Question` rows |
| Assignment | prompt, file upload by learner, rubric, auto-approve toggle | `instructions`, `autoApprove` |
| Discussion | prompt → threaded comments on that lesson | `prompt` |
| Live session | pick an existing `LiveMeeting` or schedule one | `meetingId` |

Editor: pick **TipTap** (React-native, ProseMirror-based) over a bespoke editor. One
dependency, real paste handling, images inline, code blocks.

### M2 — Draft → review → publish inside the mentor workspace (M)

The mentor's list shows three columns: **Draft · In review · Live**. Actions:
Save draft · Submit for review · Withdraw · View feedback. The mentor never touches
`isPublished` directly anymore (unless the course has auto-publish on).

### M3 — Quality checklist per lesson (S) — *Thinkific pre-publish checklist*

Before a mentor can submit for review, a small gate:
title present · summary present · ≥1 content block · video processed (not "uploading") ·
quiz has a pass rule · downloadable files have correct mime/size · alt text on images.

### M4 — Mentor content analytics (S/M)

For a mentor's own lessons only: how many learners reached it, completion rate, average
watch %, quiz score distribution, questions most-missed. This is the killer feature for
mentor retention — and it's the same data as A10.

### M5 — AI assist for mentors (M)

- **Outline expander**: "expand this lesson into 5 sub-lessons" → creates drafts.
- **Quiz generator**: paste the lesson text → generates MCQs → mentor edits before saving.
- **Summary + captions**: auto-summary for the lesson card; captions for uploaded video
  (Whisper-style) — P2.
- Gate every AI output behind mentor edit/save. Never auto-publish.

### M6 — Live session workflow (S)

Today `LiveMeeting` exists with reminders and recording upload. Add:
"attach recording to lesson" (recording becomes a video block on that lesson),
"session notes" auto-posted as a text block, attendance count.

### M7 — Mentor-side bulk ops (S)

Duplicate a lesson, move a lesson to another topic, reorder within topic (already have
reorder API), bulk publish/unlock a whole topic, bulk-assign a downloadable resource to
N lessons.

### M8 — Copy from another course (S)

"Copy lesson from…(course picker)" — Thinkific's classic "Copy Lessons", but course-local
and admin/mentor-scoped. Copies blocks, not progress.

---

## Part 4 — Worked example: **Deep Learning**

A realistic course, end to end. Numbers here are the actual values to seed.

### 4.1 Admin creates the course (Step 1-4 of the wizard)

```
Category:        AI & Machine Learning  (parent: Computer Science)
Title:           Deep Learning: From Perceptrons to Transformers
Domain:          AI & ML
Level:           Intermediate
Grade level:     College / Undergraduate
Duration:        6 weeks
Tags:            deep-learning, pytorch, neural-networks, nlp
What you'll learn:
  - Build and train a neural network from scratch in NumPy
  - Explain backpropagation and gradient flow end to end
  - Tune a CNN for image classification
  - Use attention and build a mini transformer
  - Ship a model with a serving API
Requirements:    Python 3.10+, comfortable with linear algebra, no DL experience needed
Price:           ₹6,999  (pricePaise = 699900, currency INR)
Certificate:     ON — issued at 100% published lessons completed
Drip mode:       WEEKLY_FROM_ENROLLMENT
Mentor:          assigned after application review (2 approved applications)
```

Outcome: `Course` row created (`status: DRAFT`), 6 chapters + 18 topics + 31 lessons
skeleton, one mentor assigned.

### 4.2 Structure the admin lays out (chapters = weeks)

| Chapter | Topic | Lessons (mentor-authored) |
|---|---|---|
| **1. Foundations** | 1.1 What is a neural network? | 1.1.1 The perceptron (video + text) |
| | 1.2 Math you need | 1.2.1 Vectors, matrices, gradients (text + PDF) |
| | 1.3 Setup | 1.3.1 Course environment & repo (text + download) |
| **2. From scratch** | 2.1 Build it | 2.1.1 Forward pass (video + code) |
| | 2.2 Train it | 2.2.1 Loss & gradient descent (video + quiz) |
| | 2.3 Make it work | 2.3.1 Backpropagation, step by step (video + assignment) |
| **3. CNNs** | 3.1 Vision | 3.1.1 Convolution & pooling (video + quiz) |
| | 3.2 Build | 3.2.1 Train a CIFAR-10 CNN (video + assignment) |
| **4. Sequence models** | 4.1 RNNs | 4.1.1 Vanishing gradients (text + embed) |
| | 4.2 Attention | 4.2.1 Self-attention explained (video + quiz) |
| **5. Transformers** | 5.1 Architecture | 5.1.1 Multi-head attention (video + download) |
| | 5.2 Train | 5.2.1 Train a mini-GPT (video + assignment) |
| **6. Ship** | 6.1 Production | 6.1.1 Serving a model (text + download) |
| | 6.2 Capstone | 6.2.1 Capstone brief (text + assignment) |
| | 6.3 Wrap | 6.3.1 Certificate & next steps (text) |

*(14 of 31 shown; the remaining lessons are the same pattern.)*

**Admin-only structure settings per chapter:**

| Chapter | isPublished | Prerequisite | Release |
|---|---|---|---|
| 1 Foundations | ✅ | — | day 0 (enrolment) |
| 2 From scratch | ✅ | Chapter 1 | day 7 |
| 3 CNNs | ✅ | Chapter 2 | day 14 |
| 4 Sequence models | ✅ | Chapter 3 | day 21 |
| 5 Transformers | ✅ | Chapter 4 | day 28 |
| 6 Ship | ✅ | Chapter 5 | day 35 |

**Admin also sets:**
- `1.1.1 The perceptron` → `isPreview = true` (free preview before purchase — Thinkific).
- `2.2.1 Loss & gradient descent` → quiz, pass 70%, shuffle on, `completionMode = AUTO`.
- `2.3.1 Backpropagation` → assignment, `autoApprove = false`, rubric of 4 criteria.
- Every video lesson → `completionMode = AUTO`, `videoCompletionPercent = 90`.
- Every text lesson → `completionMode = MANUAL` ("Mark as done").
- Course → `certificateEnabled = true`.

### 4.3 Mentor flow (Dr. A. Rao, accepted mentor)

**Step 1 — mentor opens the workspace** (`/mentor` → TeachingWorkspace → Deep Learning).
Sees the 6 chapters / 14 topics the admin created, read-only. Each topic shows
"3 lessons — 1 published, 2 draft" (the mentor's own state).

**Step 2 — mentor authors `2.3.1 Backpropagation, step by step`** in `LessonWorkbench`:

```
Lesson title:  Backpropagation, step by step
Summary:       A 22-minute walkthrough of the chain rule applied to a 3-layer network.
Blocks:
  1. VIDEO   "backprop-walkthrough.mp4"   22:14   (private upload → processed)
  2. TEXT    "The chain rule in one line"  (rich text, code block, callout)
  3. IMAGE   "chain-rule-diagram.png"     alt: "Chain rule diagram for a 3-layer net"
  4. QUIZ    "Backprop checkpoint"         3 questions, pass 70%, shuffle on
  5. DOWNLOAD "backprop-notebook.pdf"     1.4 MB
  6. ASSIGNMENT "Implement backprop in NumPy"  rubric: correctness / clarity / tests
```

**Step 3 — quality check** blocks submit:
title ✅ · summary ✅ · 6 blocks ✅ · video processed ✅ · quiz has pass rule ✅ ·
PDF mime ok ✅ · image alt text ✅ → **Submit for review** creates `LessonReview(PENDING)`.

**Step 4 — admin reviews** in `AdminCourseEditor → Content review`:
side-by-side preview, checklist, "Request changes" with a note → mentor sees the note in
their queue, fixes, resubmits.

**Step 5 — admin approves** → `Lesson.isPublished = true` → existing
`notifyLessonUnlocked` fires (in-app notification + email to enrolled learners).
Chapter 2's `releaseAt` still gates *when* learners see it (day 7); publishing controls
*whether* it's live.

### 4.4 Learner flow (Priya, enrolled 6 Jan, `WEEKLY_FROM_ENROLLMENT`)

| When | What Priya sees |
|---|---|
| 6 Jan (day 0) | Chapter 1 unlocked. `1.1.1 The perceptron` is free preview (visible on the course card before purchase too). |
| 6 Jan | Watches `1.1.1` → video hits 90% → lesson auto-completes → progress 4% (1 of ~25 lessons) |
| 13 Jan (day 7) | Chapter 2 unlocks; locked lessons before that show "Unlocks on 13 Jan" |
| 13 Jan | `2.2.1` quiz → 2/3 correct → below 70% → lesson **not** complete, retry allowed; chapter 2 progress stays incomplete |
| 20 Jan (day 14) | Chapter 3 unlocks (prerequisite chapter 2 must be **complete** — Priya retakes the quiz, passes, chapter 2 completes, chapter 3 opens) |
| … | … |
| After last lesson | 100% of published lessons → **Certificate issued** (name, course, date, serial) → downloadable PDF from the course page and dashboard |

### 4.5 Exact API sequence for that flow

```
# Admin
POST   /api/courses                              → create course (DRAFT)
POST   /api/courses/:id/duplicate               → (template path) clone structure
POST   /api/courses/:courseId/chapters           → create chapter 1..6
POST   /api/courses/:courseId/chapters/:cid/topics
POST   /api/courses/:courseId/chapters/:cid/reorder
POST   /api/admin/courses/:courseId/mentors      → assign mentor

# Mentor
POST   /api/courses/lessons                      → create lesson (draft)
POST   /api/courses/lessons/:id/video/sign       → signed upload → private bucket
POST   /api/courses/lessons/:id/video            → confirm upload
POST   /api/courses/lessons/:id/blocks           → add blocks (video/text/quiz/…)
POST   /api/courses/lessons/:id/submit-review    → LessonReview PENDING

# Admin
POST   /api/admin/reviews/:id/approve            → publish + notify learners
POST   /api/admin/reviews/:id/request-changes

# Learner
POST   /api/courses/lessons/:lessonId/complete   → manual complete (text lessons)
POST   /api/courses/lessons/:lessonId/progress    → watch % (new, A3)
GET    /api/courses/:slug/roadmap                → locks + unlock dates + progress
GET    /api/courses/:slug/certificate            → certificate (new, A5)
```

---

## Part 5 — Builder UI spec

Three panes, matching Thinkific's new builder but with our admin/mentor split:

```
┌──────────────┬───────────────────────────────┬────────────────────┐
│ OUTLINE      │ LESSON CANVAS                 │ INSPECTOR          │
│ Ch 1 ✅      │ ┌───────────────────────────┐ │ Block palette:     │
│  1.1 ✅      │ │ VIDEO  22:14  ▸ replace  │ │  Text  Video  Img  │
│   1.1.1 ✅   │ ├───────────────────────────┤ │  PDF  Embed Quiz  │
│  1.2 🚧      │ │ TEXT  chain rule in one  │ │  Assign  Download │
│  2.1 ⏳      │ │        line  (rich text)  │ │  Live             │
│  (locked)    │ ├───────────────────────────┤ │ ─────────────────  │
│              │ │ QUIZ  3 Q · pass 70%      │ │ Settings:         │
│ [+ Chapter]  │ │ ASSIGN upload + rubric    │ │  completion mode  │
│ [+ Topic]    │ └───────────────────────────┘ │  prereq, release  │
│              │  ↑↓ reorder · delete · save  │  preview flag      │
└──────────────┴───────────────────────────────┴────────────────────┘
   admin sees all      anyone authoring          mentor + admin
```

Rules that keep it simple:
- One autosave endpoint per block change (`PATCH /lessons/:id/blocks/:blockId`).
- Reorder = explicit `order` ints (already the pattern), never array positions.
- Learner view is a separate read model — the roadmap endpoint already returns the right
  shape; extend it with `lockedReason`, `unlockAt`, `preview`.

---

## Part 6 — Prisma deltas (minimal)

```prisma
enum LessonType {
  VIDEO  READING  IMAGE  DOWNLOAD  EMBED  QUIZ  ASSIGNMENT  DISCUSSION  LIVE
}

model LessonContent {           // content blocks inside a lesson
  id        String   @id @default(cuid())
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  type      String                        // text | video | image | file | embed | quiz | assignment | discussion
  order     Int
  title     String?
  body      String?                       // rich text / markdown
  url       String?                       // external embed
  mediaPath String?                       // private bucket key
  mimeType  String?
  fileSizeBytes Int?
  meta      Json?                         // quiz settings, rubric, alt text
  @@unique([lessonId, order])
}

model Lesson {
  // …existing fields…
  isPublished  Boolean  @default(false)
  isPreview    Boolean  @default(false)   // free preview
  completionMode String @default("MANUAL") // MANUAL | AUTO | NONE
  videoCompletionPercent Int?             // 0-100
  requiresPassingGrade Boolean @default(false)
  passScore    Int?
  releaseAt    DateTime?                  // drip
  prerequisiteLessonId String?            // gate
  availableFrom DateTime?                 // admin-set open date
  blocks       LessonContent[]
}

model Chapter { … isPublished Boolean @default(false) … unlockAfterDays Int? }
model Topic  { … isPublished Boolean @default(false) … }

model Certificate {
  id        String   @id @default(cuid())
  courseId  String
  userId    String
  serial    String   @unique
  issuedAt  DateTime @default(now())
  expiresAt DateTime?
  pdfPath   String?
  @@unique([courseId, userId])
}

model LessonReview {
  id        String   @id @default(cuid())
  lessonId  String
  status    String   @default("PENDING")  // PENDING | APPROVED | CHANGES_REQUESTED
  note      String?
  reviewedById String?
  reviewedAt DateTime?
  @@index([status])
}
```

Course additions: `durationWeeks Int?`, `outcomes String[]`, `requirements String?`,
`categoryId String?` (→ `Category` table), `certificateEnabled Boolean @default(false)`,
`dripMode String @default("OFF")`, `isTemplate Boolean @default(false)`, `promoVideoUrl String?`,
`deletedAt DateTime?` (recycle bin).

---

## Part 7 — Roadmap

| Phase | Items | Effort | Why first |
|---|---|---|---|
| **P0** | A3 completion rules · A6 draft everywhere · A4 prerequisites + `releaseAt` · M2 review workflow · A5 certificates (basic) · M1 block editor (text/video/file/embed only) | ~2-3 weeks | Turns "list of links" into a real course; blocks + gates + proof of completion are the core of both platforms |
| **P1** | A1 wizard + richer course fields · A7 duplicate/template/CSV import · M3 checklist · M4 mentor analytics · A10 funnel · A8 categories · M7 bulk ops · M8 copy lesson | ~2-3 weeks | Removes admin/mentor busywork; reuse beats new features |
| **P2** | quizzes (question bank, attempts, grading) · assignments with rubric + manual grading · reviews · cohorts/self-enrol · A5 certificate designer · M5 AI outline/quiz gen · captions | ~3-4 weeks | Expands beyond Moodle-parity into Thinkific-plus territory |
| **Skip** | plugin marketplace, contributed formats, SCORM authoring, LTI provider app store, badge system, native mobile app | — | Low ROI for us |

### One check per area (extend `backend/scripts/flows-check.mts`)

1. Admin creates course → chapter/topic/lesson → mentor drafts a lesson with 2 blocks →
   submits → admin approves → lesson published + notification row written.
2. Learner completes the prerequisite lesson → gated lesson unlocks → drip date honoured
   (fake clock) → locked roadmap response includes `unlockAt`.
3. Watch % below 90% does not complete the lesson; 90% does.
4. Quiz score < pass → not complete; ≥ pass → complete; certificate row created only when
   all published lessons are complete.
5. Unpublishing a chapter hides its lessons from the roadmap but keeps them in admin.

---

## Part 8 — What not to copy

| Don't copy | Why |
|---|---|
| Thinkific's 25/25/25 limits | Arbitrary product caps, not platform needs |
| Moodle's category role matrix | We have `USER`/`ADMIN` + mentor ownership — already simpler |
| Moodle's plugin ecosystem | Nobody will write our plugins |
| Thinkific's commerce stack | Razorpay already covers it |
| Two separate builders | Moodle and Thinkific both ship a "classic" builder forever as a tax. Build **one** builder, add a new block type when needed |
| Auto-generated AI content published without a human | Both platforms gate AI output behind a human — keep that |
