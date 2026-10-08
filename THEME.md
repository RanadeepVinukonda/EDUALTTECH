# EduAltTech — Design Theme (source of truth)

Product: **EduAltTech**, a product by **Setsuzoku**.
Direction: sleek, modern, educational, premium, human, confident, clean.
NOT: generic AI SaaS, glassmlobs, blobs, excessive gradients/neon, endless cards.

## Identity

- Brand: EduAltTech. Company: Setsuzoku (footer, about, legal only — never overpower).
- Terminology: User, Course, Learner, Mentor, Mentor Application, Roadmap, Chapter, Topic, Lesson, Meeting, Resource, Order, Payment.
- Roles: platform `ADMIN | USER`; course participation `LEARNER | MENTOR` (never global).

## Colors (Tailwind v4 `@theme`)

```css
/* Green brand scale — primary #038C3E, hover #026B2F */
--color-brand-50:  #f0fff5;
--color-brand-100: #d7f5e1;
--color-brand-200: #b0e8c5;
--color-brand-300: #82d5a0;
--color-brand-400: #4fbc75;
--color-brand-500: #27a354;
--color-brand-600: #038c3e;  /* primary */
--color-brand-700: #026b2f;  /* hover */
--color-brand-800: #034f25;
--color-brand-900: #023a1c;
--color-brand-950: #012312;

/* Ink scale — headings/accent/footer #024059 */
--color-ink-100: #e3eef4;
--color-ink-200: #bcd5e3;
--color-ink-300: #8fb5cc;
--color-ink-400: #5c8da8;
--color-ink-500: #2f6a8b;
--color-ink-600: #124a72;
--color-ink-700: #024059;  /* headings/accent/footer bg */
--color-ink-800: #022d41;
--color-ink-900: #011c2b;
--color-ink-950: #010b11;

/* M3 tints */
--color-m3-100: #b7f0c1;
--color-m3-900: #00210e;
--color-m3-surface: #f1f6f1;
--color-m3-surface-alt: #ebf1ec;
--color-m3-outline: #748478;
```

Semantic aliases to add on rebuild:

```css
--color-success: #038c3e;
--color-danger:  #ef4444;
--color-warning: #f59e0b;
--color-surface: #ffffff;
--color-muted:   #f8fafc;
```

## Radius

```css
--radius-xs: 0.25rem;  /* 4px */
--radius-sm: 0.5rem;   /* 8px */
--radius-md: 0.75rem;  /* 12px */
--radius-lg: 1rem;     /* 16px */
--radius-xl: 1.75rem;  /* 28px — cards */
--radius-full: 9999px;
```

## Elevations (ink-tinted, never pure black)

```css
--shadow-elev1: 0 1px 2px rgba(2,64,89,.06), 0 1px 3px rgba(2,64,89,.10);
--shadow-elev2: 0 2px 6px rgba(2,64,89,.06), 0 4px 12px rgba(2,64,89,.08);
--shadow-elev3: 0 4px 8px rgba(2,64,89,.06), 0 8px 24px rgba(2,64,89,.10);
--shadow-soft:  0 4px 16px rgba(2,64,89,.08);
```

## Typography

| Role | Font | Use |
|---|---|---|
| Display | **Sora** (`--font-display`) | H1–H3, page headings, `font-display font-bold` |
| Body | **Inter** (`--font-sans`) | everything else |
| Mono | **JetBrains Mono** (`--font-mono`) | code, IDs |

Loaded via `next/font` in root layout. Body: `bg-slate-50 text-slate-800 antialiased`.

## Component recipes (from signup form — canonical)

- **Input**: `w-full rounded-xl border border-slate-300 px-4 py-3 text-[15px] bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 outline-none placeholder:text-slate-400`
- **Label**: `block text-[15px] font-medium text-slate-700 mb-1.5`
- **Primary button**: `px-5 py-3 text-[15px] font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 shadow-elev1`
- **Secondary button**: `px-5 py-3 text-[15px] font-semibold rounded-xl bg-white text-ink-700 border border-slate-300 hover:bg-slate-50`
- **Card**: `rounded-[20px] bg-white p-8 shadow-elev2`
- **Card heading**: `font-display text-2xl font-bold text-ink-700`
- **Status badge**: `rounded-full px-3 py-1 text-xs font-semibold` + tone map (success/danger/warning/neutral on brand/danger/warning/slate tints)
- **Page section heading**: `font-display text-3xl font-bold text-ink-700`
- **Footer bg**: `bg-ink-700`

## Icons

**@mui/icons-material** (moulded to theme colors via `color`/`sx`). No lucide, no hand-rolled SVGs on rebuild.

## Layout rules

- Mobile-first, breakpoints sm/md/lg/xl.
- Max content width `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- Focus ring visible everywhere; `prefers-reduced-motion` kills animations.
- Every component: loading, empty, error, populated states.
- Page feel: Coursera-class information hierarchy — obvious, not impressive.
