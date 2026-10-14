# EduAltTech — Pre-Login (Public) Pages

Complete reference of every page reachable **before authentication** — routes,
layout, verbatim copy, images, and navigation. Extracted from the source at
`frontend/src/app` and `frontend/src/components`.

## Route index

| Route | Page | Group |
| --- | --- | --- |
| `/` | Home / landing | Marketing |
| `/courses` | Course catalogue | Marketing |
| `/courses/[slug]` | Course detail | Marketing |
| `/services` | Services & Programs | Marketing |
| `/mentor` | Become a mentor | Marketing |
| `/work` | Our Work | Marketing |
| `/team` | Team | Marketing |
| `/partners` | Partners & Organizations | Marketing |
| `/about` | About | Marketing |
| `/contact` | Contact | Marketing |
| `/faq` | Help & FAQ | Marketing |
| `/privacy` | Privacy Policy | Legal |
| `/terms` | Terms | Legal |
| `/refund-policy` | Refund Policy | Legal |
| `/login` | Sign in | Auth |
| `/signup` | Sign up | Auth |
| `/forgot-password` | Forgot password | Auth |
| `/reset-password` | Reset password | Auth |
| `/verify-email` | Verify email | Auth |
| `/reactivate` | Reactivate account | Auth |
| `/complete-registration` | Complete registration | Auth |
| `/auth/callback` | OAuth callback (no UI) | Auth |

---

## Marketing pages

### Home — `/`
- **Source**: `frontend/src/app/page.tsx`
- **Title tag**: `Edu Alt Tech (EduAltTech) — practical AI, entrepreneurship and technology courses`
- **Meta description**: `Edu Alt Tech (EduAltTech) teaches practical AI, entrepreneurship, and technology through structured courses, alternate learning, and tuition — taught by skilled mentors we employ, plus the software we build for schools.`

**Layout** — Rendered in order: **Hero** (2-col split on desktop, 1-col mobile; white background; badge, h1, lead, two buttons on left, single photo card on right) → **PartnerStrip** (`scroll` marquee variant; `bg-slate-50` with top/bottom borders; full-width auto-scrolling logo cards) → **Offerings** (`bg-slate-50`; SectionHeading + single bordered rounded list of 4 rows, each row `sm:grid-cols-[auto_1fr_auto]` on desktop, stacked on mobile) → **PhotoBand** (`bg-white`; heading block + 3-col photo grid `sm:grid-cols-3`, 1-col mobile) → **Course discovery preview** (`bg-white`; heading with inline "View all courses" link, then 3-col course grid `sm:grid-cols-2 lg:grid-cols-3`, 1-col mobile) → **Pathway** (`bg-white`; SectionHeading + 2-col split `lg:grid-cols-2`, 1-col mobile) → **Final CTA** (`bg-brand-700` full-bleed, centered text, two buttons). No sticky elements on this page.

**Content (top to bottom)**

1. **Hero** (from `frontend/src/components/landing/Hero.tsx`)
   - Badge: `Education beyond the syllabus`
   - H1: `Edu Alt Tech — an education company that also puts skilled people to work`
   - Lead paragraph: `EduAltTech teaches students through structured courses, alternate learning, and tuition — and employs skilled people who were out of work as the mentors who teach them. One platform, opportunity on both sides.`
   - CTA: `Explore courses` → `/courses`
   - CTA: `Teach with us` → `/mentor`
   - Images: `/media/photos/EAT3.jpg` (alt: "An EduAltTech learning session") — hero right (4:3 rounded card)

2. **PartnerStrip** (from `frontend/src/components/landing/PartnerStrip.tsx`, `scroll` variant)
   - Eyebrow/caption: `Schools & organizations we work with`
   - Logos (auto-scrolling marquee; duplicated for loop):
     - `/media/logos/genesis.png` (alt: "Genesis")
     - `/media/logos/mamasparsh.png` (alt: "MamaSparsh")
     - `/media/logos/new_era.jpg` (alt: "New Era")
     - `/media/logos/sharada_vidhyalaya.jpeg` (alt: "Sharada Vidhyalaya")
   - Link: `See all partners & organizations` → `/partners`

3. **Offerings** (from `frontend/src/components/landing/Offerings.tsx`)
   - Eyebrow: `What we offer`
   - Title: `Four things EduAltTech does`
   - Lead: `Education for students and work for the people who teach them — the two halves feed each other.`
   - Items (rows `01`–`04`, each with icon, title, body, and inline arrow link):
     1. `01` — `Education and alternate education` — `Structured courses in AI, entrepreneurship, and applied technology, plus alternate learning for students who need a path beyond the standard syllabus — organised into clear chapters, topics, and lessons.` — CTA: `Browse courses` → `/courses`
     2. `02` — `Tuition facilities` — `Guided tuition and coaching that sits alongside our courses — subject support, doubt sessions, and hands-on practice, in person and online.` — CTA: `See tuition` → `/services`
     3. `03` — `Employment for skilled people` — `We recruit skilled people who are out of work, train them as mentors and tutors, and employ them to teach. Teaching with us is real work, not volunteering.` — CTA: `Teach with us` → `/mentor`
     4. `04` — `Technology for schools` — `We build practical digital solutions with and for schools — the same problems our courses teach learners to solve.` — CTA: `See school solutions` → `/services`

4. **PhotoBand** (from `frontend/src/components/landing/PhotoBand.tsx`)
   - Eyebrow: `Inside our classrooms`
   - Title (h2): `Real rooms, real mentors, real students`
   - Lead: `Sessions run face to face and online, led by mentors who came to us as skilled people looking for work. The students in front of them are why it matters.`
   - Photos (3-col band; `h-64` mobile, `sm:h-96` desktop):
     - `/media/photos/EAT2.jpg` (alt: "A teaching session at EduAltTech")
     - `/media/photos/EAT3.jpg` (alt: "A mentor working with learners at EduAltTech")
     - `/media/photos/EAT4.jpg` (alt: "A learner at work during an EduAltTech session")
   - Statement strip (mono uppercase): `Every student we teach is a job for a skilled person who needed one.`

5. **Course discovery preview** (inline in `page.tsx`)
   - Eyebrow: `Courses`
   - Title (h2): `Start with something you can build`
   - Link: `View all courses` → `/courses`
   - Course grid: renders up to 6 newest courses as `CourseCard` tiles (`/courses?limit=6&sort=newest`), 3-col `lg:grid-cols-3` / `sm:grid-cols-2` / 1-col mobile. Card content is data-driven (title, description, thumbnail, category/domain chip, up to 4 feature bullets, price, `View course` eye link to `/courses/{slug}`).
   - Empty state (when catalogue returns no items):
     - H3: `Courses are being published`
     - Body: `Our catalogue is being prepared. Check back soon for courses to start learning.`
     - CTA: `Open the catalogue` → `/courses`
     - CTA: `Contact us` → `/contact`
   - Error state (when fetch fails, `DataUnavailable label="the course catalogue"`):
     - H2: `We couldn't load the course catalogue right now`
     - Body: `Something went wrong on our side — this isn't an empty page. Please try again shortly, or reach out and we'll help directly.`
     - CTA: `Contact us` → `/contact`

6. **Pathway** (from `frontend/src/components/landing/Pathway.tsx`)
   - Eyebrow: `Get involved`
   - Title (h2): `Learn as a student, or earn as a mentor`
   - Lead: `Two clear paths. Mentoring is a paid role granted per course after review — never as a global account role.`
   - Left card (slate-50) — H3: `Learn as a student`
     - Numbered steps: `1` `Create an account and verify your email.` / `2` `Browse the catalogue and open a course to see its roadmap.` / `3` `Enrol — free or paid — and start at your own pace.` / `4` `Work through lessons with your course mentors.`
     - CTA: `Get started` → `/signup`
     - CTA: `Explore courses` → `/courses`
   - Right card (dark `ink-900`) — H3: `Teach and earn with us`
     - Body: `If you have real skill but no steady work, teaching here is a paid role. Apply for a specific course; our team reviews each application, and accepted mentors are employed to teach that course only.`
     - Bullets: `Apply with your qualification and a short note.` / `Applications move through review; we may schedule a short interview.` / `Accepted mentors get paid authoring and session tools for their course.`
     - CTA: `Apply to mentor` → `/mentor`

7. **Final CTA** (inline in `page.tsx`)
   - H2: `Learn with us, or teach and earn with us`
   - Body: `Whether you are a student ready to build, a skilled person looking for work, or a school after a technology partner, there is a clear next step.`
   - CTA: `Explore courses` → `/courses`
   - CTA: `Teach with us` → `/mentor`

---

### About — `/about`
- **Source**: `frontend/src/app/about/page.tsx`
- **Title tag**: `About`
- **Meta description**: `EduAltTech helps learners build practical AI, entrepreneurship, and technology skills — and builds working digital solutions for schools. A product by Setsuzoku.`

**Layout** — Sections in order: **Intro** (`bg-slate-50`, bottom border; breadcrumb nav then `SectionHeading as="h1"`) → **Why practical learning** (`py-16/20`, white; 2-col split `lg:grid-cols-[1fr_1fr]`, 1-col mobile) → **Learning and livelihood** (`border-t`, white; SectionHeading + 3-col grid `lg:grid-cols-3`, 1-col mobile; each card `01`–`03`) → **Approach** (`bg-slate-50`; SectionHeading + single bordered list of 4 rows, each `sm:grid-cols-[auto_1fr]`) → **School technology** (`white`; 2-col split heading/content + 3-col work-card grid `sm:grid-cols-2 lg:grid-cols-3` when work exists) → **Team** (`border-t`, white; SectionHeading + roster grid `min-[500px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5`, capped `max-w-xl`/`md:max-w-3xl` centered) → **Closing action** (`border-t`, bg-slate-50; centered heading + 3 buttons). No sticky elements.

**Content (top to bottom)**

