# Edu-Alt-Tech

Ed-tech platform: digital classrooms, practice zone, AI tutor, resource
library, teacher panel and full admin dashboard. Built with partner
schools — students learn on it, teachers teach on it, schools run on it.

https://www.edualttech.com · info@edualttech.com

## Structure

```
edu-alt-tech/
├── backend/    Express 5 + TypeScript + Prisma + Supabase Postgres
└── frontend/   Next.js 15 (App Router) + Tailwind CSS 4 + TypeScript
```

## Modules

- **Learners** — courses & digital classrooms (pick the mentor you learn from), practice zone, AI assistant, resources library, personal dashboard
- **Mentors** — anyone can apply to mentor a course; approved mentors get a workspace to publish chapters (meeting/recording/resource links) for the courses they mentor
- **Schools/Admins** — admin dashboard (users, courses & mentor assignment, mentor applications, messages, settings), Razorpay payments with tamper-proof order ledger + webhook verification

Two account roles only: `USER` and `ADMIN`. Learners and mentors are both
`USER`s — being a mentor simply means owning a course or holding a
`CourseMentor` row. New signups verify email, add a phone number, then
complete onboarding before reaching the dashboard.

## Setup

```bash
# 1. Install everything
npm install

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Point DATABASE_URL at your Supabase Postgres (connection pooler port 6543, pgbouncer=true)

# 4. Create schema + seed
npm run db:push
npm run db:seed

# 5. Run both apps
npm run dev
```

- Backend: http://localhost:5000 (health at `/health`)
- Frontend: http://localhost:3000

Email (verification links, phone OTP fallback, application updates) goes out
through Resend — set `RESEND_API_KEY` and `EMAIL_FROM`. With no key set, dev
returns the verification URL and OTP inline in the API response so the whole
signup flow is still testable.

File uploads (resource library, per-user quota) go to Supabase Storage — set
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and create a public bucket named
`resources`. See `.env.example` for per-file and per-user limits.

## Checks

```bash
npm run typecheck                      # backend + frontend types
npx tsx backend/scripts/flows-check.mts # end-to-end signup → verify → enroll → chapters flow (backend must be running)
```

## Next steps

Logo, brand colors, AI provider keys and Razorpay keys are pending —
drop the logo into `frontend/public/brand/`, fill the env values, and
the placeholders pick them up.
