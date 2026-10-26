# Mentor Supply, Course Gating & Revenue Model

Answers: *"If there is no mentor, a student still wants to buy — do we lose them? How do we keep
content flowing, how do we pay mentors, and how do we keep a 24/7 promise?"*

Grounded in the current code: `Order.mentorUserId` (learner picks a mentor at checkout),
`CourseParticipant.capacity` (mentor seats, with oversell protection in
`backend/src/lib/enrollment-helpers.ts`), `LiveMeeting` (sessions + recordings),
`Lesson.isPublished` (mentor publishes straight to learners), `Course.status`
(`DRAFT | PUBLISHED | ARCHIVED`), `MentorApplication` state machine.

## The answer in 8 lines

1. **No, you don't lose the customer — you change what you sell them.** Content and mentorship
   become two products: **Self-Paced** (always sellable) and **Mentored Cohort** (sellable only
   when a mentor with seats exists).
2. **Your mentors are employees, not freelancers** (your own landing copy says so). So mentor
   cost is fixed per head, and the only number that matters is **learners per mentor (~50)**.
3. **One mentor pays for themselves at ~7 mentored buyers or ~19 self-paced buyers per month.**
   So: hire against learners, not against courses; never open a cohort below ~15 buyers.
4. **Publish rules:** a course is sellable when content-complete (readiness check green), and
   a Mentored button renders only when an open cohort has free seats. A course without a
   mentor becomes **"Launching soon" + waitlist**, never an empty checkout.
5. **Mentor pay = salary + incentives** (₹28k gross ≈ ₹33k loaded; ₹100/completion, ₹500/5-star,
   ₹300/authored-enrollee for 12 months). Never % of price. Freelance *content* contributors
   get per-asset royalties with TDS u/s 194C. A payout ledger is net-new — none exists today.
6. **"24/7 live mentoring" cannot be staffed** (720 mentor-hours/month = ₹4.32 lakh fixed).
   Promise instead: instant AI tutor (must be built — no AI exists today) + mentor reply
   within 4 working hours + scheduled live sessions + community.
7. **Chapter 1 is always authored in-house.** That is your no-mentor buffer, your free-preview
   content, and your insurance policy.
8. **Drip, don't delay.** Sell the cohort with a start date; contract content deadlines per
   week; publish each chapter as it clears the readiness gate.

---

## 0. Code reality check (read in the repo, not assumed)

| Claim | Reality in code |
|---|---|
| Course lifecycle | `Course.status` = `DRAFT \| PUBLISHED \| ARCHIVED` — one axis, no readiness, no service tier |
| Pricing | `Course.pricePaise` — **one** price per course. No tiers, no add-ons |
| Card highlights | `Course.features` `String[]`, "up to 4", **hand-typed** → the "6 weeks · 31 lessons" lie risk is real |
| Mentor seats | `CourseParticipant.capacity` (default `Setting mentor_capacity` = 20), oversell-guarded in `backend/src/lib/enrollment-helpers.ts` |
| Buyer↔mentor link | `Order.mentorUserId` — "learner-chosen mentor at checkout; seat re-checked at fulfilment" → seat is **not reserved** at order creation |
| Live sessions | `LiveMeeting`: `scheduledAt`, `durationMin`, `meetingUrl`, `recordingPath` (private bucket key) — the pieces of a mentored cohort already exist |
| Mentor hiring | `MentorApplication` = `SUBMITTED → … → ONBOARDED` pipeline **already exists** |
| Messaging | `chat` module = human mentor↔learner threads (`Conversation`, `ConversationMessage`) |
| **AI** | **None.** No `openai`/`anthropic`/`gemini`/`ollama` dependency anywhere → "instant answers 24/7" is **a build item**, not an existing feature |
| **Mentor pay** | **None.** No payout, payroll, royalty, or salary code anywhere → mentor payment is net-new work |
| Learning paths | `Program` + `WorkItem` exist → bundling/bundles need no new model |
| Brand position | Landing/about copy already says: *"We recruit skilled people who are out of work, train them as mentors and tutors, and **employ** them to teach"* → **EDUALTTECH is an employer of mentors, not a marketplace** |

**That last row changes the answer.** If mentors are employees, mentor cost is *fixed*, not
per-enrollee. So the bottleneck is **not mentor supply** — it is **learners per mentor**.
Everything below is built around that.

---