1. **Intro**
   - Breadcrumb: `Home` → `/` · `About`
   - Eyebrow: `About EduAltTech`
   - H1: `Practical learning, and work for the people who teach it`
   - Lead: `EduAltTech does two connected things. We help students learn practical skills in AI, entrepreneurship, and technology — through courses, alternate education, and tuition — and we employ skilled people who were out of work as the mentors who teach them. We also build useful software for the schools that run our programs.`

2. **Why practical learning**
   - H2: `Why practical learning`
   - Paragraphs:
     - `The skills that matter most — building software, solving a real problem, turning an idea into something people can use — are learned by doing. A syllabus alone rarely produces them.`
     - `EduAltTech exists to close that gap. We build structured courses where learners work through real, practical tasks with mentors, and we keep the focus on outcomes rather than theory.`
     - `The same belief shapes our work with schools: understand the problem, then build something that actually helps.`

3. **Learning and livelihood**
   - Eyebrow: `Education and employment`
   - Title: `Learning and livelihood, together`
   - Lead: `Three commitments sit behind everything we run. They are practical, and each one has to be real to count.`
   - Cards:
     1. `01` — `Education and alternate education` — `Students get structured courses and, where the standard path does not fit, alternate learning routes to the same practical outcomes.`
     2. `02` — `Tuition facilities` — `Guided tuition and coaching alongside our courses — subject support, doubt sessions, and hands-on practice, in person and online.`
     3. `03` — `Employment for skilled people` — `We recruit skilled people who are out of work, train them as mentors and tutors, and employ them to teach. This is paid work, not volunteering.`

4. **Approach**
   - Eyebrow: `Our approach`
   - Title: `Four ideas we work from`
   - Lead: `These principles guide both how we teach and what we build.`
   - Items (numbered rows with icon):
     1. `01` — `Learn by building` — `Skills are formed by making things, not by reading about them. Every course is organised around practical work you carry out yourself.`
     2. `02` — `Understand the problem first` — `Before choosing a tool, we teach learners to understand the real problem in front of them — the same discipline we apply to our own projects.`
     3. `03` — `Connect technology with entrepreneurship` — `Building something useful and making it sustainable are different skills. We treat both as part of the same capability.`
     4. `04` — `Aim beyond theory` — `The goal is a working outcome — a prototype, a small venture, or a tool that solves a problem around you.`

5. **School technology**
   - Eyebrow: `Technology for schools`
   - Title: `Software built with schools, not just for them`
   - Lead: `We design and build digital solutions that reduce administrative load and support teaching — starting from a concrete problem a school is facing.`
   - Paragraph: `Each engagement begins with understanding how a school actually works, then building the smallest thing that genuinely helps. We do not claim a solution is deployed unless the record shows it.`
   - CTA: `Services & programs` → `/services`
   - CTA: `See our work` → `/work`
   - Work cards (up to 3 from `/cms/public/work`, rendered only when data returns items; `WorkCard` layout: 16:10 cover image or category fallback, organization name, title, summary).

6. **Team**
   - Eyebrow: `Our team`
   - Title: `The people behind EduAltTech`
   - Lead: `The educators, builders, and mentors who make our courses and school technology work.`
   - Roster (13 members; circular portraits with initials fallback, hover border/highlight):
     | Name | Title | Image (alt: "Portrait of {name}") |
     |------|-------|-----------------------------------|
     | Uma | Founder | `/media/newTeam/uma.jpeg` |
     | Srinivas | Project Coordinator | `/media/newTeam/srinivas.jpeg` |
     | Varun | Full Stack Developer | `/media/newTeam/Varun_PP.png` |
     | Satish | Full Stack Developer | `/media/newTeam/satyanarayana.jpeg` |
     | Harshitha | Frontend Developer | `/media/newTeam/harsitha.jpeg` |
     | Avinash | Marketing and Graphic Designer | `/media/newTeam/avinas.jpeg` |
     | Srujan | Client Relations | `/media/newTeam/srujan.jpeg` |
     | Ranadeep | Full Stack Developer, Client Relations | `/media/newTeam/Ranaadeep.jpeg` |
     | Hemanth | Full Stack Developer | `/media/newTeam/Hemanth.jpeg` |
     | Chandhini | Project Coordinator, AI Development | `/media/newTeam/alrihab.jpg` |
     | Priya | Graphic Designer | `/media/newTeam/Priya.jpeg` |
     | Gani | Digital Marketing | `/media/newTeam/gani.jpeg` |
     | Gnana | Frontend Developer | `/media/newTeam/Gnana.jpeg` |

7. **Closing action**
   - H2: `Where would you like to start?`
   - Body: `Learn something practical, see technology we have built, or talk to us about your school.`
   - CTA: `Explore courses` → `/courses`
   - CTA: `Services & programs` → `/services`
   - CTA: `Contact us` → `/contact`

---

### Services & Programs — `/services`
- **Source**: `frontend/src/app/services/page.tsx`
- **Title tag**: `Services & Programs`
- **Meta description**: `EduAltTech offers structured courses, alternate education, and tuition for students — plus paid mentoring roles for skilled people, and digital solutions built with schools.`

**Layout** — Sections in order: **Intro** (`bg-slate-50`, bottom border; breadcrumb + `SectionHeading as="h1"` + 2 buttons) → **Learning and mentorship** (`id="learning"`, `scroll-mt-24`, bg-slate-50; SectionHeading + 3-col grid `lg:grid-cols-3`, 1-col mobile) → **School technology** (`id="services"`, white; 2-col split `lg:grid-cols-[1fr_1fr]`) → **In schools / Programs** (`id="in-schools"`, bg-slate-50; SectionHeading + 2-col grid `sm:grid-cols-2`, 1-col mobile) → **How it works** (`id="process"`, bg-slate-50; SectionHeading + 4-step ordered list `sm:grid-cols-2 lg:grid-cols-4`, 1-col mobile). Anchor targets are `scroll-mt-24`. No sticky elements.

**Content (top to bottom)**

1. **Intro**
   - Breadcrumb: `Home` → `/` · `Services & Programs`
   - Eyebrow: `Services & Programs`
   - H1: `Education, tuition, employment, and technology`
   - Lead: `EduAltTech runs structured courses, alternate education, and tuition for students; employs skilled people as paid mentors; and builds digital solutions with schools. Find the fit for you below.`
   - CTA: `School technology` → `#services`
   - CTA: `Talk to us` → `/contact`

2. **Learning and mentorship** (`#learning`)
   - Eyebrow: `Learning and mentorship`
   - Title: `Education for students, paid work for mentors`
   - Lead: `Learning and teaching are deliberately distinct. Joining as a learner never grants teaching access — and mentoring is a paid role, not a favour.`
   - Card 1 (School icon) — H3: `Education & alternate education`
     - Body: `Browse the catalogue, open a course, and enrol — free or paid. Learners work through the course roadmap at their own pace, with alternate routes where the standard syllabus does not fit.`
     - CTA: `Explore courses` → `/courses`
   - Card 2 (AutoStories icon) — H3: `Tuition facilities`
     - Body: `Guided tuition and coaching that runs alongside our courses — subject support, doubt sessions, and hands-on practice, in person and online.`
     - CTA: `Enquire about tuition` → `/contact`
   - Card 3 (Groups icon) — H3: `Employment for skilled people`
     - Body: `Skilled but out of work? Apply to mentor a specific course. Accepted applicants are employed to teach it — access is granted per course after review, never as a global account role.` (the words `specific course` are bolded inline)
     - CTA: `Apply to mentor` → `/mentor`

3. **School technology** (`#services`)
   - Eyebrow: `Technology for schools`
   - Title: `Digital solutions for schools`
   - Lead: `We design and build practical software that supports how a school actually operates — starting from a concrete problem, not a generic product.`
   - Paragraphs:
     - `Our school work covers areas such as learning platforms and school-specific applications that reduce administrative load. Each engagement begins with understanding the school's situation before any technology is chosen.`
     - `We share details of delivered work only when the record supports it — no promises of integrations, timelines, or support commitments beyond what has been agreed.`
   - CTA: `Discuss a requirement` → `/contact`

4. **Programs / In schools** (`#in-schools`)
   - Eyebrow: `In schools`
   - Title: `Programs`
   - Lead: `Alongside our course catalogue, we go into schools and run hands-on programs with students — on real subjects, with real outcomes.`
   - Programs (2-col grid; image top, then name/focus/body; images via `ProgramReveal` — logo shown, photo revealed on hover/tap):
     1. `New Era`
        - Logo: `/media/logos/new_era.jpg` (alt: "New Era", fallback "New Era")
        - Photo: `/media/programs/new-era-program.jpeg` (alt: "New Era program")
        - Focus (uppercase): `AI classes & game development`
        - Body: `We run hands-on AI classes and game development sessions with students at New Era — practical, project-based learning from the classroom.`
        - Toggle label: `Show photos from our New Era program` / `Hide photos from our New Era program`
     2. `Sharada Vidhyalaya`
        - Logo: `/media/logos/sharada_vidhyalaya.jpeg` (alt: "Sharada Vidhyalaya", fallback "Sharada Vidhyalaya")
        - Photo: `/media/programs/sharada-vidhyalaya-program.jpeg` (alt: "Sharada Vidhyalaya program")
        - Focus (uppercase): `Idea & product development`
        - Body: `At Sharada Vidhyalaya we guide students through idea and product development — turning a problem in their world into something they build and test.`
        - Toggle label: `Show photos from our Sharada Vidhyalaya program` / `Hide photos from our Sharada Vidhyalaya program`

5. **How it works / Process** (`#process`)
   - Eyebrow: `How it works`
   - Title: `A simple, honest process`
   - Lead: `No step here automatically creates a project, enrols a learner, or guarantees acceptance.`
   - Steps (ordered list, `01`–`04`):
     1. `01` — `Explore` — `Find the program or service that matches what you need.`
     2. `02` — `Review` — `Read the published information before committing to anything.`
     3. `03` — `Contact` — `Get in touch with your requirement or question.`
     4. `04` — `Proceed` — `Follow the process that fits — enrolment, application, or a conversation.`

---

### Our Work — `/work`
- **Source**: `frontend/src/app/work/page.tsx`
- **Title tag**: `Our Work`
- **Meta description**: `Applications, educational technology, and digital solutions built by EduAltTech for schools and organizations.`

