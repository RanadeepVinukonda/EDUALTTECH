# Design: EduAltTech

The shared interface system for the public site, learning workspace, mentor tools, and administration. Keep each area suited to its task while sharing one visual language.

## System
- Genre: modern-minimal
- Shape of the first page: course-led narrative workflow
- Theme: Coral, adapted to EduAltTech's green brand and local fonts
- Axes: warm green paper / geometric sans / brand green signal · posture: restrained
- Material: real course and classroom content, real API data, no invented metrics or testimonials

## Tokens
`frontend/src/app/tokens.css` is the source of truth.

```css
:root {
  --color-paper: oklch(98% 0.006 145);
  --color-paper-2: oklch(96% 0.008 145);
  --color-paper-3: oklch(92.5% 0.011 145);
  --color-ink: oklch(20% 0.018 175);
  --color-ink-2: oklch(34% 0.018 175);
  --color-muted: oklch(48% 0.018 165);
  --color-rule: oklch(87% 0.012 145);
  --color-accent: oklch(41% 0.13 150);
  --color-accent-ink: oklch(98% 0.006 145);
  --color-focus: oklch(37% 0.15 150);
  --font-display: var(--font-sora), ui-sans-serif, system-ui, sans-serif;
  --font-body: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-outlier: var(--font-jetbrains), ui-monospace, monospace;
  --radius-card: 12px;
  --radius-pill: 9999px;
  --rule-hair: 1px;
  --shadow-card: 0 1px 2px oklch(20% 0.01 155 / 0.04);
}
```

Spacing, type, motion, and layer scales are declared in `frontend/src/app/tokens.css`. Existing brand green and ink scales remain available to current components; primary controls use the darker accessible green.

## Controls
- Primary: deep brand green, light text, 12px radius, 44–52px marketing height.
- Secondary: paper surface with a visible rule, same radius and height.
- Workspace controls: compact, with 44px touch targets on small screens.

## Motion
- Character: calm. Motion communicates state; no autoplay. Reduced-motion preferences disable transitions and animations.
- Focus is visible immediately. Content remains visible without JavaScript.

## Page variants
- Home: Settled entry, course and learning discovery lead.
- Course and resource indexes: search/filter controls and real content lead.
- Reading and lesson pages: focused content measure with persistent, compact navigation.
- Learner workspace: task-first overview, course progress, and next action.
- Mentor workspace: course assignments and teaching tasks.
- Admin workspace: dense tables and management actions, not marketing cards.
- Authentication and checkout: focused forms with preserved validation and return paths.

## Exports
`frontend/src/app/tokens.css` is the source of truth. Tailwind utilities map to the same tokens.
