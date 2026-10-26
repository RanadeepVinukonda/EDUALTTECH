# Course Builder Reference — Moodle & Thinkific

Research notes for the EDUALTTECH course builder. Two platforms compared: **Moodle**
(open-source LMS) and **Thinkific** (commercial course-commerce platform).

## How this was gathered

| Source | Access | Notes |
|---|---|---|
| `moodle.org`, `docs.moodle.org` | **Direct fetch blocked** (403 / CAPTCHA interstitial) | Moodle facts below come from docs.moodle.org content surfaced through the search index, plus university/vendor guides that quote the same docs. Treated as documentation-derived, not hand-verified on-page. |
| `thinkific.com` | Direct fetch OK | Home, `/features/courses/`, `/features/ai-at-thinkific/` |
| `support.thinkific.com` | Direct fetch OK | Create a Course, Introducing the New Course Builder, How to Add Content in the New Course Builder |

Nothing here is inferred from screenshots or from a working account. Where a platform's
docs contradict each other (Thinkific's new-builder mobile support), that is flagged.

---

# 1. Moodle

## 1.1 Creating a course

Flow: **Site administration → Courses → Manage courses and categories → category → Create new course**
(or the "Create new course" link). A plain teacher cannot create courses — needs
**Administrator, Course Creator, or Manager** rights.

Course creation is a single long **settings form** with collapsible sections, ending in
two buttons:

- **Save and return** — back to the course list
- **Save and display** — straight into the course page (then choose participants/roles)

Settings groups seen in the create form (from course-creation walkthroughs):

- Course full name / short name, category, ID number
- Calendar: start date / end date
- Course summary (description) + course image
- **Course format** + course layout (all sections on one page vs. one section per page)
- **Appearance** (theme, language)
- **Files and uploads** (max upload size for the course)
- **Role renaming**
- **Tags**
- **Course custom fields** (site-defined extra fields per course)
- Completion tracking, enrolment, groups, gradebook, competencies, badges, etc.

Course **categories** are the top-level organisation: nestable (sub-categories), hideable,
reorderable, each with its own description and permissions. A category can hold role
assignments (a Manager scoped to a category manages courses inside it, without site admin).

**Templates & bulk creation**

- A course can act as a **template**: during *Upload courses* you set "Restore from this
  course after upload" → content is restored into the new course (content only, **not** the
  template's settings).
- **Upload courses** = CSV bulk create/update/delete. Columns include `shortname`,
  `fullname`, `idnumber`, `category` (id / idnumber / path), `visible`, `startdate`,
  `enddate`, `summary`, `format` (e.g. `weeks`, `topics`), `theme`, `lang`, `newsitems`,
  `showgrades`, `maxbytes`, `groupmode`, `groupmodeforce`, `enablecompletion`,
  `downloadcontent`, `tags`, `showactivitydates`. There is a **Preview** step before upload
  (rows with errors are skipped) and a CLI equivalent
  (`admin/tool/uploadcourse/cli/uploadcourse.php`).

## 1.2 Course formats (the layout engine)

Chosen in *Course settings → Course format*. Changing format changes **layout only**,
not content (except Single activity, where everything else must be removed).

Standard formats:

| Format | Behaviour |
|---|---|
| **Weekly sections** | One section per week from the start date; current week highlighted. "Course relative dates" shifts week dates per-student when students start at different times. |
| **Custom sections** (renamed from *Topics* in 4.5) | Free-named sections; the default in new installs. Good for objective-based / scaffolded courses. |
| **Social** | One main forum; free-form, activities added via a Social activities block. |
| **Single activity** | Exactly one activity (replaces the old SCORM format); a dropdown appears to choose it. |

Contributed formats (plugins): Buttons (menu of section buttons), Grid (icon grid +
lightbox), Menutopic, Onetopic (tabs), Tiles (animated tile cards), **Kickstart** (a
course-wizard format that starts from a template instead of an empty shell).

**Course layout option**: "Show one section per page" — the home page shows only section
names + summaries + counts, then each section opens on its own page. Course Index (left
nav) always lists everything.

## 1.3 The course builder (editing mode)

Everything structural happens with **Edit mode ON** (toggle top-right).

**Activity chooser** — click `+` anywhere on the course page (bottom of a section, between
two items, or in a subsection) → "Add an activity or resource".

Chooser tabs (admin-configurable): **Recommended · Resources · Activities · All · Starred**.
Icons are colour-coded by category:

| Colour | Category | Items |
|---|---|---|
| Teal | Resources | Book, File, Folder, Page, URL, Text and media area |
| Brown | Interactive content | H5P, Lesson, IMS package, SCORM package |
| Orange | Communication | BigBlueButton, Chat, Choice, Feedback, Survey |
| Purple | Collaboration | Database, Forum, Glossary, Wiki |
| Pink | Assessment | Assignment, Quiz, Workshop |

Each entry has a ⭐ (favourite → Starred tab) and an ⓘ (inline docs).

**Activity / resource actions** (⋮ menu): Edit settings · Move (outline dialog) ·
Move right / Move left (indent, one level, reflected in course index) · Hide / Show ·
Duplicate · Assign roles (context-level role override) · Group mode (separate/visible
groups) · Delete. Plus a pencil icon to rename inline from the course page.

**Section actions**: Edit section (name, summary, section image, split/collapse, restrict
access) · Highlight (Topics) · Permalink · Hide/Show · Duplicate section (4.2+) · Move
section · Delete section. Add/remove sections via `+` / `−` at the bottom (Weekly format
auto-renames them to week ranges and re-computes "this week").

**Deleting is recoverable**: deleted content sits in the course **Recycle bin** for ~1 week.

**Drag and drop** moves items from the course index or the central area; 4.2 added
"click anywhere to add", one-step indent, section duplication, and permalinks. Activity
names only render in edit mode (4.2) to keep the student page clean.

**Subsections (Moodle 4.5, admin-gated)**: a section inside a section. Edit mode → `+`
→ *Subsection*. Not nestable inside subsections; hard cap **52 sections+s subsections per
course**. Subsections are collapsible, appear in the Course Index, and in one-section-per-page
layout show activity counts + completion progress.

**Blocks**: separate side regions (right/left) added from the block drawer — used for
filters, calendar, "Online users", etc.

## 1.4 Content types

**Activities** (student does something) — 15 core types:
Assignment · BigBlueButton · Chat · Choice · Database · Feedback · Forum · Glossary ·
H5P · Lesson · LTI (external tool) · Quiz · SCORM · Survey · Wiki · Workshop.

**Resources** (teacher presents): Book · File · Folder · Page · URL · Text and media area.

Notes per type:

- **Assignment** — file and/or online text submission, individual or group, offline
  submission, feedback + grades; Turnitin integration for summative work.
- **Quiz** — MCQ/short answer/numerical/essay/matching/gap-fill; **Question bank** with
  categories, random draw from category, multiple attempts, time limits, auto-marking,
  hints/feedback, pass marks. Moodle 5.0 adds **multiple question banks per course** + 6
  new question filters.
- **Forum** — 5 types: standard (blog-style), standard general, single simple discussion,
  each person posts one, Q&A (must post first). "Announcements" forum is auto-created.
- **H5P** — interactive content; 40+ types (interactive video, drag/drop, presentations).
  Content can come from the site **Content Bank**, h5p.org, or the Lumi app.
- **Workshop** — peer assessment (two grades: your submission, your assessment of others).
- **Lesson / SCORM / LTI** — branching or external-package delivery.
- **Glossary / Database / Wiki** — collaborative content stores.

## 1.5 Progress, completion and gating

**Activity completion** (4 states per user): *not completed · completed · completed-passed ·
completed-failed*. Manual ("I did this") or automatic. Automatic conditions are per-module:
viewed, graded (and pass/fail), forum: N posts/N replies, wiki: N page edits, choice: voted.

**Restrict access** (conditional availability) — per activity/section, admin-enabled:

- Conditions: activity completion (incl. "previous activity with completion") · date
  (from/until) · grade (min/max, pass/fail) · group/grouping · user profile field ·
  **Restriction set** (nested AND/OR logic).
- Per-condition **eye toggle**: open = item visible but greyed out with a reason (and it
  still appears in the gradebook); shut = item completely hidden (and hidden in the
  gradebook). Shut wins over open.
- Multiple restrictions combine as **ALL** or **ANY**.
- Known gap: **a course cannot be gated on completion of another course** (workarounds only).

**Course completion**: enable per course; choose requirements (all activities, specific
activities, specific sections), set the course completion date, and trigger notifications
and badges.

**Badges**: course badges (criteria = manual issue by role, course completion, activity
completion, previously earned badge, competency) and site badges (course sets, profile
completion, cohort membership). Expiry dates, endorsements, related badges. Criteria are
re-evaluated on events; badge must be "access-enabled" before it can be earned.

**Enrolment & groups**: manual enrolment, self-enrolment (with enrolment key), cohort
enrolment, guest access, category-level enrolment, external (LTI/SSO) enrolment. Groups:
no groups / separate groups / visible groups; group mode can be forced per activity.
Cohorts can auto-enrol users and award roles.

**Grading**: gradebook with categories, weights, scales, outcomes; grade items can be
hidden; late-submission **grade penalties** (5.0); "Graded" filter on the assignment
list (5.0).

## 1.6 Recent Moodle releases relevant to course building

**Moodle 4.5** — subsections · single-section page view · "Topics" renamed "Custom
sections" · accessible activity-icon palette · TinyMCE becomes the default editor ·
activity/section visual separation.

**Moodle 4.2** — click anywhere to add content · one-step indent · duplicate sections ·
permalinks · activity names only in edit mode.

**Moodle 5.0** — AI enhancements (Ollama as a provider, per-model settings, an "Explain"
action on content, AI acceptance + usage policies) · **Activities overview** (teacher *and*
student dashboards of course content) · multiple course question banks + 6 new question
filters · TinyMCE media drag-and-drop and longer image descriptions (750 chars) · grade
penalties for late submissions · assignment SMS notifications · "Graded" filter · manual
BigBlueButton grading · H5P auto-play in the mobile app.

---

# 2. Thinkific

Two course builders exist simultaneously. **New builder** (beta) is default on sites
created on/after **28 Jan 2026**; classic builder remains fully supported. **Content cannot
be migrated between them** — a course is locked to the builder it was started in.

## 2.1 Course creation

Admin Dashboard → **Products → Courses → + New course** (classic) or **New course builder**.

New builder entry: either
- **AI Course Outline Generator** — prompt with what the course is about, who it's for, and
  what learners will be able to do; it returns chapters + lessons, or
- **Start from scratch**.

Classic builder: **Content** tab → **Content Uploader** bulk-imports existing video/audio/PDF
material (chapters/lessons can be created from the uploader itself), or add chapters and
lessons one at a time.

## 2.2 New course builder (beta) — the block model

**Chapters → Lessons → content blocks.** A lesson is a blank canvas; you mix content types
inside one lesson.

| Layer | Rule |
|---|---|
| Chapter | up to **25** per course (>25 "coming soon") |
| Lesson | up to **25** per chapter |
| Content block | up to **25** per lesson |

**Content types available**: Video · Text · Image · PDF · Audio · Survey · Downloads ·
External content (iframe embed) · Quiz · Advanced Quiz (passing grade, randomised question
bank) · Assignment · Exam (Brillium).
**Coming soon**: Presentation, Live events.

**Adding content**: pick the type from the right-hand content menu → the block appears in
the lesson. Reorder with the block's up/down arrows; delete via the block menu; "Replace"
on media blocks.

**Per-type constraints**

| Type | Formats / limits |
|---|---|
| Video | `.mp4`, `.mov`, `.m4v`, max **2 GB**; must be uploaded (no external-video link yet); lands in the Video Library |
| Image | `.jpeg/.jpg`, `.png`, `.gif`, max **20 MB**; resizable via sliders, alignment control |
| PDF | `.pdf`, max **25 MB**; in-player scrollable |
| Text | rich text: headings, bold/italic/underline, bullet & numbered lists, alignment, links, colour + font style |
| Quiz | **single-answer questions only** at launch; admin-side quiz analytics not yet available |
| External content | any iframe-able page (Calendly, Prezi, H5P, external quiz tools) |

**Builder UX**: auto-save for all edits (with "last saved X ago"), live preview that is
literally the learner's Course Player, drag-to-reorder chapters and lessons, inline rename,
delete (permanent — draft is the safe alternative), per-lesson Feedback button.

## 2.3 Classic course builder — tabs and settings

Tabs: **Curriculum · Settings · Drip · Pricing · Landing/Sales page · Publish**.

Curriculum tab: add chapter (title + save) → add lesson (pick type → title → content → save).
Copy lessons between courses is supported in classic, **not** in the new builder.

**Settings tab** contains:

- *Basic* — course name, URL/slug, instructor, security & access, delete course.
- *Image & description* — course card (name, image, short blurb, price, lesson count) and
  checkout copy.
- *Course Player appearance* — theme, style (primary colour, font), lesson type icon &
  label, player logo.
- *Progress & completion* — video autoplay, **video completion %**, chapter completion
  message popup, **certificates** at 100% completion, custom completion page, social sharing.
- *Page code* — custom JS/CSS, e.g. redirect to an external sales page (not available on
  AI-generated landing pages).
- *Admins, revenue partners, affiliates* — role assignment per course.
- *SEO* — meta/OG for landing pages.
- *Course welcome email* — enable + personalise.

## 2.4 Lesson settings (classic)

Every lesson: **title**, **icon & label**. Optional flags: **free preview lesson**,
**draft** (hidden from students), **prerequisite** (must complete before advancing),
**discussions enabled** (bulk-applicable).

Type-specific: Quiz → **requires passing grade**, **randomized question bank**;
Presentation → **completion required** (view all slides); Assignment → **auto-approve
submissions**.

Classic lesson types: Video · Multimedia (iframe) · Text · Download · Discussion ·
Assignment · Quiz · Survey · Presentation · Exam (Brillium).

## 2.5 Drip / release scheduling

Drip is **per course** and controls when content unlocks. Classic builder supports three
bases:

| Base | Rule |
|---|---|
| **Student enrollment date** | day 0 = first enrolment date; per-lesson day offsets (0 = immediate). Enrolment time-of-day is preserved, so "1 day" = exactly 24 h later in the learner's local time. Re-enrolment keeps the *original* enrolment date. |
| **Student course start date** | day 0 = first time the learner opens the Course Player (not enrolment). Original start date kept on re-enrol if the player was opened before. |
| **Specific calendar date** | one shared schedule for everyone; per-lesson dates inherit the main schedule's time-of-day. Learners enrolling late immediately get everything already released. |

New builder drip: one schedule for all learners (no per-learner schedules), with
**per-chapter custom release dates**, and modes: on enrolment date (default), by calendar
date, **staggered from enrolment date**, **staggered from learner start date**. Unreleased
chapters show a "This lesson isn't available yet" message with the release date/time in the
learner's timezone. Saving a schedule does not retroactively change access for learners who
already passed an unlock date.

## 2.6 Certificates

Automatically issued when the learner completes **100% of published lessons** (draft lessons
don't count). Student gets a **Get your certificate** button in the Course Player, on the
completion popup, and in account settings (still accessible after course access expires).
Instructor can view/download/edit any issued certificate from the student profile.

- Templates + own background image + logo + custom fields (name, completion date, expiry).
- Design file limit **4 MB** (larger images can 500-error the certificate).
- No manual issuance; students who completed *before* a certificate was attached do not get one.
- New certificate **designer** for sites created on/after **8 Jul 2026**.
- English-only characters today.

## 2.7 Commerce, community and platform extras

- **Pricing**: free, one-time, subscription, payment plans; coupons, bundles, upsells,
  order bumps, multi-currency, automatic sales tax/VAT, B2B invoicing, POs, seat licensing,
  refunds/dunning.
- **Learning Paths** (Plus Silver+): an ordered collection of courses inside a membership
  or bundle, optionally order-enforced; not available in the mobile apps.
- **Course reviews**, **cohorts/groups**, **live events (Zoom)**, **in-lesson discussions**,
  **Thinker AI** teaching assistant (grounded in your content, configurable per course/group,
  Plus plans), **AI course outline generator**, **AI landing pages**, **AI-generated quizzes**,
  **AI analytics summaries**.
- **Analytics**: engagement, revenue, MRR, churn, course-level dashboards.
- **Branded Mobile** (iOS/Android white-label app), **Communities** (spaces, posts, DMs,
  moderation), **App Store** third-party apps, **REST API + webhooks**.
- New-builder API caveats: REST endpoints cover courses, chapters, collections, products,
  enrollments; the **`lesson.completed` webhook does not fire** for new-builder courses
  (other webhooks do).

---

# 3. Side-by-side

| Concern | Moodle | Thinkific |
|---|---|---|
| Structure | Course → sections → subsections → activities/resources | Course → chapters → lessons → content blocks |
| Nesting depth | 3 (section → subsection) | 3 (chapter → lesson → block) |
| Add content | Activity chooser, `+` anywhere on page | Right-hand content menu per lesson |
| Content mixing | One activity per item; content is atomic | Many blocks per lesson |
| Ordering | Drag & drop, `order` semantics, indent/outdent | Drag chapters/lessons; up/down arrows per block |
| Limits | 52 sections+s subsections | 25 chapters / 25 lessons / 25 blocks |
| Gating | Restrict access (completion, date, grade, group, profile field; AND/OR sets) | Prerequisite lessons + drip schedules |
| Completion | 4-state per activity + course completion rules + badges | Lesson complete (video %, quiz pass, auto-approve) + certificates |
| Draft vs publish | Hide + Recycle bin (~1 week) | Draft flag; delete is permanent |
| Draft | Hide course/activity, admin visibility | Course hidden, private course, draft lessons |
| Reuse | Content Bank, H5P, course templates, restore from template, CSV bulk upload | Content Uploader, copy lessons, course duplication, AI outline generator |
| Preview | Student view / one-section-per-page | Live preview = real Course Player |
| Autosave | Manual save per activity (draft restore on leave) | Auto-save in new builder |
| Payment | Not built in | First-class (checkout, subscriptions, tax, B2B) |
| AI | Moodle 5.0: providers, "Explain", policies | AI outline, AI landing pages, Thinker tutor, AI quizzes |

---

# 4. Mapping onto the current EDUALTTECH schema

Today: `Course → Chapter → Topic → Lesson(VIDEO|READING) → LessonProgress`, plus
`LiveMeeting` and `Resource`. Explicit `order` ints with unique constraints — already the
right pattern (both platforms rely on explicit ordering, never insertion order).

Gap list, cheapest-first.

### P0 — small schema changes, big capability jump

| Feature | Change | Borrowed from |
|---|---|---|
| Mixed content per lesson | `LessonContent` table: `lessonId, type, order, title, body, url, mediaPath, meta jsonb` | Thinkific content blocks |
| More content types | widen `LessonType`: add `QUIZ, ASSIGNMENT, DOWNLOAD, AUDIO, IMAGE, EMBED, DISCUSSION, SURVEY` | both activity lists |
| Publish/draft per node | `isPublished` on `Chapter` and `Topic` too (Lesson already has it) | Thinkific draft lesson |
| Free preview | `isPreview Boolean` on `Lesson` | Thinkific free preview lesson |
| Prerequisites | `LessonPrerequisite(lessonId, requiresLessonId)` | Thinkific prerequisite lesson |
| Completion rules | `completionMode` (MANUAL/AUTO), `videoCompletionPercent`, `requiresPassingGrade` on Lesson | Moodle completion + Thinkific video % |
| Drip | `releaseAt DateTime?` + `dripMode` (IMMEDIATE/FIXED_DATE/RELATIVE_ENROLLMENT) on Lesson; `dripAnchorAt` per Course | Thinkific drip |
| Certificates | `Certificate(userId, courseId, issuedAt, expiresAt, pdfUrl)` issued on 100% completion | Thinkific certificates |

### P1 — builder UX and structure

- **Three-pane builder**: chapter/topic tree (drag reorder) | lesson canvas (blocks, inline edit) |
  content palette — mirrors the Thinkific new builder; auto-save (PATCH per change) + live preview.
- **Restrict access** on lesson/topic: prerequisite + open date + min progress.
- **Categories**: `Course.category` is a free-text string today → `Category` table with
  parent/ordering (Moodle-style nesting + category-level admin).
- **Bulk import** (CSV/ZIP) and **course duplication** — Thinkific Content Uploader / Moodle
  CSV upload + restore-from-template.
- **Course templates** — clone structure without copying learner data.

### P2 — platform depth

- **Quiz engine**: `QuestionBank → Question → Option`, attempts, grading, random draw.
- **Cohorts/groups + enrolment methods** (self-enrol with key, manual, cohort) — the Moodle
  gap is that course completion cannot gate another course; Thinkific's Learning Paths is the
  answer there (ordered multi-course path, optionally enforced).
- **Badges**, **course reviews**, **live event (Zoom) recording** — `LiveMeeting` exists.
- **AI course outline generator** → seeded Chapter/Topic/Lesson rows (cheapest AI win:
  one endpoint, no per-block AI).
- **SCORM/H5P/LTI external content**, **import from existing LMS**.
- **Analytics**: completion funnel per lesson (Thinkific-style engagement dashboard).

### Do not copy

- Thinkific's 25/25/25 caps — arbitrary product limits, not platform constraints.
- Moodle's plugin marketplace / contributed-format model — no third-party course formats.
- Moodle's category-level role matrix — EDUALTTECH has two roles (`USER`, `ADMIN`) and
  mentor ownership via `CourseMentor`; that already replaces teacher/manager/student.