**Layout** — Sections in order: **Intro** (`bg-slate-50`, bottom border; breadcrumb + `SectionHeading as="h1"`) → **Platforms we have built** (`white`; H2 + 3-col grid `sm:grid-cols-2 lg:grid-cols-3`, 1-col mobile; each tile is an external-link card with `h-52` logo panel + name/`Visit site` row) → **Work browser** (rendered only when `/cms/public/work?limit=50` returns items; `border-t`, bg-slate-50; client-side `WorkBrowser` with category filter chips + 3-col result grid) → **Conversion CTA** (bg-slate-50, centered, 2 buttons). No sticky elements.

**Content (top to bottom)**

1. **Intro**
   - Breadcrumb: `Home` → `/` · `Our Work`
   - Eyebrow: `Our Work`
   - H1: `Applications and digital solutions we have built`
   - Lead: `Practical software made for educational and organizational needs — the same problem-solving our courses teach. We present work here only when it is verified and cleared for public view.`

2. **Platforms we have built**
   - H2: `Platforms we have built`
   - Cards (each whole card links externally, opens in new tab; label `Visit site`):
     1. `Genesis` — image `/media/Products/Genesis.png` (alt: "Genesis website") → `https://www.genesisedu.in`
     2. `Joy School` — image `/media/Products/joy%20school.png` (alt: "Joy School website") → `https://www.joyschool.online/`
     3. `MamaSparsh` — image `/media/Products/mamasparsh.png` (alt: "MamaSparsh website") → `https://www.mamasparshschool.in/`

3. **Work browser** (only when work items exist; from `frontend/src/components/work/WorkBrowser.tsx`)
   - Category filter chips (`All` + sorted categories), shown only when more than one category; default active `All`.
   - Live count text: `{n} project` / `{n} projects` (e.g. `3 projects`).
   - Result grid: `sm:grid-cols-2 lg:grid-cols-3`, 1-col mobile; each `WorkCard` shows 16:10 cover (or category text fallback), organization name, title, summary.
   - Empty-in-filter state: `No projects in this category.` + button `Show all projects`.

4. **Conversion CTA**
   - H2: `Need something similar for your school?`
   - Body: `Tell us the problem you are trying to solve and we will start from there.`
   - CTA: `Services & Programs` → `/services`
   - CTA: `Contact us` → `/services#enquiry`

---

### Team — `/team`
- **Source**: `frontend/src/app/team/page.tsx`
- **Title tag**: `Team`
- **Meta description**: `The people behind EduAltTech's educational and technology work.`

**Layout** — Sections in order: **Intro** (`bg-slate-50`, bottom border; breadcrumb + `SectionHeading as="h1"`) → **Roster** (`white`; single `ul` grid `sm:grid-cols-2 lg:grid-cols-3`, 1-col mobile; each row is horizontal: 20×20 rounded-square portrait + name/title block) → **CTA** (`bg-slate-50`, centered, 3 buttons). No sticky elements.

**Content (top to bottom)**

1. **Intro**
   - Breadcrumb: `Home` → `/` · `Team`
   - Eyebrow: `Our team`
   - H1: `The people behind EduAltTech`
   - Lead: `The educators, builders, and mentors who make our courses and school technology work.`

2. **Roster** (13 members; square 80×80 portraits with initials fallback; name as h2, title in brand-700)
   | Name | Title | Image (alt: "Portrait of {name}") |
   |------|-------|-----------------------------------|
   | Uma | Founder | `/media/newTeam/uma.jpeg` |
   | Srinivas | Project Coordinator | `/media/newTeam/srinivas.jpeg` |
   | Varun | Full Stack Developer | `/media/newTeam/Varun_PP.png` |
   | Satish | Full Stack Developer | `/media/newTeam/satyanarayana.jpeg` |
   | Harshitha | Frontend Developer | `/media/newTeam/harsitha.jpeg` |
   | Avinash | Marketing and Graphic Designer | `/media/newTeam/avinas.jpeg` |
   | Srujan | Client Relations | `/media/newTeam/srujan.jpeg` |
   | Ranadeep | Full Stack Developer, Client Relations | `/media/newTeam/Ranaadeep.jpeg` |
   | Hemanth | Full Stack Developer | `/media/newTeam/Hemanth.jpeg` |
   | Chandhini | Project Coordinator, AI Development | `/media/newTeam/alrihab.jpg` |
   | Priya | Graphic Designer | `/media/newTeam/Priya.jpeg` |
   | Gani | Digital Marketing | `/media/newTeam/gani.jpeg` |
   | Gnana | Frontend Developer | `/media/newTeam/Gnana.jpeg` |

3. **CTA**
   - H2: `Want to work with us?`
   - Body: `Explore our courses, see the technology we build, or get in touch.`
   - CTA: `Explore courses` → `/courses`
   - CTA: `Our work` → `/work`
   - CTA: `Contact` → `/contact`

---

### Partners & Organizations — `/partners`
- **Source**: `frontend/src/app/partners/page.tsx`
- **Title tag**: `Partners & Organizations`
- **Meta description**: `Schools and organizations EduAltTech works with to support practical education and technology.`

**Layout** — Sections in order: **Intro** (`bg-slate-50`, bottom border; breadcrumb + `SectionHeading as="h1"`) → **PartnerStrip** (`divider={false} showAll={false}`; bg-slate-50 static 4-col logo grid `grid-cols-2 sm:grid-cols-4`, each logo with name beneath) → **Organizations list** (`white`; grouped by `type` with type label h2 + 3-col card grid `sm:grid-cols-2 lg:grid-cols-3`, 1-col mobile; each card: 16×16 logo + name/summary/website link) → **CTA** (`bg-slate-50`, centered; rendered only when items exist). No sticky elements.

**Content (top to bottom)**

1. **Intro**
   - Breadcrumb: `Home` → `/` · `Partners & Organizations`
   - Eyebrow: `Partners & Organizations`
   - H1: `Working together for practical education`
   - Lead: `Supporting practical learning and technology for schools takes collaboration. We list organizations we work with here, with the type of relationship they have with EduAltTech.`

2. **PartnerStrip** (static grid; caption `Schools & organizations we work with`)
   - `/media/logos/genesis.png` (alt: "Genesis") — name `Genesis`
   - `/media/logos/mamasparsh.png` (alt: "MamaSparsh") — name `MamaSparsh`
   - `/media/logos/new_era.jpg` (alt: "New Era") — name `New Era`
   - `/media/logos/sharada_vidhyalaya.jpeg` (alt: "Sharada Vidhyalaya") — name `Sharada Vidhyalaya`
   - (no "See all partners" link on this page)

3. **Organizations list** (data-driven from `/cms/public/organizations`; grouped by type)
   - Type labels: `SCHOOL` → `School partners`; `PARTNER` → `Partners`; `FRANCHISE` → `Franchises`; `NGO` → `NGOs & community`; `OTHER`/unknown → `Organizations`
   - Each card: logo (fallback = first 2 chars of name, uppercase, object-contain) + org name + optional summary + optional `Visit website` link (opens new tab, screen-reader text " (opens in a new tab)").
   - Empty state (items.length === 0):
     - H2: `Partners are being listed`
     - Body: `We publish organizations only once a relationship is confirmed and cleared for public view. If you would like to explore working with EduAltTech, please get in touch.`
     - CTA: `Contact us` → `/contact`
     - CTA: `Services & Programs` → `/services`
   - Error state (fetch failed, `DataUnavailable label="our partners"`):
     - H2: `We couldn't load our partners right now`
     - Body: `Something went wrong on our side — this isn't an empty page. Please try again shortly, or reach out and we'll help directly.`
     - CTA: `Contact us` → `/contact`

4. **CTA** (only when items exist)
   - H2: `Interested in partnering with us?`
   - Body: `Tell us about your school or organization and the problem you would like to work on.`
   - CTA: `Get in touch` → `/contact`

---

### Become a Mentor — `/mentor`
- **Source**: `frontend/src/app/mentor/page.tsx`
- **Title tag**: `Become a Mentor`
- **Meta description**: `Turn your skills into paid teaching. Learn what mentors do, how applications are reviewed, and how to apply.`

**Layout** — Single centered column (`mx-auto w-full max-w-4xl px-4 py-14`), white background. Order: intro block (eyebrow + h1 + lead + 2 buttons) → `What mentors do` (bullet list) → `How the process works` (2-col ordered grid `sm:grid-cols-2`, 1-col mobile; each step a top-bordered block) → `What to prepare` (bullet list) → bordered card `Applying and tracking status` (2 buttons) → closing disclaimer line. No hero image, no sticky elements.

**Content (top to bottom)**

1. **Intro**
   - Eyebrow: `Teach and earn with EduAltTech`
   - H1: `Turn your skills into paid teaching`
   - Lead: `If you have real skill but no steady work, teaching here is a paid role — not volunteering. Mentors author lessons and run live sessions for the courses they are assigned. Apply for a specific course and our team will review your application.`
   - CTA: `Start an application` → `/dashboard/mentor/apply`
   - CTA: `Browse courses` → `/courses`

2. **What mentors do**
   - H2: `What mentors do`
   - Bullets:
     - `Author and maintain lessons for your assigned course.`
     - `Record or schedule live sessions for enrolled learners.`
     - `Keep course material accurate and up to date.`
     - `Respond to your learners within the platform.`

3. **How the process works**
   - H2: `How the process works`
   - Steps (each labelled `Step {n}`):
     1. `Step 1` — `Apply` — `Submit the application form with your qualification and a resume.`
     2. `Step 2` — `Review` — `Our team reviews your application and may schedule an interview.`
     3. `Step 3` — `Decision` — `You're accepted or not accepted for the course you applied to.`
     4. `Step 4` — `Teaching` — `Accepted mentors are assigned to the course and get a teaching workspace.`

4. **What to prepare**
   - H2: `What to prepare`
   - Bullets:
     - `Choose the course you want to teach.`
     - `Write a qualification summary describing your relevant expertise.`
     - `Have a resume ready (PDF, DOC, DOCX, or TXT — up to 5 MB).`

