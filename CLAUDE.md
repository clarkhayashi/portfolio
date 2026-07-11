# CLAUDE.md · Clark Hayashi Portfolio — Project Constitution

Stable facts and settled rules. For current state and next tasks, read
`docs/CLARK_PORTFOLIO_HANDOVER.md` (the living continuity record). For the
full visual system, `DESIGN.md` is authoritative. This file never contains
"current status"; it contains what does not change between sessions.

## Purpose and positioning

A launch-ready personal portfolio for Clark Hayashi (hayashiclark@gmail.com),
Business Analytics & Marketing graduate, Seattle University, class of 2026,
from Hawai'i. Positioning: hybrid analyst/operator, never pigeonholed into a
single lane. Core line: "I turn messy data, ideas, and operations into clear
decisions." Audience: recruiters and hiring managers for analyst roles
(business, marketing, product/growth, operations, AI-workflow); secondary:
collaborators. The 5-second read must be: analyst, Magna Cum Laude, real AI
work at a named bank.

## Source-of-truth rules

- Content lives in `src/data/*.ts` (projects, lanes, experience, journey).
  Never hardcode content in layouts or components.
- The Astro app in `src/` is the canonical site. Files in `prototypes/` are
  standalone HTML experiments; keep them runnable but they never override src/.
- `DESIGN.md` (Google Stitch alpha format) is the visual constitution for the
  canonical site. Validate with `npx -y @google/design.md lint DESIGN.md`
  (must stay at 0 errors / 0 warnings).
- `public/images/PHOTO-NOTES.md` is the definitive image map.
- Factual corrections must propagate to ALL versions (Astro site, one-page
  prototype, journey prototype, experiment). A fact is never allowed to be
  right in one file and wrong in another.

## Verified chronology (settled, do not reorder)

1. Honolulu, 2004–2022 (Punahou 2018–2022; Eagle Scout; NEX 2020–2021)
2. Seattle, 2022 (Seattle University begins; UREC official from fall 2022)
3. Tokyo, Spring & Summer 2024 (Sophia University exchange)
4. Honolulu, Summer 2025 (Bank of Hawaii AI internship)
5. Sansepolcro/Tuscany, September 2025 (Albers Italy study tour)
6. Seattle, 2026 (graduation, Magna Cum Laude, GPA 3.71)

**The BOH internship (summer 2025) came BEFORE the Italy tour (September
2025).** This was wrong once and corrected; never imply otherwise.

## Settled facts (user-confirmed; do not re-derive)

- BOH: one of the bank's first AI interns; 50+ use cases, 19+ interviews,
  Power BI dashboard + scoring framework, readout to 60+. Details stay
  public-safe/summarized; work belongs to the bank.
- SUCUI: Co-founder & COO, 2024 to present (now advising). $20K Harriet
  Stephenson win + eBay Best Marketplace Idea Prize at UW Dempsey 2025
  (competed as Seattle Financial Initiative, 174-team field). Membership 23→54.
  Do NOT list "VP of Finance" or an "→ Advisor" role suffix.
- UREC: "Intramural Sports Official → Manager", 2022–2026. 40+ officials,
  64+ teams, 469+ participants, 7 years of data analyzed.
- Punahou: varsity basketball co-captain and Most Inspirational Player
  (**basketball, not golf**); JROTC Mayor's Award; Carnival class raised $337K.
- Hui o Nani: "audience of 300+" (not "300+ participants").
- Education line: "Dean's List and President's List" (never "multiple-time
  Dean's List"); do not attach "June 2026" to the degree.
- Applied Analytics SU: Fall 2023 Seattle Building Permit dashboard, team
  project, live on Tableau Public (Daniel Rios' profile).
- Tokyo Airbnb pricing analysis (25,000+ listings) is Clark's SOLO project;
  the archived MKTG 4550 group project (`archive/tokyo-airbnb-group-project/`)
  is separate reference material and is not published.

## Design principles (summary; DESIGN.md is authoritative)

- Palette: paper #F7F4EF, ink #1C1C1C, teal #5D8C88 (decorative), teal-deep
  #4F7773 (interactive, WCAG AA on paper), bark #6B5642, crimson #8A1538
  (micro-accent only).
- Canonical site type: Cormorant Garamond (headings) + self-hosted Satoshi.
- The experiment (`prototypes/portfolio-journey-experiment.html`) trials an
  alternative system by explicit user direction: Archivo (rare display),
  Fraunces (editorial headings), IBM Plex Sans (body/UI). If the experiment
  is adopted, that decision must be made explicitly, then DESIGN.md updated.
- Warm editorial minimalism: numbered rows not cards, hairlines, generous
  whitespace, flat depth. /journey (and the journey band in the experiment)
  holds the site's single "loud" license.
- Honest statuses always: teal dot = complete/progress, crimson = building,
  bark = private/summarized. Statuses never overstate.

## Writing standards and anti-slop constraints

- Voice: plain, specific, warm, zero hype. No invented metrics or results,
  ever. Real numbers only, sourced from Clark.
- **No em dashes anywhere in site copy.** Use commas, colons, periods, "·".
- Banned: "Welcome to my portfolio", "X taught me Y" triads, applause-line
  endings, skill bars, tool-logo walls, emoji, testimonial carousels, stock
  imagery, fake results, parallax, Lottie, custom cursors.
- One italic serif accent per page maximum (e.g. "messy" in the hero).

## Rejected directions (do not reintroduce)

- WebGL globe (user chose SVG/canvas atlas after seeing a comparison).
- ShaderGradient, liquid-glass-js, glassmorphism, gradients, neon/AI-demo looks.
- ui-ux-pro-max-skill and similar generic-slop skill packs.
- Continuing the old Google Sites page (superseded by this project).
- Scroll-hijacking interactions on the homepage (journey stepper uses zero
  scroll listeners; scrollytelling is licensed only on the dedicated /journey page).
- In the experiment's direction: decorative grain, fake hand-drawn
  irregularity, Cormorant/Satoshi/Inter/Space Grotesk.
- Em dashes in copy (also listed above; it recurs, so it bears repeating).

## Repository guidance

- Never delete files in this workspace (deletion permission was explicitly
  denied twice). Overwrite in place, or leave duplicates and document them in
  PHOTO-NOTES.md.
- `prototypes/*.html` use `../public/...` relative paths and must stay inside
  `prototypes/` next to the project's `public/` folder to render.
- Sandbox build recipe (shell filesystem differs from the mounted folder):
  copy `src public package.json astro.config.mjs` to /tmp/build, run
  `timeout 42 npm install --no-audit --no-fund` (may need two runs), then
  `timeout 42 npx astro build`.
- Tailwind v4 is configured entirely in `src/styles/global.css` via `@theme`;
  there is intentionally no tailwind.config.
- `archive/` and `drafts/` are source material, not part of the build.