## 1. The diagnosis (read from the code, not assumed)

Today's model is **mentor-first**:

1. `Order.mentorUserId` — a buyer must pick a mentor at checkout.
2. Mentor seats come from `CourseParticipant.capacity` (default `Setting mentor_capacity` = 20).
3. `Lesson.isPublished` — content goes live the moment a mentor flips the switch.
4. `Course.status = PUBLISHED` — the course is buyable the moment an admin publishes it.

So the failure mode you spotted is real and has three distinct shapes:

| Failure | What breaks | Blast radius |
|---|---|---|
| **A. Course live, no mentor assigned** | Buyer is told "mentored", nobody mentors | Refunds, 1-star reviews, the review says "no teacher" |
| **B. Mentor assigned, no content** | Buyer pays, syllabus is empty | Same, plus wasted mentor retainer |
| **C. Mentor leaves mid-cohort** | Live sessions stop, doubt-clearing stops | Cohort refund wave |

All three are the same root cause: **the platform sells "mentorship" but only guarantees "content".**

Fix the guarantee mismatch, not the symptoms.

---

## 2. The core idea: two independent axes

Stop treating "course exists" and "course is mentored" as one thing.

```
AXIS 1 — CATALOG READINESS   (is the content sellable?)
   DRAFT → BUILDING → READY → LIVE

AXIS 2 — SERVICE DELIVERY    (who delivers human help?)
   SELF_PACED | MENTORED | MENTORED_PENDING
```

A course is **READY** when its content is complete and sellable *on its own*. It is
**MENTORED** only when a mentor with seats is attached. These are independent states, so:

- Content ready + mentor missing → sell **Self-Paced** (no refund risk, revenue now).
- Mentor ready + content not finished → sell **Mentored cohort with a start date**, drip content weekly.
- Neither → **"Launching soon" + waitlist** (visible in catalog, not purchasable, collects demand).

That single change means a missing mentor never blocks revenue and never blocks the catalog.

### Course states (replaces the single `status`)

| State | Visible in catalog | Purchasable | Meaning |
|---|---|---|---|
| `DRAFT` | No | No | Admin is setting up |
| `BUILDING` | Yes — "Launching soon", waitlist + email capture | No | Some content exists, syllabus not complete |
| `READY` | Yes | Yes, **Self-Paced tier only** | Content-complete, no mentor attached |
| `MENTORED` | Yes | Yes, Mentored tier (mentor seats left) | Mentor attached and staffed |
| `LIVE` | Yes | Both tiers | Fully live; stale courses auto-flag for review |

**Auto rules (no human needed):**

- Chapters/topics/lessons all gain `isPublished` (Lesson has it today).
- A course cannot leave `BUILDING` until the readiness check passes:
  every chapter has ≥1 published lesson · every published lesson has real content
  (video processed / text length > threshold) · no placeholder lessons · ≥1 free preview
  lesson · card stats computed from DB, not typed by hand.
- Course card features (`features[]`, max 4 today) must be **derived**, not manual:
  lesson count, total duration, certificate yes/no, mentor name. Manual card text is how
  "6 weeks, 31 lessons" ends up on a course with 3 lessons.

---

## 3. Product ladder — sell content, sell mentorship separately

This is the highest-leverage change. Mentorship is **variable cost** (mentor hours scale with
learners). Content is **fixed cost** (authored once). So price them separately and let the
learner choose.

| Tier | Price (example: Deep Learning) | Includes | Mentored cost? |
|---|---|---|---|
| **Free preview** | ₹0 | 3 preview lessons + AI tutor + course page | No |
| **Self-Paced** | ₹2,999 | All content, AI tutor, assignments, certificate, community | No (royalty only) |
| **Mentored Cohort** | ₹6,999 | + 6 live sessions (recorded), 1:1 doubt slot, capstone review, cohort chat | Yes — gated by mentor seats |
| **Mentor Pack add-on** | ₹2,499 (on top of Self-Paced) | + 4 live sessions + 2 doubt slots | Yes — gated by seats |

Why this is better than one price:

1. **A missing mentor costs you the upsell, not the sale.** Self-Paced still converts.
2. **Mentor cost is only carried where it earns.** No paying mentors for students who
   never wanted a session.
3. **The ladder is your upsell engine**: 60% Self-Paced buyers who wanted a mentor are the
   cheapest revenue you will ever add, because you already paid for the content.