5. **Applying and tracking status** (bordered card)
   - H2: `Applying and tracking status`
   - Body: `Applying requires an account. After you sign in, you can submit an application and track its real status at any time from your mentor dashboard.`
   - CTA: `Apply to mentor` → `/dashboard/mentor/apply`
   - CTA: `View my applications` → `/dashboard/mentor`

6. **Disclaimer line**
   - `Submitting an application does not grant teaching access. Mentor access begins only after your application is accepted and you are assigned to a course.`

---

### Shared components reference

**`SectionHeading`** (`frontend/src/components/landing/SectionHeading.tsx`) — renders an optional eyebrow (`text-sm font-semibold uppercase tracking-wide text-brand-700`), a title (default `h2`, overridable `as="h1"|"h3"`; `font-display text-3xl font-bold … sm:text-4xl`), and optional lead (`mt-4 text-lg … text-ink-600`). Max width `max-w-2xl`.

**`CourseCard`** (`frontend/src/components/landing/CourseCard.tsx`) — whole-card link to `/courses/{slug}` (or `href`). 16:9 cover (thumbnail or category/title fallback), optional top-right badge, title (2-line clamp), category/domain chip, 2-line description, optional mentor line `Mentor · {mentor}`, either a progress bar (label `Progress` + `{pct}%`) or up to 4 feature bullets with check icons, and a footer with price + eye icon button (label `View course`) or an `Unavailable` chip. Empty-data path: `Unavailable`.

**`WorkCard`** (`frontend/src/components/landing/WorkCard.tsx`) — 16:10 cover (or category text fallback), optional organization name (uppercase brand), title, summary. No link wrapper.

**`DataUnavailable`** (`frontend/src/components/landing/DataUnavailable.tsx`) — amber dashed error card: `We couldn't load {label} right now` + body `Something went wrong on our side — this isn't an empty page. Please try again shortly, or reach out and we'll help directly.` + `Contact us` → `/contact`.

**`ProgramReveal`** (`frontend/src/components/landing/ProgramReveal.tsx`) — toggle button over a program logo/photo pair; shows logo by default, reveals photo on hover/tap; accessible labels `Show photos from our {name} program` / `Hide photos from our {name} program`.

**`PartnerStrip`** (`frontend/src/components/landing/PartnerStrip.tsx`) — two modes: `scroll` marquee (home) or static grid with names (partners). Partners data: Genesis `/media/logos/genesis.png`, MamaSparsh `/media/logos/mamasparsh.png`, New Era `/media/logos/new_era.jpg`, Sharada Vidhyalaya `/media/logos/sharada_vidhyalaya.jpeg`. Caption: `Schools & organizations we work with`. Optional link `See all partners & organizations` → `/partners`.

**`LinkButton` / `buttonClass`** (`frontend/src/components/ui/LinkButton.tsx`, `Button.tsx`) — variants `primary` (brand-600 bg), `secondary` (white, slate border), `ghost`, `danger`; sizes `sm|md|lg`.

**`CoverImage`** (`frontend/src/components/ui/CoverImage.tsx`) — image with branded fallback (`bg-brand-50`, brand-700 text) on missing `src` or load error; default object-cover.

**Team roster** (`frontend/src/lib/team.ts`) — single `TEAM` array of 13 `{ name, title, image }` entries used by both `/about` and `/team` (table above).

**Enquiry anchor note** — `/work` CTA `Contact us` links to `/services#enquiry`, but no element with `id="enquiry"` exists in `services/page.tsx` (its anchors are `learning`, `services`, `in-schools`, `process`). Broken anchor.

---

## Courses, contact & legal pages

### Courses — `/courses`
- **Source**: `frontend/src/app/courses/page.tsx`
- **Title tag**: `Courses`
- **Meta description**: `Browse published EduAltTech courses in AI, entrepreneurship, and technology — structured roadmaps with mentors, taught for practical outcomes.`
- **Canonical**: `/courses`

**Layout** — Full white page. Top: slate-50 banner (border-bottom) containing breadcrumb, H1, and lead paragraph. Below: max-w-7xl content area wrapping the `CourseBrowser` (filters + results grid). The Suspense fallback is a 3-column skeleton grid.

**Content (top to bottom)**
1. **Breadcrumb** — `Home` > `Courses` (current page). `Home` → `/`
2. **H1 `Explore our courses`** — lead: `Practical, roadmap-structured programs in AI, entrepreneurship, and applied technology. Every course is built around doing — with mentors on hand to guide you through it.`
3. **CourseBrowser** (see section below)

---

### CourseBrowser — `frontend/src/components/courses/CourseBrowser.tsx`
- **Source**: `frontend/src/components/courses/CourseBrowser.tsx`
- **Props**: `basePath` (default `/courses`)

**Filters / search controls**
- **Search courses** — label `Search courses`, input `type="search"`, placeholder `Search by title or description`, with leading search icon and a clear (`×`) button (aria-label `Clear search`) when text present. Debounced 350ms → URL `?q=`.
- **Type** — label `Type`, `<select>` (icon: School). Options:
  - `All types` (value `""`)
  - `Education` (value `EDUCATION`)
  - `Alternative education` (value `ALTERNATIVE_EDUCATION`)
- **Category** — label `Category`, `<select>` (icon: Category). Rendered only when `categories.length > 0`. Options: `All categories` (value `""`) + one option per dynamic category value.
- **Sort by** — label `Sort by`, `<select>` (icon: Sort). Options:
  - `Newest` (value `newest`, default)
  - `Price: low to high` (value `price_asc`)
  - `Price: high to low` (value `price_desc`)

**Result count / live region**
- While loading: `Loading courses…`
- Otherwise: `{total} course` / `{total} courses found` (singular/plural)
- `Reset filters` button shown when any filter active (`q`, `category`, `type`, sort ≠ newest, or page > 1) → resets to `basePath`

**Results grid**
- Column counts: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`
- Page size: `LIMIT = 12` courses per page.
- Loading state: **SkeletonGrid** — 6 pulsing placeholder cards (2 in sm, 3 in lg).
- Error state: `role="alert"` box — heading `Something went wrong`, body = error message (or `Could not load courses. Please try again.`), CTA button `Try again`.
- No results (filters active, total 0): heading `No courses match your search`, body `Try different keywords or remove the filters you have applied.`, CTA `Reset filters`.
- Empty (no filters, total 0): heading `Courses are being published`, body `Our catalogue is being prepared. Check back soon, or get in touch to hear about upcoming programs.`
- Populated: maps items to `CourseCard` (see below).

**Pagination** (shown when `totalPages > 1`)
- `nav aria-label="Pagination"`, centered.
- `Previous` button (ChevronLeft, disabled on page 1) → `replaceParams({ page: page-1 })`
- Text `Page {page} of {totalPages}`
- `Next` button (ChevronRight, disabled when `!hasMore`) → `replaceParams({ page: page+1 })`

---

### CourseCard — `frontend/src/components/landing/CourseCard.tsx`
- **Source**: `frontend/src/components/landing/CourseCard.tsx`

Each card (`<article>`):
- Whole card is one stretched link to `href ?? /courses/{slug}`; aria-label `View {title}`. View icon button aria-label `View course` (default `viewLabel`).
- **Image**: `CoverImage` `src={course.thumbnailUrl ?? null}`, `alt=""`, fallback = `category ?? title`, aspect `16/9`. Optional `badge` overlay top-right (dark pill).
- **Title** (`h3`, line-clamp-2) = `course.title`
- **Chip** (top-right) = `domain || category` (uppercase mono-style label with leading rule)
- **Description** (line-clamp-2) = `course.description` (if present)
- **Mentor** line = `Mentor · {mentor}` (only if `mentor` prop passed; courses browser does not pass it)
- **Feature list**: up to 4 `course.features` (checkmark icon + label) — shown when no `progressPct`
- **Progress bar** (only if `progressPct` passed): label `Progress` + `{pct}%`
- **Footer**: price (left) + actions/view control (right). Price = `priceLabel` or `formatPrice(pricePaise, currency)`; renders `Free` when price is 0.
- If `unavailable`: shows `Unavailable` pill instead of the view button, and no link.

---

### Course detail — `/courses/[slug]`
- **Source**: `frontend/src/app/courses/[slug]/page.tsx`
- **Title tag**: `{course.title}` (fallback `Course` when course not found)
- **Meta description**: first 160 chars of `course.description`
- **Canonical**: `/courses/{course.slug}`; OpenGraph title/desc/image = `course.title` / desc / `course.thumbnailUrl`; Twitter `summary_large_image`.
- Includes JSON-LD `schema.org/Course` (name, description, url, image, provider `EduAltTech`, inLanguage `en-IN`, offers with price/currency/category `Free`|`Paid`, availability InStock). `<script type="application/ld+json">`.

**Error state** (server unreachable) — centered card: `We couldn't load this course`, `There was a problem reaching the server. Please try again.`, CTAs `Try again` → `/courses/{slug}` and `Back to courses` → `/courses`.

**Layout** — White page. Breadcrumb row, then two-column grid on `lg` (`main content | 360px sticky rail`). Left column: hero banner, About, Features, Curriculum, Mentors. Right rail: `CourseActions` enrolment box, a limited-seats note, back/contact links.

**Content (top to bottom)**
1. **Breadcrumb** — `Home` > `Courses` > `{course.title}` (current). → `/`, `/courses`
2. **Hero banner** — min-height 240px dark panel. Background `CoverImage src={thumbnailUrl}` (alt `""`, fallback `""`) with gradient overlay. On-image:
   - Eyebrow line: `{typeLabel}` (mapped: `EDUCATION`→`Education`, `ALTERNATIVE_EDUCATION`→`Alternative Education`, else `Course`) + `{course.domain}` (if present)
   - H1 = `{course.title}`
   - Meta line (conditional): `{n} chapter(s)`, `{n} lessons`, `{course.level}`, `{course.enrolledCount} enrolled`
