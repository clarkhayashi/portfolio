# Clark Hayashi — Portfolio

Personal portfolio site. Astro + Tailwind CSS v4, fully static, no CMS. Client-side JavaScript only on the /journey globe.

> **Session continuity:** stable rules live in `CLAUDE.md`; current state and next tasks live in `docs/CLARK_PORTFOLIO_HANDOVER.md`. Read those first in any new session.

## Quick start

```bash
npm install
npm run dev       # local dev at http://localhost:4321
npm run build     # production build into dist/
npm run preview   # preview the production build
```

## Deploy (GitHub → Vercel)

1. Create a GitHub repo and push this folder (`git init && git add -A && git commit -m "v1" && git push`).
2. In Vercel: **Add New Project → import the repo**. Vercel auto-detects Astro. No settings needed.
3. Add your custom domain in Vercel → then update `site` in `astro.config.mjs` **and** the Sitemap URL in `public/robots.txt` to match, and redeploy.

## How to edit

| I want to… | Edit this |
|---|---|
| Change the work list (titles, descriptions, order, statuses, lanes) | `src/data/projects.ts` |
| Change the "What I Bring" lanes (rename, reorder, add) | `src/data/lanes.ts` |
| Change the About-page experience snapshot | `src/data/experience.ts` |
| Edit the Journey page story/stops | `src/data/journey.ts` (spec: `docs/journey-brief.md`) |
| Edit a case study | `src/pages/work/<slug>.md` |
| Add a new project | Add an entry in `projects.ts` + copy an existing `.md` in `src/pages/work/` |
| Change homepage copy (hero, How I Work, contact) | `src/pages/index.astro` |
| Change the About page (intro, Rooted Perspective, building-now list) | `src/pages/about.astro` |
| Change colors/fonts | `src/styles/global.css` (`@theme` block) |
| Change nav/footer | `src/components/Header.astro` / `Footer.astro` |
| Change default meta title/description (SEO) | `src/layouts/Base.astro` |

Status label types: `progress` (teal dot), `building` (red dot), `private` (brown dot) — set per project in `projects.ts` and in each case study's frontmatter.

## TODO before launch (needs Clark)

- [x] `public/resume.pdf` installed 2026-07-10 (ClarkHayashiResume2026, fact-checked against site copy).
- [ ] Buy the domain, add it in Vercel, and update `site` in `astro.config.mjs` + `public/robots.txt` (currently a Vercel placeholder — canonical URLs, OG tags, and the sitemap depend on it).
- [ ] Fill the *Key Findings / Recommendations / Artifacts* sections in `tokyo-airbnb-pricing.md` and `intramural-participation.md` with real, public-safe results. Add chart/dashboard images to `public/images/`.
- [x] LinkedIn URL confirmed 2026-07-10 (`linkedin.com/in/clark-hayashi`). Still to do on LinkedIn itself: fix the old email (site uses hayashiclark@gmail.com everywhere).
- [ ] Confirm the Experience Snapshot details in `src/data/experience.ts` (GPA shown as 3.71; remove it if you'd rather lead with Magna Cum Laude only).
- [x] Dates confirmed: SUCUI "2024 to present" (now advising), UREC start Oct 2022, NCAA/Hui per old resume.
- [ ] Optional: GA4 — create a property and add the tag snippet to `src/layouts/Base.astro` (production only).

## Judgment calls (deviations from the brief)

1. **Editorial rows instead of cards.** Numbered stacked rows with status labels read more premium and less template-grid, and they handle mixed statuses (case study / building / private) more gracefully than cards of equal visual weight.
2. **The Bank of Hawaii page is a short "Private experience" summary, not a case study.** Public-safe paragraph only, confidentiality note, and a button to the LinkedIn post. It stays on-site (rather than the row linking straight to LinkedIn) because LinkedIn shows a login wall to logged-out visitors. The row renders slightly muted so the real case studies lead.
3. **Markdown pages instead of content collections.** `src/pages/work/*.md` with a shared layout does the same job with less machinery — easier for a beginner to maintain. Past ~10 projects, migrate to content collections.
4. **No `tailwind.config.mjs`.** Tailwind v4 is configured entirely in `src/styles/global.css` via `@theme`.
5. **Local Satoshi self-hosted** (Regular/Medium/Bold woff2 only; license kept at `public/fonts/satoshi/LICENSE-FFL.txt`). No Fontshare CDN call. Google Fonts only for Cormorant Garamond.
6. **"How I Work" uses the Analyze → Translate → Build framework** from the brief, with decision-first language folded into the step descriptions instead of a separate principles list.
7. **Portfolio Website is included as work item 05** — a non-clickable row under the Visual Communication lane. It earns its place as the only visible proof of that lane; no self-indulgent case study page.
8. **Headshot recropped.** Source photo was a 10 MB 7952×5304 landscape; shipped as a face-centered 1000×1000 JPEG (96 KB). Re-crop from the original if you prefer different framing.
9. **Case study statuses say "Case study · in progress" rather than "shell"** — visitors just need honesty about what's coming.
10. **Case study headings** use Overview / Problem / Context / My Role / Approach / Key Findings / Recommendations / Artifacts / Reflection / Status — the same proof structure as the brief's template (Role/Tools/Methods/…), merged into fewer, more natural sections. Tools live in the tags line under each title.
11. **No 404 page, blog, RSS in V1** — deliberate scope control. Sitemap + robots.txt are included (cheap wins).
12. **GPA included in the experience snapshot** (3.71 + Magna Cum Laude) — new-grad recruiters look for it; easy to delete in `experience.ts`.

## Inspiration references (kept for future iterations)

| Site | What was used |
|---|---|
| [onur.design](https://www.onur.design/) | Concise intro, contact links up top, compact project storytelling rhythm |
| [Perry W](https://perryw-2023.webflow.io/) | Primary structural reference: direct identity, resume/LinkedIn access, selected work first, restrained nav |
| [Spencer Gabor](https://spencergabor.work/) | Simple name/contact/work bones, credibility strip, direct contact footer |
| [Dave Holloway](https://www.awwwards.com/sites/dave-holloway) | Premium spacing, confidence, tasteful restraint (no heavy effects copied) |
| [Daniel Sun](https://danielsun.space/) | Big serif typography, section rhythm, numbered How-I-Work steps |
| [Mariah Purnell](https://mktgportfolio.com/mariah-purnell) | Editorial warmth, personality in copy, proof-of-work sections (no magazine clutter) |
| Data analyst portfolios (Gardian / Martinez / CareerFoundry) | Numbered projects, clear tools/methods, honest project storytelling — without tool walls or skill bars |

## Structure

```
src/
├── data/
│   ├── projects.ts         # single source of truth for the work list
│   ├── lanes.ts            # "What I Bring" lanes (home + about)
│   └── experience.ts       # About-page experience snapshot
├── layouts/Base.astro      # head/meta/OG, header, footer
├── layouts/CaseStudy.astro # shared case study page layout
├── components/             # Header, Footer, ButtonLink, StatusLabel,
│                           # ProjectRow, WorkList, LaneList, WaveDivider
└── pages/
    ├── index.astro         # home
    ├── journey.astro       # scroll-driven atlas globe (data: data/journey.ts)
    ├── about.astro
    └── work/
        ├── index.astro     # /work
        └── *.md            # case studies (frontmatter + markdown body)
```