4. **Free preview + AI tutor is the funnel** — it is the "trial" that replaces a live demo.

Buyer-facing truth is one line: *"Self-paced, or join the next mentor-led cohort starting 12 Aug."*

---

## 4. Keeping content flowing when the mentor is not there

### 4.1 Never depend on one person for a chapter

Rule for every course: **Chapter 1 is authored in-house** (AI-assisted drafting + your editor
review), chapters 2..N by mentors. Reasons:

- The course is sellable as Self-Paced from day one, even with zero mentors.
- If the Chapter-3 mentor leaves, the course does not collapse.
- Chapter 1 is also your free-preview content — it must be yours anyway.

Minimum 2 people per chapter (1 mentor + 1 backup) for anything above ₹4,999.

### 4.2 Sell before content is finished — drip the syllabus

Do **not** wait for 100% content before opening sales. Instead:

- Sell the cohort with a **start date**.
- Contractual content deadlines per week: Week-1 content locked T-14 days, Week-2 T-7, etc.
- Admin publishes each chapter when its deadline passes and the readiness check is green.
- Buyer sees real content immediately, and the syllabus page shows what's coming.

A course at 40% content with a dated plan is more sellable than a course at 100% content
that launched 3 weeks late.

### 4.3 Mentor leaves mid-cohort — the playbook