3. **About this course** (`h2`, id `about-heading`) — body = `course.roadmapSummary?.trim() || course.description` (whitespace-pre-line)
4. **What you'll get** (`h2`, id `features-heading`, only if `features.length > 0`) — 2-col grid of checkmark list items, one per `course.features[]`
5. **Curriculum** (`h2`, id `curriculum-heading`)
   - Sub-line: `{n} chapter(s)` + ` · {m} lessons`
   - If chapters exist: ordered list of `<details>` (first open). Each chapter summary: numbered badge (index+1), `{ch.title}`, `{n} lesson(s)`, ExpandMore caret. Each topic row: `{t.title}` + `{t._count.lessons} lesson(s)`. If a chapter has no topics: `Lessons are being added.`
   - If no chapters: `The curriculum for this course is being finalised.`
6. **Mentors** (`h2`, id `mentors-heading`)
   - If mentors exist: list; each card = avatar (`CoverImage src={user.avatarUrl}`, alt `""`, fallback = uppercase initials), `{firstName} {lastName}`, `{user.bio}` or fallback `Course mentor`. Right side: if capacity set — `{free}` big number, label `seats left`, progress bar; else `Open seats`.
   - If none: dashed panel with `TapLoader`, heading `Waiting for a mentor`, body `No mentor is assigned to this course yet. Check back soon — you can still apply to mentor below.`
7. **Enrolment rail** (sticky `lg:top-24`) — `CourseActions` (see below). Below it: note `Seats are limited. Learning content unlocks only after confirmed enrolment.` Then links: `← Back to all courses` → `/courses`, `Questions? Contact us` → `/contact`

**CourseActions — `frontend/src/components/courses/CourseActions.tsx`**
- Price displayed: `{formatPrice(pricePaise, currency)}` (`Free` when 0). Sub-label: `One-time payment` (paid) or `No payment required` (free).
- States/CTAs (in priority order):
  - Not ready: disabled button `Loading…`
  - Learner: `Continue learning` → `/dashboard/courses/{slug}`
  - Mentor: note `You mentor this course.` + `Open teaching workspace` → `/dashboard/mentor/courses/{slug}`
  - Active mentor application (status ≠ REJECTED): amber panel titled `Mentor application`, status label (`Interview scheduled` / `Accepted` / `under review` / `not accepted` / etc.). If interview scheduled: shows date, `FlipClock` (`Starts in`), and `Join interview` link (`{interviewUrl}`, new tab). Else: `Your application is under review. Enrolment opens here once it's cleared — we'll notify you.`
  - Not signed in: `Sign in to enrol` → `/login?next=%2Fcourses%2F{slug}` (Lock icon)
  - Paid (signed in): `Pay now` → `/checkout?course={slug}`
  - Free (signed in): `Enrol for free`
  - Apply to mentor (signed in, not learner/mentor, no active app): `Apply to mentor` or `Re-apply to mentor` (if REJECTED) → `/dashboard/mentor/apply?course={slug}`
  - Wishlist toggle: `Add to wishlist` / `In your wishlist` (heart icon); redirects to login if unauthenticated.
- Not-authed footer: `Already have an account?` + `Sign in` link.

---

### Contact — `/contact`
- **Source**: `frontend/src/app/contact/page.tsx`
- **Title tag**: `Contact`
- **Meta description**: `Get in touch with EduAltTech about courses, mentoring, school technology, or partnerships.`
- **Canonical**: `/contact`

**Layout** — White page. Slate-50 banner (breadcrumb + SectionHeading). Below: 2-col grid on `lg` (`0.8fr | 1.2fr`) — left = help list + email + privacy note, right = form card (white rounded border with shadow).

**Content (top to bottom)**
1. **Breadcrumb** — `Home` > `Contact` (current)
2. **Eyebrow `Contact`** / **H1 `Get in touch`** — lead: `Send us a message and we will respond by email. Whether you are a learner, a prospective mentor, or a school, tell us what you need.`
3. **H2 `What we can help with`** — bulleted list (brand dot markers):
   - `Courses and learning programs`
   - `Mentoring a specific course`
   - `Technology for your school or organization`
   - `Partnerships and collaborations`
4. **H2 `Email`** — link `info@edualttech.com` (Mail icon) → `mailto:info@edualttech.com`
5. **Privacy note** — `We use the information you submit only to respond to your enquiry. See our Privacy Policy.` (`Privacy Policy` → `/privacy`)
6. **InquiryForm** (see below)

**Form — `frontend/src/components/contact/InquiryForm.tsx`**

Fields:
- **Name** — input `text`, icon Person, `autoComplete="name"`, required. Validation: min 2 chars (`Please enter your name (at least 2 characters).`), max 120 (`Please keep your name under 120 characters.`)
- **Email** — input `type="email"`, icon Mail, `autoComplete="email"`, required. Validation regex → `Please enter a valid email address.`
- **Phone (optional)** — input `text`, icon Phone, `autoComplete="tel"`. Max 20 chars (`Phone number is too long.`)
- **Subject (optional)** — input `text`, icon Subject. Max 200 chars (`Subject is too long.`)
- **How can we help?** — `textarea` rows=5, required. Min 5 chars (`Please describe your inquiry (at least 5 characters).`), max 5000 (`Please keep your message under 5,000 characters.`)

- **Button**: `Send message` (loading/disabled while submitting). No placeholders on any field.
- Success view: heading `Message sent`, body `Thank you — we have received your inquiry and will get back to you by email.`, link button `Send another message`.
- Error message (rate-limited): `Too many messages sent. Please wait a moment and try again.`; otherwise the API error message or `Could not send your message. Please try again.`
- POSTs to `/contact` (unauthenticated).

---

### Help & FAQ — `/faq`
- **Source**: `frontend/src/app/faq/page.tsx`
- **Title tag**: `Help & FAQ`
- **Meta description**: `Answers to common questions about accounts, courses, payments, mentors, and policies.`
- **Canonical**: `/faq`

**Layout** — White page. Slate-50 banner (breadcrumb + SectionHeading). Below: max-w-4xl section with `FaqBrowser` (search + category chips + accordion), then a `Still need help?` CTA panel.

**Content (top to bottom)**
1. **Breadcrumb** — `Home` > `Help & FAQ` (current)
2. **Eyebrow `Help & FAQ`** / **H1 `Frequently asked questions`** — lead: `Quick answers about accounts, courses, payments, mentorship, and our policies.`
3. **FaqBrowser** (`frontend/src/components/help/FaqBrowser.tsx`)
   - Search input (label sr-only `Search frequently asked questions`), placeholder `Search questions`, matches against question text.
   - Category filter chips (shown when >1 category): `All` + each unique category; `aria-pressed` on active.
   - Count line: `{n} question` / `{n} questions`
   - Accordion `<details>` per item (question as summary, answer in body).
   - Empty: `No questions match your search.` + `Clear search` button.
4. **`Still need help?`** panel — body `Send us your question and we will get back to you by email.` CTAs: `Contact us` → `/contact`, `Browse courses` → `/courses`

**All questions & answers (verbatim)**

1. Category `Accounts & verification` — **Q: `How do I create an account?`**
   A: `Register with your email address. We send a one-time code to that email, and you enter it to confirm the address before finishing your account details.`

2. Category `Accounts & verification` — **Q: `Why am I asked to verify my email?`**
   A: `Verifying your email confirms the address belongs to you and keeps your account secure. Until it is verified, you cannot complete sign-in.`

3. Category `Courses & learning` — **Q: `Do I need an account to browse courses?`**
   A: `No. You can browse the course catalogue, view course details, and read about us without signing in. You will be asked to sign in when you want to enrol or save a course.`

4. Category `Enrolment & payments` — **Q: `Are all courses paid?`**
   A: `No. Some courses are free and you can join them directly. Paid courses require payment, and access is granted once the payment is verified and your enrolment succeeds.`

5. Category `Enrolment & payments` — **Q: `How do I enrol in a course?`**
   A: `Open a course and use the enrolment action. Free courses are joined immediately; paid courses take you to checkout. You can also save courses to your wishlist to return to them later.`

6. Category `Mentorship` — **Q: `How do I become a mentor?`**
   A: `Mentorship is per course. From a course you are interested in teaching, you can apply to mentor it. Applications are reviewed by our team, and teaching access is granted only after approval. You cannot be both a learner and a mentor in the same course.`

7. Category `Enrolment & payments` — **Q: `Can I get a refund?`**
   A: `Refunds are reviewed case by case. Requesting a refund does not automatically complete one — only an approved refund returns money. See our Refund & Cancellation Policy.` (`Refund & Cancellation Policy` → `/refund-policy`)

8. Category `Privacy & policies` — **Q: `How is my information used?`**
   A: `We use your information to run your account, courses, and mentorship features, and to respond to your enquiries. We do not sell your personal information. Read our Privacy Policy.` (`Privacy Policy` → `/privacy`)

9. Category `Contact` — **Q: `How do I reach you?`**
   A: `Use our contact page or email info@edualttech.com. We will respond by email.` (`contact page` → `/contact`; `info@edualttech.com` → `mailto:info@edualttech.com`)

---

### Privacy Policy — `/privacy`
- **Source**: `frontend/src/app/privacy/page.tsx` (rendered via `components/legal/LegalDocument.tsx`)
- **Title tag**: `Privacy Policy`
- **Meta description**: `How EduAltTech collects, uses, and protects personal information.`
- **Canonical**: `/privacy`
- **Intro**: `How we collect, use, and protect your personal information when you use EduAltTech.`
- **Draft banner**: `This is a working draft pending legal approval. An effective date will be added once the policy is finalised.`

**Layout** — LegalDocument: slate-50 header (H1, intro, amber draft note), then max-w-4xl body with an `On this page` nav (anchor list) and spaced sections.

**Content (section headings + first sentence / full text)**

