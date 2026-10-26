# The Mentor Model, Explained With One Course

Plain-language walkthrough of `MENTOR_SUPPLY_AND_COURSE_GATING.md`. Same numbers, same rules —
just told as a story with cases, so you can see what actually happens to a learner, a mentor,
and your money.

**The course:** *Deep Learning — From Neurons to Transformers*
**The learner:** Priya (2nd-year engineering student, Bengaluru)
**The mentor:** Rahul (ML engineer, taken on as a full-time mentor)
**You:** the admin

---

## Part 1 — The one idea that fixes everything

Think of a course as a **book**.

| | Self-Paced | Mentored Cohort |
|---|---|---|
| What the learner gets | The book, exercises, an AI tutor, a certificate | The book **plus** a teacher who meets them live, reviews their work, and answers within hours |
| What it needs from you | Content only | Content **+ a mentor with free time** |
| Can it be sold the moment content is ready? | Yes, always | Only if a mentor is free |

**Today's bug:** you sell "book + teacher" as one product, but your supply chain only guarantees
the book. When there's no teacher, you either refuse the sale (lost customer) or sell a promise
you can't keep (refund + bad review). Both cost money.

**The fix:** sell the book and the teacher **separately**. Then:
- No mentor → Priya still buys the book. You keep the customer.
- Mentor free → you can also sell the teacher, at a higher price.
- Never again: a checkout where nobody is coming to teach.

One extra thing matters more than anything else in this document:

> **Your mentors are employees.** Your own website says you "recruit skilled people who were out
> of work, train them as mentors and tutors, and **employ** them to teach."

So you don't need to find a stranger to take Priya's course. You hire, train, and roster your
own mentors, and you match **learners to mentors** in batches. That flips the problem:

| Wrong frame | Right frame |
|---|---|
| "Will a mentor show up for this course?" | "How many learners can my mentors carry?" |
| Mentor supply is the bottleneck | **Learners per mentor** is the bottleneck |
| Need a mentor per course (12 courses = 12 mentors) | 100 learners = 2 mentors, whatever the course mix |

---

## Part 2 — The two dials on every course

Every course has two independent dials. This is the whole system.

**Dial 1 — Content readiness** (is the book ready?)

| State | Meaning | Buyer sees it? | Can they buy? |
|---|---|---|---|
| `DRAFT` | you're setting up | No | No |
| `BUILDING` | some content exists, syllabus incomplete | Yes — "Launching soon" + waitlist | **No** (but they can join the waitlist and read free previews) |
| `READY` | content complete, no mentor attached | Yes | **Yes — Self-Paced only** |
| `MENTORED` | mentor attached, seats available | Yes | Yes — Self-Paced **and** Mentored |
| `LIVE` | fully running | Yes | Both, as long as seats last |

**Dial 2 — Service** (who delivers human help?)

`SELF_PACED` (nobody promises a teacher) · `MENTORED` (a named mentor, with a seat count) ·
`MENTOR_PACK` (a small add-on of 4 live sessions for people who bought Self-Paced).

The two dials are independent on purpose. Course readiness is about **content**; service is about
**people**. Coupling them is what created the refund.

---

## Part 3 — Case A: what happens today if you publish without a mentor

**Tuesday, 10am.** You publish *Deep Learning* (6 chapters, 31 lessons). Content is 40% done —
chapters 1–2 are real, chapters 3–6 are still placeholders. Rahul has been hired but hasn't
finished his training, so **no mentor is attached**.

The card (hand-typed features) says: *"6 weeks · 31 lessons · Certificate · Live mentoring"*.

**What happens:**

| Hour | Event |
|---|---|
| T+0 | Course goes live. 100 people buy in the first week (Instagram ad + a WhatsApp forward) |
| T+3h | Priya opens Chapter 3 → "Coming soon" placeholder. No mentor to ask |
| T+1d | Priya posts in the community: "who is the mentor for this?" → no answer |
| T+2d | 12 support tickets: "no mentor", "content missing" |
| T+4d | 38 buyers request refunds (some cite "no mentor", some "content not as described") |
| T+6d | 2 reviews: "No teacher, no content after chapter 2" |

**The money (100 buyers, ₹6,999 each):**

