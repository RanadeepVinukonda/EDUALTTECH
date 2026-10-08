# Media

Canonical asset folder. Frontend serves its own copy at `frontend/public/media/` (synced during scaffold).

## Structure

| Folder   | Contents |
|----------|----------|
| `brand/` | `logo.svg`, `logo.png` — EduAltTech logo |
| `team/`  | 10 team member photos — names in `team.json` |
| `logos/` | Partner school logos: genesis.png, mamasparsh.png, new_era.jpg, sharada_vidhyalaya.jpeg |
| `photos/`| `EAT2.jpg`, `EAT3.jpg`, `EAT4.jpg` event photos, `og-image.jpg` OG image |

## Mapping

- Team name → photo: [`team.json`](./team.json)
- Referenced image missing → UI falls back to initials avatar (see old TeamGrid pattern in archive tag `archive/pre-clean-slate`).