1. **Scope of this policy** — `This policy describes how EduAltTech (operated under Setsuzoku) handles personal information when you use our website, courses, and related services.`
2. **Information we collect** — `We collect information you provide directly, including:` followed by bullets: `Account details such as your name and email address when you register.` / `Profile details you choose to add, such as your education level or institution.` / `Information you submit through our contact form.` / `Messages you send through course conversations.` Then: `When you enrol in or progress through a course, we store your participation and lesson-completion status so the course can function.`
3. **How we use information** — bullets: `To create and secure your account and verify your email.` / `To provide courses, resources, meetings, and mentorship features.` / `To respond to enquiries you send us.` / `To keep the platform safe and working as intended.`
4. **Payments** — `Paid course payments are processed by our third-party payment provider. We do not store full card details on our servers. We retain records of orders and their status to provide access and support.`
5. **Authentication and local storage** — `We use an authentication provider to manage sign-in sessions. A session is stored in your browser so you stay signed in; signing out clears it. We do not add advertising or third-party tracking cookies.`
6. **How information is shared** — `We do not sell your personal information. We share it only with service providers that help us run the platform (such as authentication, email delivery, and payment processing), and where required by law.`
7. **Data retention** — `We keep personal information for as long as your account is active or as needed to provide the services. You may ask us to delete your account and associated personal data, subject to any records we are required to keep.`
8. **Your choices and rights** — `You can update your profile information from your account. To request a copy of your data or its deletion, contact us at info@edualttech.com.` (`info@edualttech.com` → mailto)
9. **Security** — `We take reasonable measures to protect your information, including access controls on who may view accounts and orders. No system is perfectly secure, and we cannot guarantee absolute security.`
10. **Changes to this policy** — `We may update this policy from time to time. Material changes will be reflected on this page. Continued use of the service after an update means you accept the revised policy.`
11. **Contact** — `Questions about this policy? Use our contact page or email info@edualttech.com. See also our Terms of Service.` (`contact page` → `/contact`; `info@edualttech.com` → mailto; `Terms of Service` → `/terms`)

---

### Terms of Service — `/terms`
- **Source**: `frontend/src/app/terms/page.tsx` (rendered via `components/legal/LegalDocument.tsx`)
- **Title tag**: `Terms of Service`
- **Meta description**: `The terms that govern your use of EduAltTech.`
- **Canonical**: `/terms`
- **Intro**: `The terms that govern your use of EduAltTech, its courses, mentorship features, and materials.`
- **Draft banner**: `This is a working draft pending legal approval. An effective date will be added once the terms are finalised.`

**Layout** — Same LegalDocument layout as Privacy (slate-50 header + draft note, `On this page` nav, spaced sections).

**Content (section headings + first sentence / full text)**

1. **Acceptance of these terms** — `By creating an account or using EduAltTech, you agree to these terms. If you do not agree, please do not use the service.`
2. **Accounts** — `You are responsible for keeping your account credentials secure and for activity under your account. You must provide accurate information and verify your email address. Accounts have a platform role of either User or Administrator; administrators are appointed by EduAltTech.`
3. **Course participation and mentorship** — `Participation in a course is separate from your platform role. Your participation in a specific course is either as a Learner or as a Mentor, and you cannot hold both roles in the same course.` Then: `Applying to mentor a course does not grant teaching access. Mentor participation is reviewed and approved per course before any teaching access is provided.`
4. **Payments and course access** — `Some courses require payment. Access to a paid course is provided only after payment is verified and enrolment succeeds. Free courses can be joined directly. See our Refund & Cancellation Policy for payment-related questions.` (`Refund & Cancellation Policy` → `/refund-policy`)
5. **Acceptable use** — bullets: `Do not misuse, disrupt, or attempt to gain unauthorised access to the service.` / `Do not upload unlawful or harmful content or infringe others' rights.` / `Do not share course materials outside the intended learning context.`
6. **Content and intellectual property** — `Course content, materials, and the platform are owned by EduAltTech or its licensors and are provided for your personal learning. You may not redistribute them without permission.`
7. **Service availability** — `We aim to keep the service available but do not guarantee uninterrupted access. We may modify, suspend, or discontinue features.`
8. **Suspension and termination** — `We may suspend or terminate access if these terms are breached or to protect the service or other users. You may stop using the service at any time.`
9. **Changes to these terms** — `We may update these terms. Material changes will be reflected on this page, and continued use after an update means you accept the revised terms.`
10. **Contact** — `Questions about these terms? Visit our contact page. See also our Privacy Policy.` (`contact page` → `/contact`; `Privacy Policy` → `/privacy`)

---

### Refund & Cancellation Policy — `/refund-policy`
- **Source**: `frontend/src/app/refund-policy/page.tsx` (rendered via `components/legal/LegalDocument.tsx`)
- **Title tag**: `Refund & Cancellation Policy`
- **Meta description**: `How refund requests and cancellations work for paid EduAltTech courses.`
- **Canonical**: `/refund-policy`
- **Intro**: `How refund requests and cancellations are handled for paid EduAltTech courses.`
- **Draft banner**: `This is a working draft pending legal approval. Specific eligibility windows and processing times must be confirmed before publication.`

**Layout** — Same LegalDocument layout as Privacy/Terms.

**Content (section headings + first sentence / full text)**

1. **Overview** — `This policy explains how refunds and cancellations are handled for paid courses. Requesting a refund and receiving one are different: submitting a request does not by itself complete a refund. Only an approved refund, processed through our payment provider, results in money being returned.`
2. **Refund eligibility** — `Refund eligibility depends on the circumstances of your enrollment and whether you have accessed the course. Because our stated eligibility terms are not yet finalised, please contact us with your details and we will assess your request. We will not apply a blanket refund window until it is formally approved.`
3. **Cancellation** — `If you wish to cancel an enrollment, contact us with your order details. Cancellation does not automatically trigger a refund; it will be reviewed together with your request.`
4. **How to request a refund** — `Contact us through our contact page with your name, the course, and your order reference. Note that the platform does not currently provide an automated in-app refund button; requests are handled by our team.` (`contact page` → `/contact`)
5. **Processing** — `Once a refund is approved, processing time depends on your payment method and provider. We cannot commit to a specific number of days until this is confirmed. You will be informed of the outcome of your request.`
6. **Contact** — `Questions about a refund or cancellation? Reach us via the contact page or email info@edualttech.com. See also our Terms of Service.` (`contact page` → `/contact`; `info@edualttech.com` → mailto; `Terms of Service` → `/terms`)

---

### Notes on images
No static image files are referenced by these pages. All images are data-driven via the `CoverImage` component (`frontend/src/components/ui/CoverImage.tsx`), which renders a plain `<img src={...} alt="">` and falls back to a text tile on missing/error:
- Course cards: `course.thumbnailUrl`, alt `""`, fallback = `category ?? title`
- Course detail hero: `course.thumbnailUrl`, alt `""`, fallback `""`
- Mentor avatars: `user.avatarUrl`, alt `""`, fallback = uppercase initials

---

## Global navigation

### Global navigation (PublicHeader)

- **Source**: `frontend/src/components/layout/PublicHeader.tsx`
- **App type**: Client component (`"use client"`); uses `usePathname`, `useState`, `useEffect`, `hasSession()`.

**Logo** — `BrandLogo` with `withWordmark` (`wordmarkClassName="hidden text-base sm:inline"`).
- Image `src="/media/brand/logo.png"`, `alt="EduAltTech"`, intrinsic `width={432} height={436}`, rendered `h-8 w-auto`. Wordmark text: `EduAltTech`.
- Home link: `<Link href="/">` with `aria-label="Edu Alt Tech home"`.
- Header shell: `sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur`; inner row `mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8`.

**Primary nav links** (in order; `NAV` array, rendered desktop nav `ml-auto hidden ... lg:flex`, so **desktop-only**):
- `Courses` → `/courses`
- `Services & Programs` → `/services`
- `Our Work` → `/work`
- `About` → `/about`
- `Contact` → `/contact`

Active state: `aria-current="page"` when `pathname === href || pathname.startsWith(\`${href}/\`)`; active class `text-brand-700`, inactive `text-ink-600 hover:text-ink-900 hover:bg-slate-100`.

**Auth actions** — after a vertical divider (`span ... h-5 w-px bg-slate-200`), rendered in the desktop nav:
- When **signed out** (`signedIn === false`):
  - `Sign in` → `/login` (plain link, `text-ink-600 hover:text-ink-900`)
  - `Get started` → `/signup` (`LinkButton`, `size="sm"`)
- When **signed in** (`hasSession()` resolves true):
  - `Dashboard` → `/dashboard` (link, `text-brand-700 hover:bg-brand-50`)

**Mobile menu behavior**:
- Toggle button `lg:hidden` (`ml-auto inline-flex h-10 w-10 ...`), shows `Menu` icon when closed and `Close` icon when open. `aria-expanded={open}`, `aria-controls="mobile-nav"`, `aria-label` = `"Close menu"` when open else `"Open menu"`. State toggles via `setOpen((v) => !v)`.
- Panel: `<div id="mobile-nav" hidden={!open} className="border-t border-slate-200 bg-white lg:hidden">`. Visible only on `< lg`; uses the `hidden` attribute to show/hide.
- Contains a `<nav aria-label="Mobile">` with a `<ul>` of the same five `NAV` links (each closes the menu via `onClick={() => setOpen(false)}`; active gets `bg-brand-50 text-brand-700`).
- Below the list, a bordered footer block (`mt-3 flex flex-col gap-2 border-t ... pt-3`) with auth actions:
  - Signed out: `Get started` → `/signup` (`LinkButton`, `className="w-full"`) then `Sign in` → `/login` (full-width centered link).
  - Signed in: `Dashboard` → `/dashboard`.

### Global footer (PublicFooter)

- **Source**: `frontend/src/components/layout/PublicFooter.tsx`

**Logo** — `BrandLogo onDark` inside `<Link href="/" aria-label="EduAltTech home">` (no wordmark). Same image `/media/brand/logo.png`, `alt="EduAltTech"`.

**Blurb text** (verbatim):
> Courses, alternate education, and tuition for students — taught by skilled people we employ as paid mentors. Plus working software built for schools.

**Columns** (grid `md:grid-cols-[1.4fr_repeat(3,1fr)]`; each column heading is an `<h2>`):

