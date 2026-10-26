# How Other Platforms Pay Mentors & Instructors

Research notes, verified against platform policy pages (Sept–Oct 2026). Every model below is one
of **four shapes** — everything else is a variation.

| Shape | Who takes the risk | Typical cut to platform |
|---|---|---|
| **1. Marketplace revenue share** | Platform finds students; instructor gets a slice | 10–63% |
| **2. Subscription royalty pool** | Platform sells subscriptions; pay split by minutes watched | ~15–50% of subscription revenue |
| **3. Employment / salary** | Platform hires; fixed pay regardless of sales | 100% of revenue, fixed cost |
| **4. SaaS (BYO payments)** | Creator keeps ~all revenue, pays a monthly fee | 0% of sales + $29–143/mo |

---

## 1. Marketplace revenue share

| Platform | Price set by | Instructor keeps | Platform keeps | Basis | Payout |
|---|---|---|---|---|---|
| **Udemy** (organic sale) | Instructor, but Udemy discounts heavily | **37%** | 63% | per course sale | monthly |
| **Udemy** (instructor's own coupon/link) | Instructor | **97%** | 3% | per course sale | monthly |
| **Udemy Business / Personal Plan** | Platform | **15%** of the sub pool (from Jan 2026; was 25% in 2023) | 85% | share of minutes consumed | monthly |
| **Maven** | Instructor | **90%** | 10% | per enrollment (B2B/private cohorts split 50/50) | Stripe, per enrollment |
| **Outschool** | Teacher | **70%** | 30% "Teacher Fee" | per class enrollment | PayPal, 7–8 days after start |
| **Preply** | Tutor | **67–82%** | 18–33% sliding (33% new → 18% after 400+ hours); **100% of the first trial** | per lesson | weekly |
| **italki** | Tutor | **79%** single lesson; 81% 5-pack; 83% 10-pack; 85% 15/20-pack; 100% trial | 21% / 19% / 17% / 15% / 0% | per lesson or pack | — |
| **Wyzant** | Tutor | **75%** | 25% flat | per lesson hour | — |
| **Unacademy** (India) | Platform | entry ₹20–40k/mo reported; revenue-share tied to subscriptions for many educators | not published | subscription/engagement | monthly |

**Pattern:** the platform takes 25–65% **only when it brings the students**. When the instructor
brings the buyer (Udemy coupon = 97%, Maven = 90%), the platform's cut collapses to 3–10%.

---

## 2. Subscription royalty pool (pay for engagement, not sales)

| Platform | How the pool works | Instructor gets | Notes |
|---|---|---|---|
| **Skillshare** | Portion of subscription revenue allocated monthly to a Teacher Fund; split by share of qualifying minutes watched | proportional share of the fund (no fixed %) | Eligibility: 50 followers + >400 min watched (or >650 if no new class in 18 months). Paid on the 16th via Tipalti. $100 engagement reward for top teachers |
| **Udemy Business** | 15% of monthly subscription revenue is the instructor pool; split by minutes consumed | 15% pool share | Rewatched minutes count |
| **Pluralsight** | Viewership-based payments, quarterly | not published | Authors also get production support |
| **LinkedIn Learning** | Flat fee per course + royalty on subscriber viewing (reported) | flat ~$1–5k/course + 10–15% royalty (reported, not official) | Invitation-only |

**Pattern:** a pool works only with a **huge catalog and subscription revenue**. It pays per minute
watched, so a niche course with 12 learners earns almost nothing. It also caps platform cost as a
fixed % of subscription revenue.

---

## 3. Employment / salary (the Indian test-prep model)

| Platform | Model | Reported pay | Notes |
|---|---|---|---|
| **Vedantu** | Hires tutors; per-session/per-hour | ₹200–500/hr entry; ₹25,000–75,000/mo for 4h/day (their careers page: min ₹25k, up to ₹75k+) | Payouts before the 5th; teacher can propose rates, platform approves |
| **PhysicsWallah** | Salaried employees | Entry faculty ~₹4–8 LPA (₹35–65k/mo); senior/star much more, plus equity | Fixed salary, platform owns audience and pricing |
| **Unacademy** | Hybrid: salary + subscription-linked revenue share for top educators | Entry ₹20–40k/mo; top educators earn lakhs | Star educators got ₹1–7 crore contracts + equity during the poaching war (2022) |
| **Coursera** | Partner institutions, not individuals | Partner gets a share (reported 20–45% of course revenue; 15–30% of subscription) | The *institution* pays the instructor — Coursera doesn't |
| **Company L&D teams** | Salary | market rate | Content is owned outright; no royalty |

**Pattern:** employment is what you do when the **platform owns the audience and the pricing**.
It gives predictable cost and total control, and it is the only model where "24/7-ish" service
levels are even schedulable (you can roster shifts).

---

## 4. SaaS — the platform takes 0% of course sales

| Platform | Platform fee | Subscription | Who pays the instructor |
|---|---|---|---|
| **Thinkific** | 0% (paid plans); Revenue Partners feature **tracks** a % but **pays outside** the platform | $36–149/mo | You, manually |
| **Teachable** | 7.5% Starter → 0% Builder+ | $29+/mo | You, manually |
| **Kajabi** | 0% via Kajabi Payments (2% with third-party) | $143+/mo | You, manually |
| **Podia** | 5% Mover → 0% Shaker+ | $42+/mo | You, manually |

**Pattern:** these are **tools for creators who already have an audience**. They give you tracking,
not payroll. If you're the school (you own the brand, the students, the pricing), this model is
irrelevant to you — you'd be the creator, not the platform.

---

## 5. What this means for EDUALTTECH

We are **not** Udemy (we don't have millions of marketplace students) and **not** Teachable (we're
not selling software to other schools). We're closer to **Vedantu/PhysicsWallah + Maven**:

- **We own the audience and the price** → employment/salary for live mentors (Vedantu/PW model).
- **We sell cohorts** → Maven-style per-enrollment logic, but the fee stays in-house because the
  mentor is salaried (no 90/10 split needed — you already pay them monthly).
- **We sell doubt sessions separately** → per-session platform fee. Market benchmarks: italki
  15–21%, Preply 18–33%, Wyzant 25%, Outschool 30%. **20% is competitive and lean.**
- **Course authoring is a one-time asset** → flat fee per chapter (LI Learning / Pluralsight style)
  + a small capped royalty (Udemy-style, but bounded) so authors keep earning if it sells.

| Role | Pay shape | Benchmark it copies | Our number |
|---|---|---|---|
| Employed live mentor | Monthly salary + outcome bonuses | Vedantu / PhysicsWallah | ₹28,000 gross (~₹33,000 loaded) |
| Course author (freelance) | Flat per chapter + capped royalty | LinkedIn Learning / Pluralsight + Udemy | ₹5,000/chapter + ₹200/enrollee for 12 mo, min ₹25,000 |
| Course author (employed mentor) | Rare: salary covers it; royalty as bonus | Unacademy hybrid | ₹200/enrollee bonus, 12 mo |
| Doubt session | Learner pays, platform fee | italki / Preply / Outschool | ₹699/session or ₹2,499 pack, platform 20% |
| Cohort delivery | Included in salary | Maven-style delivery, salaried cost | salary, no % cut |

**Three things not to copy:**

1. **Udemy's 63% cut** — only defensible if you spend millions on ads to bring the student.
   Instructors accept it because Udemy brings demand. You bring the demand; a 63% cut would be
   theft and mentors would leave.
2. **Skillshare's minutes pool** — needs a subscription catalog with heavy watch volume. On a
   31-lesson course with 100 learners, pool payouts round to zero and mentors feel cheated.
3. **Coursera's partner model** — requires universities/companies as the counterparty. A solo
   mentor can't sign a partner agreement.

**One thing to copy from Udemy:** the **instructor-referral premium**. Pay a much higher share
(or a flat referral bonus) when the mentor brings the learner. It turns mentors into a sales
channel at zero fixed cost.

---

## 6. Confidence notes

| Claim | Source quality |
|---|---|
| Udemy 37% / 97% / 15% subscription pool | **Official** (Udemy support + SEC exhibit) |
| Outschool 30% fee, PayPal 7–8 days | **Official** (policy updated Mar 2026) |
| Preply 33→18%, 100% trial | **Official** (Preply help centre) |
| italki 15–21% tiered | **Official policy**, quoted via comparison guide |
| Maven 90/10, 50/50 B2B | **Official** (Maven help centre) |
| Skillshare Teacher Fund + eligibility | **Official** (Skillshare help centre, updated Sept 2026) |
| Thinkific Revenue Partners pays outside platform | **Official** (Thinkific help centre) |
| Teachable 7.5%/5%/0% by plan | **Official** (Teachable pricing/comparison page) |
| Vedantu ₹25k–75k/mo, payouts before 5th | **Official careers page** |
| PhysicsWallah/Unacademy salary bands | **Community-reported** — treat as directional only |
| LinkedIn Learning flat fee + royalty | **Reported**, not confirmed by LinkedIn |
| Coursera 20–45% partner share | **Reported** (affiliate blog), not official |

## 7. Sources

- Udemy instructor revenue share — https://support.udemy.com/hc/en-us/articles/229605008
- Udemy subscription pool (15% in 2026) — https://support.udemy.com/hc/en-us/articles/115013221767
- Outschool teacher earnings policy — https://support.outschool.com/en/articles/2382129
- Preply commission model — https://help.preply.com/en/articles/4171383
- italki fees (tiered) — https://www.plainchalk.com/blog/esl-platform-commission-league-table-2026
- Maven getting paid (90/10) — https://help.maven.com/en/articles/5593804
- Maven revenue sharing details (B2B 50/50) — https://help.maven.com/en/articles/12240853
- Skillshare earnings + 2026 eligibility — https://help.skillshare.com/hc/en-us/articles/4415798406285
- Skillshare earnings update (July 2026) — https://help.skillshare.com/hc/en-us/articles/46487542333837
- Thinkific Revenue Partners — https://support.thinkific.com/hc/en-us/articles/360030370454
- Teachable platform comparison (fees) — https://www.teachable.com/blog/how-to-choose-an-online-course-platform
- Vedantu teacher earnings — https://www.vedantu.com/become-a-teacher
- Pluralsight author program — https://www.pluralsight.com/teach
- Unacademy/Vedantu pay comparison (reported) — https://supatutor.in/unacademy-vs-vedantu-for-teachers/
- PhysicsWallah/Vedantu salary (reported) — https://www.findmyguru.com/compare/physicswallah-vs-vedantu-jee