| Line | Amount |
|---|---|
| Gross collected | ₹6,99,900 |
| Refunds paid back (38 buyers) | −₹2,65,962 |
| Payment gateway fees (~2% of all sales) | −₹13,998 |
| Ad spend / CAC (₹800 × 100) | −₹80,000 |
| Support load (38 angry refunds × ~₹150) | −₹5,700 |
| **Left in the bank** | **₹3,34,240** |
| Learners you still have | **62** (38 gone forever, and they told their friends) |

Compare with **Part 4** — same 100 buyers, same ad spend, **₹34,640 more** in your pocket and
100 learners instead of 62.

**Lesson:** don't sell a promise you can't staff. But also — don't refuse the sale. Sell the
*book*; sell the *teacher* only when you have one.

---

## Part 4 — Case B: the same course, done right

### Step 1 — Monday: syllabus locked, Chapter 1 finished, no mentor yet

You (admin) own the syllabus: 6 chapters, 14 topics, 31 lessons. **Chapter 1 (8 lessons) is
authored in-house** (your editor + AI-assisted drafting) — that is your rule: *Chapter 1 is
always yours.* It is also what Priya reads for free.

The course sits in `BUILDING`. The page says:

> **Deep Learning — launching 12 Aug**
> 2 of 6 chapters published · read Chapter 1 free · ask the AI tutor anything now
> **Join the waitlist →** (tier preference: Self-Paced / Mentored)

No payment button. No false promise. But the page **is** indexable (search engines love it),
and every visit is captured.

**100 people join the waitlist in 9 days.** You now know the demand without spending a rupee
on ads. You also learn *which tier* they want (the form asks) — 41 want Mentored, 59 want
Self-Paced. That number decides your headcount.

### Step 2 — Wednesday: hire and deploy

You hire Rahul (from the "out of work" pool — your own brand promise) into a 2-week paid
training + certification. You hire a second mentor, Sameer, as his backup. Both are on your
roster with a capacity: **25 mentored learners + 25 self-paced learners each**.

Rahul writes Chapter 3 (8 lessons) as his paid pilot, per the quality rubric:
≤15 min per lesson, speaker notes on every slide, ≥1 worked example, captions, a quiz with a
pass rule, thumbnail + title card. It passes review. He writes Chapters 4–6 to deadline.

**Learning loads weekly** (contracted): Chapter 1 = in-house, Ch 2 = another mentor (Sameer),
Ch 3 = Rahul, Ch 4 = Rahul, Ch 5 = Sameer, Ch 6 = Rahul. **No chapter depends on one person.**

### Step 3 — Monday 12 Aug: the cohort opens

| Course state | `MENTORED` — seats shown on the page: **"18 of 25 seats left"** |
|---|---|