| Column heading | Links (`label` → `href`) |
|---|---|
| **Learn** | `Courses` → `/courses`; `Services & Programs` → `/services` |
| **Company** | `About` → `/about`; `Our Work` → `/work`; `Partners` → `/partners`; `Team` → `/team`; `Contact` → `/contact` |
| **Account** | `Sign in` → `/login`; `Get started` → `/signup`; `Become a mentor` → `/mentor` |

**Bottom bar** — `mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between`:
- Copyright (verbatim, dynamic year): `© {new Date().getFullYear()} EduAltTech (Edu Alt Tech). A product by Setsuzoku.`
- Legal links (`<nav aria-label="Legal">`, in order):
  - `Help & FAQ` → `/faq`
  - `Privacy` → `/privacy`
  - `Terms` → `/terms`
  - `Refunds` → `/refund-policy`
  - `info@edualttech.com` → `mailto:info@edualttech.com`

Footer shell: `border-t border-slate-200 bg-ink-900 text-slate-300`; inner `mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8`.

### App shell (Chrome)

- **Source**: `frontend/src/components/layout/Chrome.tsx` (client component; reads `usePathname()` and `useAuth()`).

Verbatim route classification logic:

```
// Auth transitions render with no page chrome at all.
const AUTH_BARE = [
  "/login",
  "/signup",
  "/verify-email",
  "/complete-registration",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/reactivate",
  "/auth",
];

// Routes that are bare until signed in, then get the workspace shell.
const AUTH_FLOW = ["/checkout"];
```

Match helper: `const matches = (p) => pathname === p || pathname.startsWith(\`${p}/\`);`

Render decision order (first match wins):
1. **`/dashboard/*`** → `bare` = `<OfflineBanner /> + children`. Comment: `// Dashboard routes supply their own shell and auth redirects.`
2. **Any `AUTH_BARE` route** (login, signup, verify-email, complete-registration, forgot-password, reset-password, onboarding, reactivate, auth) → `bare`. So all auth pages render **no** PublicHeader/PublicFooter, only `<OfflineBanner>` + page.
3. **Signed-in user** (`useAuth().user` truthy), any other route → `<OfflineBanner /> + <DashboardShell>{children}</DashboardShell>`. Comment: `// Signed-in users see their own workspace nav on every page — never the marketing header/footer.`
4. **`AUTH_FLOW` route** (`/checkout`) for a signed-out user → `bare`.
5. **Default (signed out, marketing routes)** → `<OfflineBanner /> + <PublicHeader /> + children + <PublicFooter />`.

Summary: PublicHeader/PublicFooter render only for signed-out users on non-auth, non-dashboard, non-checkout routes. Every branch includes `<OfflineBanner />`.

### Shared auth layout (AuthShell)

- **Source**: `frontend/src/components/auth/AuthShell.tsx` — used by every auth page below.

**Layout**: centered single-column card. Outer `bg-slate-50`; container `mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16`.
- Brand link top-center: `<Link href="/" aria-label="EduAltTech home"><BrandLogo /></Link>` (image `/media/brand/logo.png`, `alt="EduAltTech"`, no wordmark).
- Card: `mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-elev1 sm:p-8`.
  - `<h1 className="font-display text-2xl font-bold text-ink-900">{title}</h1>` (page-specific `title`).
  - Optional `<p className="mt-2 text-sm leading-relaxed text-ink-600">{subtitle}</p>` (page-specific `subtitle`).
  - Children in `<div className="mt-6">`.
- Optional `footer` slot below card.
- Legal line (verbatim, centered, `text-xs text-slate-500`):
  > By continuing you agree to our [Terms of Service]( `/terms`) and [Privacy Policy]( `/privacy`).
  (`Terms of Service` → `/terms`; `Privacy Policy` → `/privacy`; both `font-medium text-brand-700 hover:underline`.)
- Back link (verbatim, `mt-3 text-center text-xs text-slate-500`): `← Back to edualttech.com` → `/` (rendered `&larr;`).

---

## Auth / entry pages

### Sign in — `/login`
- **Source**: `frontend/src/app/login/page.tsx` (+ `frontend/src/components/auth/AuthShell.tsx`, `frontend/src/components/auth/LoginForm.tsx`, `frontend/src/components/auth/OAuthButtons.tsx`, `frontend/src/components/auth/Field.tsx`)
- **Title tag**: `Sign in`
- **Meta description**: `Sign in to your EduAltTech account.`
- Canonical: `/login`; robots: `index: false, follow: true`

**Layout** — centered card via `AuthShell` (`bg-slate-50`, `max-w-md`). Card title `Welcome back`, subtitle `Sign in to continue to your EduAltTech account.` Optional success notice above the OAuth buttons when arriving with query flags:
- `?reset` → (verbatim) `Your password has been updated. Sign in with your new password.`
- `?expired` → (verbatim) `Your session ended. Sign in again to pick up where you left off.`
(Notice rendered in green status box: `role="status"`, `border-green-300 bg-green-50 text-green-800`.)

**Content (top to bottom)**
1. **Welcome back** — `Sign in to continue to your EduAltTech account.`
2. **OAuth** — `OAuthButtons`: two full-width secondary buttons `Continue with Google` (icon `Google`) and `Continue with Microsoft` (icon `Microsoft`). On failure: `Could not start sign-in with that provider. Please try again or use your email.` (`role="alert"`). Signed-in visitors are redirected to `safeNext(next, "/dashboard")`.
3. **Divider** — `or`
4. **Sign-in form** (render order: email, password + forgot link, submit):
   - Form fields:
     - `Email address` — `type="email"`, `name="email"`, `autoComplete="email"`, `inputMode="email"`, placeholder `you@example.com`, icon `MailOutlined`, value trimmed on submit.
     - `Password` — `PasswordField`, `name="password"`, `autoComplete="current-password"`, show/hide toggle (`aria-label` `Show password` / `Hide password`), icon `Lock`.
   - CTA: `Sign in` (submit `Button`, full width, `loading={pending}`).
   - Links: `Forgot password?` → `/forgot-password`.
5. **New-user prompt** — `New to EduAltTech?` + link `Create an account` → `/signup`.

**Client-side validation messages & error states (verbatim)**
- Email: `Enter a valid email address.` (regex `/^[^@\s]+@[^@\s]+\.[^@\s]+$/`, role `alert`).
- Password: `Enter your password.`
- API/network failure: shows `error.text` from `ApiError` message; non-`ApiError` fallback: `Something went wrong. Please try again.` Shown in `role="alert"` danger box.
- If API error `code === "EMAIL_NOT_VERIFIED"`, an extra line appears: link `Finish creating your account` → `/signup`.
- Deactivated account: on `!data.user.isActive`, redirect to `/reactivate?email=<email>&deactivated=1`.
- Security/role rule: after login, an `ADMIN`-less user routed to `/dashboard/admin*` is redirected to `/dashboard`.

### Create your account — `/signup`
- **Source**: `frontend/src/app/signup/page.tsx` (+ `AuthShell`, `frontend/src/components/auth/SignupForm.tsx`, `OAuthButtons`)
- **Title tag**: `Create your account`
- **Meta description**: `Create an EduAltTech account to enrol in courses and learn with mentors.`
- Canonical: `/signup`; robots: `index: false, follow: true`

**Layout** — centered card via `AuthShell`. Card title `Create your account`, subtitle `Create your account to start learning.`

**Content (top to bottom)**
1. **Create your account** — `Create your account to start learning.`
2. **OAuth** — `OAuthButtons` (same two providers; on failure: `Could not start sign-in with that provider. Please try again or use your email.`)
3. **Divider** — `or`
4. **Signup form**:
   - Form fields:
     - `Email address` — `type="email"`, `name="email"`, `autoComplete="email"`, `inputMode="email"`, placeholder `you@example.com`, icon `MailOutlined`.
   - CTA: `Continue` (submit `Button`, full width, `loading={pending}`). Sends `POST /auth/send-email-code`, stores email/next/devCode into the signup flow (`setSignupEmail`), then routes to `/verify-email`.
5. **Existing-user prompt** — `Already have an account?` + link `Sign in` → `/login`.

**Client-side validation messages & error states (verbatim)**
- Email: `Enter a valid email address.`
- API/network failure: shows `ApiError.message`; fallback `We could not start registration right now. Please try again.`
- If error `code === "RATE_LIMITED"`, extra line: `Please wait a moment before trying again.`
- Signed-in visitors are redirected to `safeNext(next)`.

### Reset your password — `/forgot-password`
- **Source**: `frontend/src/app/forgot-password/page.tsx` (+ `AuthShell`, `frontend/src/components/auth/ForgotPasswordForm.tsx`)
- **Title tag**: `Forgot password`
- **Meta description**: `Request a link to reset your EduAltTech password.`
- Canonical: `/forgot-password`; robots: `index: false, follow: false`

**Layout** — centered card via `AuthShell`. Card title `Reset your password`, subtitle `We will email you a secure link to set a new password.`

**Content (top to bottom)** — initial state:
1. **Reset your password** — `We will email you a secure link to set a new password.`
2. **Intro** (verbatim) — `Enter the email address for your account and we will send you a link to reset your password.`
3. **Form**:
   - Form fields: `Email address` — `type="email"`, `name="email"`, `autoComplete="email"`, `inputMode="email"`, placeholder `you@example.com`, icon `MailOutlined`.
   - CTA: `Send reset link` (submit `Button`, full width, `loading={pending}`).
4. **Prompt** — `Remembered it?` + link `Back to sign in` → `/login`.

**Sent state (replaces form after success)**
1. Status (verbatim): `If an account exists for <email>, we have sent a password reset link. Please check your inbox and spam or junk folder.` (`role="status"`, green box; `<email>` is the entered address, bolded.)
2. Note (verbatim): `The link can only be used once and expires shortly. If it does not arrive, you can request another.`
3. Actions:
   - Button: `Send again` (`variant="secondary"`, returns to form).
   - Link: `Back to sign in` → `/login`.