| Step | Action |
|---|---|
| 1 | Flag `mentor.onLeave` → course auto-switches that cohort to `MENTOR_PAUSED` |
| 2 | Roster mentor (pre-contracted backup) picks up live Q&A within 48h |
| 3 | Auto-issue **₹1,000 service credit** to every learner in that cohort (store credit, don't refund — cheaper, and it keeps them enrolled) |
| 4 | Course card shows "Cohort currently in recorded + community mode" |
| 5 | Mentor royalty stops accruing for sessions not delivered; already-earned royalty is **not** clawed back |
| 6 | If no backup within 7 days → offer full refund + 1 free course credit |

### 4.4 What "24/7 live mentoring" should actually be

You cannot staff 24/7 human live support economically at our scale. Do the math:

- 24/7 human cover = 3 shifts × 8 h × 30 days = **720 mentor-hours/month**
- At ₹600/h = **₹4,32,000/month fixed** — before any content cost
- That needs ~4,000 paying learners/month to break even on support alone

So replace one promise with **four verifiable ones**:

| Promise | Mechanism | Cost profile |
|---|---|---|
| "Instant answers, any hour" | AI tutor grounded in course content — **must be built (§0: no AI exists today)** | Dev cost + ≈ ₹15–30/learner/month inference |
| "Mentor reply within 4 working hours" | Async SLA on a mentor rota (employed mentors, scheduled shifts) | ~1.5 h/day per 25 active learners |
| "Live sessions on the calendar" | 6 scheduled sessions + recordings (`LiveMeeting` already models this) | Fixed per cohort |
| "Community answers between" | Peer discussion per lesson (`Conversation` exists) | Free |

Never write "24/7 live mentoring" as a human promise. Write **"always-on learning support"** —
instant AI + scheduled live + SLA. Thinkific does exactly this: their 24/7 helper is *Thinker
AI*, not a human. Copy that.

Note the AI tutor is not a nice-to-have here: it is what makes the "always-on" promise
deliverable **without** hiring a night shift. Build it from course content
(`Lesson` + `LessonContent` blocks) with an answer-with-source citation, and it also removes
the "no mentor answered me" refund reason — which is the single most expensive line in §7.

---

## 5. Mentor pipeline: hire → certify → deploy → coach → retain

**Employment model, not a marketplace.** Your own copy says you *employ* mentors. So:

- Mentor cost is **fixed per hired mentor per month**, not per learner → the lever is
  **learners per mentor**, and mentor supply is a **hiring/rostering** problem, not a
  marketplace-liquidity problem.
- You can and should hire **ahead of demand** (the salary is a fixed cost you plan for),
  then deploy mentors to cohorts.
- You must still **batch learners into cohorts** so each mentor has enough learners to
  justify their month (§7 break-even: a mentor pays for themselves at ~7 mentored or ~15
  self-paced buyers/month).

### 5.0 Two populations, two payment rails

| Population | Who | Paid for | Tax treatment | Where they sit |
|---|---|---|---|---|
| **Employed mentors** | Trained from the "skilled people who are out of work" pool (your brand promise) | Monthly salary + incentives | Salary TDS u/s 192 (per slab), PF/ESI/leave as applicable | Live sessions, async SLA, cohort chat, learner reviews |
| **Freelance content contributors** | Subject experts, video producers, quiz writers, illustrators | Per-piece royalty (per asset, per enrolment) | TDS u/s 194C — 1% with PAN, 20% without | Content production only, no learner contact |

Do **not** pay an employed mentor a per-enrollee royalty on content they did not write, and do
**not** put a freelancer on learner-facing live duty. One salary, one P&L line, two clear scopes.

### 5.1 Do not hire against a guess — hire against a syllabus and a cohort

Recruiting for courses nobody wants burns salary. Order of operations:

```
1. Validate demand      → waitlist + pre-sale page + "Launching soon" listing
2. Lock the syllabus    → admin fixes chapters/topics (mentors don't design courses)
3. Size the cohort      → learners ÷ target learners-per-mentor (25) = mentors needed
4. Hire + certify       → from the "out of work" pool; 2-week training + certification
5. Paid pilot           → mentor builds 1 chapter, quality-gated, paid regardless
6. Deploy to cohort     → fixed weekly cadence written into the deployment plan
7. Publish progressively → drip each chapter as it clears the readiness gate
```

### 5.2 Where to find mentors (India-first, cheapest → best)

Your brand already promises to recruit and **train** people who are out of work — that pool is
your cheapest, most loyal supply and it is unlimited. Ranked by cost per good mentor:

| Channel | Cost per hire | Quality | Note |
|---|---|---|---|
| **"Out of work" pool** (your own promise: skilled people who lost their job) | Training cost only | Medium-high, very loyal | Needs the 2-week certification; the whole brand depends on this working |
| ML/AI bootcamp alumni needing portfolio + income | ₹0–1,000 | High, hungry, flexible | Paid certification slot |
| Referral bounty from current mentors (₹500/qualified) | ₹500 | High — they know the work | Cheapest quality tap |
| Working ML engineers (side income at ₹600–800/h beats their hourly rate) | ₹0 | Medium-high | Flaky on schedule; good as backup roster |
| Ex-UpGrad/Scaler/internal online trainers | ₹0 | High | They may poach learners — non-solicitation clause |
| IIT/NIT/BITS alumni chapters, college coding clubs | ₹0 | Medium | Part-time risk |
| YouTube/Medium creators in the niche | ₹0 | Medium | Audience included |
| PyTorch India, TFUG, fast.ai, r/IndianML, Kaggle | ₹0 | Medium | |
| Upwork/LinkedIn technical writers & educators | Commission | Variable | Use for content, not live duty |

Freelance contributors (video production, quiz writing, illustrations) come from a different
pool — see §5.0.

### 5.3 The mentor offer (what makes them say yes)

1. **Paid training + certification** — 2-week paid onboarding, a certificate they can show
   employers, and a skill badge in their public mentor profile. This is the hook for the
   "out of work" pool and it is *also* marketing ("we train and employ").
2. **Fixed salary + defined weekly load** — e.g. ₹28,000/month gross for 2 live sessions +
   async SLA window + office hours (≈ ₹33,000 loaded). Predictable income beats
   per-enrollee upside for someone without a client base.
3. **Performance incentives, not revenue share**:
   - ₹100 per learner who **completes** the course (aligns quality with outcomes).
   - ₹500 per 5-star learner rating (aligns learner experience).
   - ₹300 per enrollee in a course they authored, for the **first 12 months** (aligns
     content quality with ongoing sales) — capped so it never becomes revenue share.
   - Never pay a % of course price: it makes mentors fight your discounting and turns a
     fixed cost back into a variable one.
4. **On-time payroll** (1st of following month). Biggest retention factor, full stop.
5. **Cohort continuity** — same mentor, same learners, same weekly slot. Learners churn
   when the mentor changes mid-course; protect the slot.
6. **Backup cover paid** — if a session is covered by a roster mentor, the primary is still
   paid for the slot. Removes the incentive to vanish, costs nothing extra.
7. **Portfolio + credential** — "Mentored by <name>" on the course page, public mentor
   profile, and a certificate for their own portfolio.
8. **Career ladder** — mentor → senior mentor → lead mentor → content lead. Cheapest
   retention you can buy; also builds your internal trainer bench.

### 5.4 Vetting + quality gate

- Qualification check (CV + LinkedIn + GitHub).
- 15-minute **demo lecture**, recorded, scored.
- Blind review of a sample of their content against the rubric:
  no copyrighted slides · slides carry speaker notes · ≥1 worked problem + solution ·
  lesson ≤ 15 min · captions present · thumbnail + title card · quiz with a pass rule.
- Reliability test: two weeks of a fixed schedule before they touch a learner.
- **Employment agreement** (employed mentors): role, salary, weekly load, leave policy,
  content IP (platform owns or gets a perpetual sublicence), confidentiality,
  non-solicitation, and notice.
- **Freelance agreement** (contributors): per-asset fee, royalty terms, IP assignment,
  TDS 194C deduction, refund clawback on royalties, and kill-fee on commissioned work.

---

## 6. How to pay mentors (mechanics, India)

**Ledger first.** There is no payout code in the repo today, so this is net-new. Never compute
payouts from orders at month end — build an append-only ledger that both payroll and freelance
royalties write into:

```
MentorPayout(id, mentorUserId, courseId?, type: SALARY | INCENTIVE | ROYALTY | PILOT,
             grossPaise, tdsPaise, netPaise, status: PENDING|PAID, periodMonth, paidAt, note)
```

- **SALARY** — monthly gross for an employed mentor (not a ledger line you pay from; it feeds
  payroll), recorded here for cost-per-cohort reporting.
- **INCENTIVE** — completion bonus, rating bonus, authorship bonus. Paid with salary cycle.
- **ROYALTY** — freelance contributors: ₹300 × paid enrolments of the asset they authored
  (reverse on refund) or a fixed per-asset fee.
- **PILOT** — fixed, one-off, paid even if we don't ship the content.

**Payout rails.**

| Population | Method | How |
|---|---|---|
| Employed mentors | **Payroll** (manual bank transfer / NEFT batch) | Fixed gross, TDS u/s 192 deducted at slab, payslip + Form 16, PF/ESI if applicable. One monthly run, no integration needed |
| Employed mentors (scale) | **RazorpayX / Connect payouts** | Payouts from your Razorpay balance with KYC + agreements; automates the batch once headcount justifies it |
| Freelance contributors | **Manual monthly batch** (UPI/NEFT + bulk transfer + TDS certificate) | Per-piece royalty, TDS u/s 194C deducted at source, TDS certificate quarterly |

**TDS / statutory (do not skip this — it is a payroll tax, not a nice-to-have):**

- **Salary to employees** → TDS under **u/s 192** at the employee's slab rate, deducted
  monthly, Form 16 annually. Plus **PF / ESI / leave / bonus** loading (~15–18% on gross
  for a typical arrangement). Budget mentor cost at **~1.18× gross salary**, not 1×.
- **Royalty/fee to freelancers** → TDS under **u/s 194C**: **1%** where PAN is provided,
  **20%** without. TDS certificates quarterly (Form 16A). If the total to one freelancer
  crosses ₹30,000 in a year, TDS becomes mandatory.
- **GST** → if you charge GST on course fees (18% on the service fee in India), decide early
  whether displayed prices are GST-inclusive (normal for consumer courses) and whether you
  can take input credit on mentor payouts. Price display and mentor economics must agree.

**Razorpay detail to fix in code:** `Order.mentorUserId` says "seat re-checked at fulfilment".
Reserve the seat at **order creation** with a TTL (e.g. 30 min) and release on payment
failure/expiry — otherwise two buyers can hold the last mentor seat and fulfilment fails
after the money moved.

---

## 7. Unit economics (illustrative — validate with your real numbers)

Deep Learning, 6-week cohort, 100 buyers in one launch window. Prices: Self-Paced ₹2,999,
Mentored ₹6,999, Mentor Pack ₹2,499.

| Line | Amount |
|---|---|
| 40 buyers × Mentored ₹6,999 | ₹2,79,960 |
| 60 buyers × Self-Paced ₹2,999 | ₹1,79,940 |
| 20 of the 60 buy Mentor Pack ₹2,499 | ₹49,980 |
| **Gross revenue** | **₹5,09,880** |

Variable costs (mentors are **employed** — cost is payroll, not per-enrollee):

| Cost | Basis | Amount |
|---|---|---|
| Mentor payroll | 2 employed mentors × ₹28,000 gross × 1.18 (PF/ESI/leave) | ₹66,000 |
| Freelance content royalty | 100 × ₹300 (only if content is freelance-authored; ₹0 if employed mentors author it) | ₹30,000 |
| Completion + rating bonuses | ~70 completers × ₹100, plus ratings | ₹9,000 |
| AI tutor inference (once built) | 100 learners × ₹25 | ₹2,500 |
| Support / ops | | ₹8,000 |
| Payment, taxes, refund reserve | 5% of gross | ₹25,500 |
| **Total variable** | | **₹1,41,000** |
| **Contribution** | | **₹3,68,880 (72%)** |

Same 100 buyers, all Self-Paced, and you **stop employing mentors** (AI + community only):

| Line | Amount |
|---|---|
| Gross | ₹2,99,900 |
| Freelance royalty + AI + fees (5%) + support | ₹60,000 |
| **Contribution** | **₹2,39,900 (80%)** → ₹2,399/buyer |

The point: **a mentored buyer is worth ~₹3,689 vs ₹2,399** — but only if the mentor actually
shows up. One mentorless "mentored" refund costs you ~₹2,000 in margin *plus* gateway fees,
*plus* CAC (₹500–1,000), *plus* the review damage. At a 5% refund rate on the mentored tier
that is 2 refunds per 40 buyers ≈ ₹8,000 of margin, plus the reputational cost of "nobody
answered me". **Never sell a mentored seat you have not staffed.** That is the whole gate.

Target refund rates: mentored ≤ 5%, self-paced ≤ 3%. Track refund reason by code
(`no_mentor`, `content_incomplete`, `not_as_described`) — "no mentor" refunds are a staffing
bug, and they should page you.

### 7.1 Break-even — the one number that decides everything

One employed mentor costs **₹33,000/month loaded** (₹28,000 gross × 1.18).

| | Contribution per buyer | Buyers needed to pay one mentor |
|---|---|---|
| Mentored (₹6,999) | ~₹5,110 | **~6.5** |
| Self-Paced (₹2,999) | ~₹1,780 | **~19** |

Capacity per mentor: **1 cohort of 25 mentored (6 live sessions + async SLA) + 25 self-paced
(async + community) ≈ 50 learners.**

**Operating rules that follow directly:**

1. **Hire mentors against learners, not against courses.** 100 buyers → 2 mentors, regardless
   of how many courses they span. A course with 10 enrollees does *not* get a mentor — it
   runs Self-Paced, and its learners get the AI tutor + community.
2. **Batch cohorts.** Open the next cohort when the current one fills. Never open a cohort
   that cannot reach ~15 buyers — below that, the mentor's month is not covered.
3. **A mentor month is a fixed cost → hire ahead of demand, not per course.** You can hire
   from the "out of work" pool *before* the demand arrives; you cannot hire 12 separate
   mentors for 12 under-subscribed courses.
4. **Under-subscribed ≠ unsellable.** Sell Self-Paced, collect the waitlist, and open a
   cohort when it reaches 15. Never hold a buyer hostage to a mentor you haven't got.
5. **Every cohort gets 2 named mentors** (primary + backup) before a single seat is sold.

---

## 8. Funnel: from "student wants to join" to revenue

```
Course page (BUILDING)
   → "Launching on 12 Aug" + 3 free preview lessons (live now)
   → AI tutor available immediately
   → waitlist form (email + phone + "which tier interests you?")
        ↓ demand signal: waitlist size + tier preference + price test
Admin: syllabus locked → mentor hired & certified → cohort dated → tier pricing published
        ↓
Cohort page (MENTORED, seats shown: "8 of 20 seats left")
   → Self-Paced buyers (instant, unlimited, no seat limit)
   → Mentored buyers (seat reserved, Razorpay order created, seat TTL 30 min)
        ↓
Cohort runs (weekly drip) → completion → certificate + completion bonus → refund window closes
        ↓
Self-Paced buyers see: "Mentor Pack available — 4 live sessions, ₹2,499" → upsell
```

**Hard rule on that page:** a "Mentored" CTA may only render when an open cohort with free
seats exists. If no cohort is open (mentor capacity full or not yet hired), the page shows
**Self-Paced only** plus *"Next mentored cohort — join the waitlist"*. Never show a mentored
button you cannot honour.

Two extra revenue levers the waitlist gives you for free:

1. **Pre-sale** — "Cohort at ₹4,999 if you join before 1 Aug" (raises conversion, locks cash early).
2. **Price discovery** — the waitlist tells you which courses to fund mentors for next.

---

## 9. Minimal schema changes (reuse what you already have)

```prisma
enum CourseState { DRAFT BUILDING READY MENTORED LIVE ARCHIVED }

model Course {
  state          CourseState @default(DRAFT)
  serviceTiers   String[]    @default([])   // ["SELF_PACED","MENTORED"]
  priceSelfPaced Int         @default(0)     // paise
  priceMentored  Int         @default(0)     // paise
  mentorPackPrice Int        @default(0)     // paise
  startDate      DateTime?
  cohortEndsAt   DateTime?
  readiness      Json?                       // computed: syllabus %, lessons %, assetsReady %, mentorAssigned
}

model MentorProfile {
  userId             String  @id
  employmentType     String  @default("EMPLOYED")  // EMPLOYED | FREELANCE
  monthlyGrossPaise  Int     @default(2800000)     // ₹28,000 (employed only)
  cohortCapacity     Int     @default(25)           // mentored learners per cohort
  selfPacedCapacity  Int     @default(25)           // self-paced learners served async
  royaltyPaise       Int     @default(30000)        // ₹300 per paid enrolment (freelance authors only)
  bonusCompletionPaise Int   @default(10000)        // ₹100 per completed learner
  bonusRatingPaise   Int     @default(50000)        // ₹500 per 5-star learner rating
  onLeave            Boolean @default(false)
  backupMentorId     String?
  panVerified        Boolean @default(false)
  agreementUrl       String?                        // employment / freelance agreement
  certificationStatus String @default("NONE")       // NONE | TRAINING | CERTIFIED
  status             String  @default("PROSPECT")   // PROSPECT | PILOT | ACTIVE | PAUSED | ENDED
}

model Waitlist {
  id        String   @id @default(cuid())
  courseId  String
  userId    String?
  email     String
  tier      String?      // SELF_PACED | MENTORED
  source    String?      // course_page | preview | whatsapp
  createdAt DateTime @default(now())
  @@unique([courseId, email])
}

model MentorPayout {
  id           String   @id @default(cuid())
  mentorUserId String
  courseId     String?
  type         String   // SALARY | INCENTIVE | ROYALTY | PILOT
  grossPaise   Int
  tdsPaise     Int
  netPaise     Int
  periodMonth  String   // "2026-11"
  status       String   @default("PENDING")  // PENDING | PAID
  paidAt       DateTime?
  note         String?
}
```

Reuse, don't add:

- `CourseParticipant.capacity` is already the mentor seat gate — expose it as "seats left" on
  the course page and stop enrollment when exhausted.
- `Order.mentorUserId` already links buyer→mentor; make it optional for Self-Paced and
  required for Mentored.
- `MentorApplication` already models the hiring funnel — extend it with `employmentType`,
  `salaryBand`, `certificationStatus` instead of creating a second pipeline.
- `LiveMeeting` already carries `durationMin` + `recordingPath` — that is the session-hours
  and recording source for the payout ledger and for async learners.

---

## 10. Ops dashboards (3 that matter)

1. **Catalog readiness board** — every course with state, readiness %, mentor, seats left,
   days to start, last content publish. Traffic-light. Only green goes "buyable".
2. **Mentor SLA board** — per mentor: sessions delivered vs contracted, avg reply time,
   no-shows, learners affected, payout pending. This is where "24/7-ish" actually breaks.
3. **Refund-reason board** — refunds coded by reason, weekly. `no_mentor` is a staffing
   alarm; `content_incomplete` is a publishing-gate alarm.

---

## 11. 30 / 60 / 90 days

**Day 1–30 — stop the bleeding (no new features)**
- Add `Course.state` + readiness check; no course reaches `LIVE` without green.
- Card stats derived from DB (lesson count, duration, certificate, mentor) — kill manual lies.
- Two-tier pricing on every course: Self-Paced + Mentored; `Order.mentorUserId` optional
  for Self-Paced.
- Seat reservation at order creation with TTL (stop double-booking the last mentor seat).
- Publish the honest service promise **today**: scheduled live sessions + mentor reply within
  4 working hours + community. Remove "24/7 live mentoring" from marketing. Do **not** promise
  instant AI answers until the AI tutor ships (Day 61–90).
- Backfill: every live course gets a readiness status and a mentor or a Self-Paced fallback.
- Mentor capacity roster: for each employed mentor, cohort size + self-paced load
  (target 25 + 25). Mentors are employed — publish the roster to the whole team.

**Day 31–60 — supply + pay**
- `MentorProfile` + `MentorPayout` ledger + monthly payroll run with salary TDS u/s 192
  and Form 16; freelance royalties via TDS u/s 194C. Both need a CA — do this with them.
- Hiring pipeline from the "out of work" pool: extend `MentorApplication` with
  `employmentType`, `salaryBand`, `certificationStatus`; add a 2-week paid training +
  certification step before a mentor touches a learner.
- Paid content pilot for freelance contributors (₹3–5k per chapter, quality-gated).
- Roster of 2 named mentors per open cohort; `onLeave` state + playbook rehearsed once
  end-to-end (mentor on leave → backup → credit issued → cohort continues).
- Chapter-1 in-house + AI-assisted authoring for the top 5 courses (the no-mentor buffer).
- Waitlist + "Launching soon" listings for the next 8 courses.

**Day 61–90 — monetize the ladder + build the AI tutor**
- Build the AI tutor grounded in course content (no AI exists today; §0) with source
  citations; then market "instant answers, any hour". Target ≤ 20% of "no mentor answered
  me" refunds.
- Mentor Pack upsell to Self-Paced buyers (target 25% attach), capped at 30 packs per mentor
  per month so live hours stay within capacity.
- Per-lesson funnel analytics for admins and mentors.
- Pre-sale cohorts with early-bird pricing.
- Learning-path bundles (Thinkific-style: ordered course collections) using the existing
  `Program` / `WorkItem` models.

---

## 12. Traps to avoid

| Trap | Why it hurts |
|---|---|
| Publishing a course with no mentor and promising mentorship | Refunds + reviews + lost trust; worst possible first impression |
| Hiring one mentor per course | Payroll explodes; mentors sit idle. Size by **learners per mentor (50)**, not courses |
| Uniform revenue share on the full price | Mentors fight your discounting, kills margin on premium courses; also pays for content they didn't create |
| Paying mentors only at course end | They carry cash-flow risk, churn out, abandon deadlines |
| Charging for "24/7 live" | Unstaffable promise; guaranteed failure when it slips (720 mentor-hours/month at ₹600/h = ₹4.32 lakh fixed) |
| One mentor owning a whole course | Single point of failure — leave-taking kills the cohort |
| Auto-publishing AI-generated content | Quality collapse; both platforms gate AI behind a human |
| Keeping both a classic and a new builder | Moodle and Thinkific both carry this tax forever; build one, add block types |
| Manual card copy ("6 weeks · 31 lessons") | The fastest way to a refund |
| Marketing "instant AI answers" before the tutor exists | Today there is no AI in the product — promise only what ships |

---

## 13. Open decisions (need your call — each has a recommended default)

| # | Decision | Recommended default | Why it matters |
|---|---|---|---|
| 1 | Self-Paced vs Mentored price points | ₹2,999 / ₹6,999 (Mentor Pack ₹2,499) | Sets contribution per buyer; §7 break-even assumes these |
| 2 | Mentor salary band | ₹28,000 gross (₹33,000 loaded) | One number decides headcount and cohort size |
| 3 | Learners per mentor | 25 mentored + 25 self-paced | Sets the whole payroll model |
| 4 | Minimum cohort size to open | 15 buyers | Below this, run Self-Paced and hold the waitlist |
| 5 | Mentor SLA promise | 4 working hours (next-day weekends) | The only human promise you can actually staff |
| 6 | AI tutor: build or skip | Build in Day 61–90 | It is what makes "always-on" true and it kills `no_mentor` refunds |
| 7 | Mentor staffing shape | Employed (salary) + freelance content contributors (royalty) | Matches your brand; keeps variable cost out of content |
| 8 | Refund policy | 14-day window, 3% self-paced / 5% mentored, reason codes | `no_mentor` refunds must page you |

Say the word on any of these and I'll turn the chosen path into concrete code changes
(schema + routes + admin UI) — the P0 slice is: `Course.state` + readiness check, two-tier
pricing, seat reservation at order creation, waitlist, and the mentor capacity roster.
