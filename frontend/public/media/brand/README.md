# Brand assets

Drop the logo here, expected filenames:

- `logo.svg` (preferred) or `logo.png` — full logo
- `logo-mark.svg` / `logo-mark.png` — square icon/favicon source
- `favicon.ico`

The header component auto-uses `/brand/logo.svg` with a graceful text
fallback if the file is not present yet. Brand colors live in
`frontend/src/app/globals.css` under `@theme` (`--color-brand-*`,
`--color-accent-*`) — swap them once the official palette is known.