**Client-side validation messages & error states (verbatim)**
- Email: `Enter a valid email address.`
- Error `code === "RATE_LIMITED"`: `Too many requests. Please wait a moment and try again.`
- Other errors: `Something went wrong. Please try again.`

### Set a new password — `/reset-password`
- **Source**: `frontend/src/app/reset-password/page.tsx` (+ `AuthShell`, `frontend/src/components/auth/ResetPasswordForm.tsx`)
- **Title tag**: `Set a new password`
- **Meta description**: `Set a new password for your EduAltTech account.`
- Canonical: `/reset-password`; robots: `index: false, follow: false`

**Layout** — centered card via `AuthShell`. Card title `Set a new password`, subtitle `Choose a new password for your account.` Uses Supabase recovery/magic-link hash: shows a spinner while checking, then either the form or an invalid-link state.

**Content (top to bottom)** — checking state: `Spinner` label `Checking your reset link…`.

Invalid state (`state === "invalid"`):
1. Alert (verbatim, danger box): `This password reset link is invalid, expired, or has already been used.`
2. CTA: `Request a new link` (`LinkButton`, full width) → `/forgot-password`.
3. Link: `Back to sign in` → `/login`.

Ready state (form):
- Form fields:
  - `New password` — `PasswordField`, `name="password"`, `autoComplete="new-password"`, `showRequirements` (live checklist: `At least 8 characters` / `At least 8 characters (required)`).
  - `Confirm new password` — `PasswordField`, `name="confirm"`, `autoComplete="new-password"`.
- CTA: `Update password` (submit `Button`, full width, `loading={pending}`).

**Client-side validation messages & error states (verbatim)**
- Password length: `Use at least 8 characters.` (`PASSWORD_MIN_LENGTH = 8`).
- Mismatch: `Passwords do not match.`
- Supabase update failure: `We could not update your password. The link may have expired. Please request a new one.`
- Success flow: signs out other sessions (`signOut({ scope: "others" })`), clears session, redirects to `/login?reset=1`.

### Verify your email — `/verify-email`
- **Source**: `frontend/src/app/verify-email/page.tsx` (+ `AuthShell`, `frontend/src/components/auth/VerifyEmailForm.tsx`, `frontend/src/components/ui/VerifyCard.tsx`, `frontend/src/components/ui/PinInput.tsx`)
- **Title tag**: `Verify your email`
- **Meta description**: `Verify your email address to continue creating your EduAltTech account.`
- Canonical: `/verify-email`; robots: `index: false, follow: false`

**Layout** — centered card via `AuthShell`. Card title `Verify your email`, subtitle `We use a one-time code to confirm the email address belongs to you.` The form body is wrapped in `VerifyCard` (renders heading `Verify`, an SVG check image, children in `.verify-card__body`).

**No-email state** (`!email`):
1. (verbatim) `We do not have an email to verify. Start by creating your account.`
2. Link: `Go to sign up` → `/signup`.

**Content (top to bottom)** — main state:
1. **Verify your email** — `We use a one-time code to confirm the email address belongs to you.`
2. **VerifyCard heading** — `Verify`
3. Body intro (verbatim) — `Email verification is required. We sent a code to <masked email>. Enter it below to prove the address is yours.` (email masked as first char + `*`s, full address in `title` attr.)
4. If email not yet locked (`!emailLocked`):
   - Form field: `Email address` — `type="email"`, `name="email"`, `autoComplete="email"`, `inputMode="email"`, no placeholder, icon `MailOutlined`.
   - CTA: `Send verification code` (submit `Button`, full width, `loading={resending}`).
5. If email locked (`emailLocked`):
   - Development-mode note (when `devCode` present, verbatim): `Development mode: use code <code>.` (amber box; code in `font-mono font-bold`).
   - Label (verbatim): `6-digit code`
   - Form field: PIN input, lock length 6 (`PinInput length={6} autoFocus`).
   - CTA: `Verify email` (`variant="secondary"`, full width, `btn-neo`, `loading={pending}`).
   - Row: button `Resend code` (shows `Sending…` while resending; disabled while resending) and button `Change email` (unlocks email, clears dev code).
6. **Prompt** — `Already verified?` + link `Sign in` → `/login`.

**Client-side validation messages & error states (verbatim)**
- Request email invalid: `Enter a valid email address.`
- Code length wrong (not 6 digits): `Enter the 6-digit code from your email.`
- Send failure: `ApiError.message`; fallback `We could not send a code right now. Please try again.`
- Verify failure: `ApiError.message`; fallback `That code could not be verified. Request a new one and try again.`
- If error `code === "RATE_LIMITED"`, extra line: `Please wait a moment before trying again.`
- On success: stores verified code, routes to `/complete-registration`. Signed-in visitors redirect to `safeNext(next)`.

### Reactivate your account — `/reactivate`
- **Source**: `frontend/src/app/reactivate/page.tsx` (+ `AuthShell`, `frontend/src/components/auth/ReactivateForm.tsx`)
- **Title tag**: `Reactivate your account`
- **Meta description**: `Reactivate your EduAltTech account.`
- robots: `index: false, follow: false` (no canonical set)

**Layout** — centered card via `AuthShell`. Card title `Reactivate your account`, subtitle `Your account has been deactivated. Re-enter your password to restore access — your courses, messages, and progress are all kept.` Reads `?email=` query into the form.

**Content (top to bottom)**
1. **Reactivate your account** — `Your account has been deactivated. Re-enter your password to restore access — your courses, messages, and progress are all kept.`
2. **Info box** (verbatim, `border-brand-200 bg-brand-50 text-brand-900`) — `Your account was deactivated, but your data is safe. Reactivate with your email and password to pick up where you left off.`
3. **Form**:
   - Form fields:
     - `Email address` — `type="email"`, `name="email"`, `autoComplete="email"`, `inputMode="email"`, placeholder `you@example.com`, icon `MailOutlined` (pre-filled from query).
     - `Password` — `PasswordField`, `name="password"` (no autocomplete set).
   - CTA: `Reactivate my account` (submit `Button`, full width, `loading={pending}`).
4. **Prompt** — `Not ready to reactivate?` + link `Continue to the site` → `/`.

**Client-side validation messages & error states (verbatim)**
- Email invalid: `Enter a valid email address.`
- Password empty: `Enter your password.`
- API failure (verbatim): `ApiError.message`; fallback `Something went wrong. Please try again.` Shown in danger box.
- Success: sets session, toast `Your account has been reactivated.`, redirects to `/dashboard/settings`.

### Complete registration — `/complete-registration`
- **Source**: `frontend/src/app/complete-registration/page.tsx` (+ `AuthShell`, `frontend/src/components/auth/CompleteRegistrationForm.tsx`)
- **Title tag**: `Complete registration`
- **Meta description**: `Finish creating your EduAltTech account.`
- Canonical: `/complete-registration`; robots: `index: false, follow: false`

**Layout** — centered card via `AuthShell`. Card title `Complete registration`, subtitle `Add your name and password to finish setting up your account.` Requires the in-memory signup flow (`verified && email && code`); a refresh loses it.

**Expired-session state** (`!ready`):
1. Alert (verbatim, amber box): `Your verification session has expired. For your security you need to verify your email again before finishing registration.`
2. Link: `Verify your email again` → `/verify-email`.
3. Link: `Start over` → `/signup`.

**Content (top to bottom)** — ready state:
1. **Complete registration** — `Add your name and password to finish setting up your account.`
2. Single-line "Last step" note (verbatim) — `Last step — add your name and choose a password to finish creating your account for <flow.email>.` (email bolded.)
3. **Form** (name fields in a 2-col grid `sm:grid-cols-2`):
   - Form fields:
     - `First name` — `name="firstName"`, `autoComplete="given-name"`, icon `PersonOutlined`.
     - `Last name` — `name="lastName"`, `autoComplete="family-name"`, icon `PersonOutlined`.
     - `Password` — `PasswordField`, `name="password"`, `autoComplete="new-password"`, `showRequirements` (`At least 8 characters` checklist).
     - `Confirm password` — `PasswordField`, `name="confirm"`, `autoComplete="new-password"`.
   - CTA: `Sign up` (submit `Button`, full width, `loading={pending}`).

**Client-side validation messages & error states (verbatim)**
- First name: `Enter your first name.`
- Last name: `Enter your last name.`
- Password length: `Use at least 8 characters.`
- Mismatch: `Passwords do not match.`
- API failure: `ApiError.message`; fallback `We could not complete your registration. Please try again.`
- If `code === "EMAIL_TAKEN"`, extra line: `Sign in instead` → `/login`.
- If `code === "VALIDATION_ERROR"`, extra line: `Your code may have expired.` + `Verify again` → `/verify-email`.
- Success: sets session, clears signup flow, redirects to `safeNext(flow.next, "/dashboard")`.

### Signing in — `/auth/callback`
- **Source**: `frontend/src/app/auth/callback/page.tsx` (+ `AuthShell`, `frontend/src/components/auth/OAuthCallback.tsx`)
- **Title tag**: `Signing in`
- **Meta description**: *(none set)*
- robots: `index: false, follow: false` (no canonical set)

**Layout** — centered card via `AuthShell`, title `Finishing sign-in` (no subtitle). Body is a spinner while OAuth completes, or an error block.

**Loading state**: `Spinner` label `Completing sign-in…`.

**Error state**:
1. Alert (danger box) — shows either the provider's `error_description` (with `+` replaced by spaces) or the fallback texts:
   - provider error fallback: `Sign-in was cancelled or denied.`
   - completion failure: `We could not complete sign-in. Please try again.`
2. CTA: `Back to sign in` (`LinkButton`, full width) → `/login`.
3. Link: `Go to home` → `/`.

**Behavior notes**: handles `?code` (Supabase `exchangeCodeForSession`) and hash tokens; polls up to 8s for a session; strips credentials from the URL via `history.replaceState(..., "/auth/callback")`; calls `POST /auth/oauth/sync` to provision the Prisma row; deactivated users are signed out and sent to `/reactivate?email=<email>&deactivated=1`; otherwise redirects to `safeNext(next, "/dashboard")`.