Priya (waitlist #3, chose Mentored) buys at ₹6,999:

1. Order created → **seat held for 30 minutes** (this is the fix for the bug where two buyers
   grab the last seat)
2. Razorpay payment → verified → seat consumed, `Order.mentorUserId = Rahul`
3. Confirmation: "Your mentor is Rahul. Live session 1: Sat 9 Aug, 10:00. Reply SLA: 4 working
   hours. Your AI tutor is available now."

Aarav, who chose Self-Paced, buys at ₹2,999 instead — **instant, no seat limit, no mentor
promise**. He still gets the community, the AI tutor, assignments and the certificate.

### Step 4 — The money for those 100 buyers

Same 100 people, same ₹800 CAC, same ads:

| Line | Amount |
|---|---|
| 40 buyers × Mentored ₹6,999 | ₹2,79,960 |
| 60 buyers × Self-Paced ₹2,999 | ₹1,79,940 |
| **Gross** | **₹5,09,880** |

| Cost | Basis | Amount |
|---|---|---|
| Mentor payroll | 2 mentors × ₹28,000 gross × 1.18 (PF/ESI/leave) | ₹66,000 |
| Freelance content royalty | 100 × ₹300 (only if content was freelance-made) | ₹30,000 |
| Completion + rating bonuses | ~70 completers × ₹100 + 5-star bonuses | ₹9,000 |
| AI tutor inference (once built) | 100 × ₹25 | ₹2,500 |
| Support / ops | | ₹8,000 |
| Payment + taxes + refund reserve (5%) | | ₹25,500 |
| **Total cost** | | **₹1,41,000** |
| **Contribution** | | **₹3,68,880 (72%)** |

**vs. Case A: ₹3,34,240 and 62 learners → ₹3,68,880 and 100 learners.**
Same ad spend, ~₹35,000 more contribution, 38 refunds avoided, and 38 extra learners who can
later buy a Mentor Pack.

### Step 5 — The break-even that sets your headcount

One mentor costs **₹33,000 loaded** (₹28,000 gross × 1.18). His contribution per learner:

| Buyer type | Contribution each | Learners needed to pay one mentor |
|---|---|---|
| Mentored (₹6,999) | ~₹5,110 | **~7** |
| Self-Paced (₹2,999) | ~₹1,780 | **~19** |

With incentives included (bonuses only get paid on success), one mentor costs ~₹52,700 and
needs ~10 mentored or ~30 self-paced buyers. Either way:

> **Rule: one mentor carries ~50 learners (25 mentored + 25 self-paced).**
> **Rule: never open a cohort below ~15 buyers — run Self-Paced and hold a waitlist instead.**
> **Rule: hire against learners, not against courses.** 100 learners → 2 mentors, whatever the
> courses are called.

---

## Part 5 — Case C: Priya asks a question at 2am

**2:07am, Tuesday.** Priya is stuck on "why does ReLU beat sigmoid in hidden layers?"

| Who answers | How | When |
|---|---|---|
| **AI tutor** (grounded in Chapter 2 lesson 3 + the transcript of Rahul's live session) | instantly, with a citation to the exact lesson | 2:07am |
| **Community** | 6 other learners answered the same question in Chapter 2's thread | by morning |
| **Rahul** | sees it in his queue next working morning | within 4 working hours |

**Why this matters commercially:** "nobody answered me" is the #1 refund reason. Every question
answered at 2am by the tutor is a refund you don't pay. That's why the AI tutor is not a
gimmick — it's the thing that makes an "always-on" promise true without hiring a night shift.

**What you must NOT promise:** a human at 2am. The math:

- 24/7 human cover = 3 shifts × 8 h × 30 days = **720 mentor-hours/month**
- At ₹600/h = **₹4,32,000/month** — before a single rupee of content cost

So the honest promise is four things:

1. Instant answers any hour (AI tutor)
2. Mentor reply within 4 working hours (SLA on a roster)
3. Live sessions on a published calendar (+ recordings)
4. Community answers in between

Marketing line: **"always-on learning support"**, not "24/7 live mentoring".

---

## Part 6 — Case D: Rahul quits on day 3 of the cohort

**Wednesday, 11am.** Rahul's message: *"I got an offer I can't refuse. Sorry."* 25 learners are
in his cohort. 3 live sessions done (recordings exist). Chapter 3 content is published.

**The playbook (run automatically, not by panic):**

| Step | What happens | Cost |
|---|---|---|
| 1 | Admin flips Rahul → `onLeave`, cohort → `MENTOR_PAUSED` | ₹0 |
| 2 | Sameer (the named backup) picks up the live Q&A within 48h | ₹0 (standby paid ₹4,000/month) |
| 3 | Every learner gets a **₹1,000 service credit** (store credit, not cash) + a note: "Sameer is now your mentor for live sessions" | ₹25,000 liability, mostly offset later |
| 4 | Course card shows "cohort in recorded + community mode" | ₹0 |
| 5 | Rahul's incentives stop accruing for sessions not delivered; salary runs to month end (he's an employee — you don't punish a resignation by not paying him) | ₹28,000 (already budgeted) |
| 6 | If no backup had existed: 7-day deadline, then full refund offered to all 25 | ₹1,74,975 (worst case) |

**Why this is survivable:** content doesn't live in Rahul's head — it lives in `Lesson` rows with
`isPublished`, and the recordings live in `LiveMeeting.recordingPath`. Chapter 3 was already
published. Rahul is a *service*, not the product.

**Why 2 mentors per cohort is non-negotiable:** the backup costs you ₹4,000/month. The absence
costs you up to ₹1,74,975 in refunds and a cohort's reputation.

---

## Part 7 — Case E: someone wants to buy but the cohort is full

**Saturday.** Aarav finishes Self-Paced at 11pm and wants the teacher: "Can I get Rahul?"

Cohort is full (25/25). What he sees:

> **Mentored cohort is full** — next cohort starts 12 Aug. **Join the waitlist** (you're first in
> line) **or** add the **Mentor Pack** — 4 live sessions with a mentor + 2 doubt slots, ₹2,499.

| Path | What you earn | Mentor load |
|---|---|---|
| Waitlist for next cohort | ₹0 now, ₹6,999 later | 0 (batch waits) |
| Mentor Pack now | ₹2,499 | 1 session (cap: 30 packs per mentor per month) |

Across 60 Self-Paced buyers, if 25% take the pack → **15 × ₹2,499 = ₹37,485** of near-pure
margin (the mentor's time is already in his salary). This is the cheapest revenue you will ever
add, because the content is already paid for.

**Hard UI rule:** the "Mentored" button may only render when an open cohort has free seats. If no
cohort is open, the page shows Self-Paced + waitlist. Never show a button you can't honour.

---

## Part 8 — What a mentor's month looks like (and why they'd say yes)

**Rahul, August:**

| Item | Amount |
|---|---|
| Gross salary | ₹28,000 |
| Completion bonus (17 of his 25 learners finished × ₹100) | ₹1,700 |
| 5-star learner bonus (capped) | ₹3,000 |
| Authorship bonus (60 Self-Paced enrollees × ₹300, first 12 months, capped) | ₹15,000 |
| **His month** | **₹47,700** (before TDS) |

**What the platform paid for all of it:** ₹33,000 loaded + ₹19,700 incentives = ₹52,700 for
**50 learners** (25 mentored + 25 self-paced). Per learner ≈ ₹1,054/month.

**Why this offer attracts people who are out of work:** a fixed ₹28,000 with no client
acquisition, no sales, no invoicing, plus performance upside, fully remote, plus a certificate
they can put on their CV and a "Mentored by Rahul" badge that builds their own portfolio. That
is a much better pitch than "we'll pay you ₹300 per enrolment" — and it's cheaper for you,
because the salary is fixed and the incentives only get paid when learners actually succeed.

**Paying him (India, real mechanics):**

| Item | How |
|---|---|
| Salary | Monthly bank transfer, TDS under **u/s 192** at his slab rate, payslip + Form 16 |
| Statutory loading | PF/ESI/leave/bonus ≈ 18% on gross (₹28,000 → ₹33,000 all-in) |
| Incentives | Same payroll cycle, itemised on the payslip |
| Freelance content people | Per-asset royalty, TDS under **u/s 194C** — 1% with PAN, 20% without; TDS certificate quarterly |
| Ledger | A new append-only `MentorPayout` table (type: SALARY / INCENTIVE / ROYALTY / PILOT). **None of this exists in the code today** |
| One-time bug to fix | `Order.mentorUserId` re-checks the seat only at *fulfilment* — reserve the seat at order creation with a 30-min TTL, or two buyers can grab the last seat after the money moves |

---

## Part 9 — Counterfactual: what if we keep today's model?

Suppose you fix only the "don't sell without a mentor" bug: publish a course **only** when a
mentor and 100% content are ready. Consequences:

| | Single price + mentor-ready gate | Two-dial ladder |
|---|---|---|
| Courses live at any time | 2 (one cohort per mentor) | All content-ready courses, plus waitlist pages for the rest |
| SEO / discovery | Almost nothing to index — 2 pages | Every course has a public page (catalog) + "launching soon" pages |
| Buyer without mentor patience | Turned away → lost | Buys Self-Paced now → kept |
| Price | ₹6,999 for everyone — Self-Paced buyers overpay by ₹4,000 | ₹2,999 / ₹6,999 — you capture both willingness-to-pay levels |
| Waiting-list data | None (no page to capture it) | Exact demand + tier preference per course |
| Mentor risk | One absence = one course dies | One absence = one cohort pauses; catalog unaffected |

The single price is the quiet killer: it charges the person who never wanted a teacher the full
price, and refuses the person who would have paid ₹2,999 for the content alone.

---

## Part 10 — Your Monday dashboard (3 numbers, not 20)

1. **Catalog readiness board** — every course: state, % of lessons published, mentor assigned?,
   seats left, days to start. Traffic light. Only green = buyable.
2. **Mentor SLA board** — per mentor: sessions delivered vs promised, average reply time,
   learners affected by an absence, incentives pending. This is where "24/7-ish" actually breaks.
3. **Refund reasons** — coded (`no_mentor`, `content_incomplete`, `not_as_described`).
   `no_mentor` is a staffing alarm and it should page you; `content_incomplete` is a publishing
   gate alarm.

---

## Part 11 — The decisions I need from you

Reply in one line per row, e.g. `1. 2999/6999 ✓  2. 28k ✓  3. 25+25 ✓  4. 15 ✓  5. 4h ✓  6. build ✓  7. employed+freelance ✓  8. 14-day ✓`
— or just say **"all defaults"**.

| # | Decision | My default | What changes if you pick something else |
|---|---|---|---|
| 1 | Self-Paced price / Mentored price | ₹2,999 / ₹6,999 | Higher Self-Paced = fewer buyers, more per buyer. Lower = more buyers, Mentor Pack does more work |
| 2 | Mentor gross salary | ₹28,000/mo (₹33,000 loaded) | Lower → you must cut cohort quality or accept a bigger SLA queue. Higher → break-even rises, so raise price or serve more learners per mentor |
| 3 | Learners per mentor | 25 mentored + 25 self-paced | Lower → safer service, more salary per learner. Higher → thinner service, faster break-even |
| 4 | Minimum buyers to open a cohort | 15 | Lower → mentors idle, cohorts feel empty. Higher → you refuse sales you could have taken as Self-Paced |
| 5 | Mentor reply SLA | 4 working hours | Tighter (2h) = more mentors or fewer learners each. Looser (24h) = weaker promise, better margin |
| 6 | AI tutor | Build it (Day 61–90) | Skip it → you cannot honestly promise "instant answers" and `no_mentor` refunds stay |
| 7 | Mentor staffing shape | Employed mentors (salary) + freelance content contributors (royalty) | Pure freelance = variable cost, no loyalty, quality swings. Pure salary = content authors cost full-time for one-off assets |
| 8 | Refund policy | 14 days; target 3% self-paced / 5% mentored; reason codes | No window = lower refunds but trust cost. Longer window = trust gain, more refund exposure on mentored |
| 9 | *(optional)* Pre-sale discount | ₹4,999 for waitlist buyers before launch | Locks cash early, discounts early buyers |
| 10 | *(optional)* Backup mentor standby pay | ₹4,000/month per backup mentor | It's the cheapest insurance you can buy vs ₹1.75L of cohort refunds |

**Also worth deciding (not blocking):** which 2–3 courses get Chapter-1 in-house authorship first
(recommend: *Deep Learning* and the 2 highest-demand waitlist courses), and whether "Mentor Pack"
is ₹2,499 flat or ₹399/month × 6 (recurring looks better on a card but complicates refunds).

---

## Part 12 — What happens next

Once you answer Part 11, the P0 code slice is small and concrete:

| # | Change | Where |
|---|---|---|
| 1 | `Course.state` + readiness computation (readiness % from chapters/topics/lessons) | `backend/prisma/schema.prisma`, `backend/src/modules/courses/` |
| 2 | Two-tier pricing (`priceSelfPaced`, `priceMentored`, `mentorPackPrice`) + order creation by tier | `courses.routes.ts`, `payments` module |
| 3 | Seat reservation at order creation with TTL (fixes the double-booking bug) | `enrollment-helpers.ts` + payments webhook |
| 4 | `Waitlist` model + public "launching soon" page + email capture | new model + `frontend/src/app/courses/[slug]/` |
| 5 | Course card stats derived from DB (lesson count, duration, certificate, mentor) — kills the hand-typed "31 lessons" lie | course card component |
| 6 | `MentorProfile` + `MentorPayout` ledger + capacity roster view | new models + admin UI |
| 7 | Readiness + SLA + refund-reason dashboards | admin module |

That is the whole gap between "we publish and hope" and "we never sell what we can't deliver".
