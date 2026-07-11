# Clark Hayashi Portfolio · Handover (living continuity record)

Last updated: 2026-07-10. Read `CLAUDE.md` (project constitution) first.
Detailed audits linked at the bottom. This file is the single source of truth
for current state; update it at the end of every working session.

# Current objective

Get the site launch-ready, and decide between two competing homepage
directions: the canonical Astro site (`src/`) versus the new
`prototypes/portfolio-journey-experiment.html` (journey-globe-as-homepage,
new type system). Clark has not yet chosen.

# Current implementation state

Verified directly against the codebase on 2026-07-10; `npx astro build`
passes, 8 pages built.

**Astro site (canonical, builds clean):**
- Pages: `/` (index.astro), `/about`, `/journey`, `/work` + 4 case-study
  markdown pages (ai-use-case-prioritization, intramural-participation,
  real-estate-lead-analytics, tokyo-airbnb-pricing).
- Components: Header, Footer, ButtonLink, StatusLabel, ProjectRow, WorkList,
  LaneList, WaveDivider, ExperienceRow.
- Data files: projects.ts (7 work items), lanes.ts (5 lanes), experience.ts
  (12 entries: 5 main + 7 background), journey.ts (6 stops, correct order).
- /journey: scroll-driven canvas atlas globe, zero libraries, world-atlas
  land-110m fetched at runtime from jsDelivr with silent fallback.

**Prototypes (standalone, double-clickable from `prototypes/`):**
- `portfolio-onepage.html` — full one-page mirror of the site content.
- `journey.html` — standalone journey page.
- `portfolio-journey-experiment.html` — NEW this session; see below.

**Content honesty status:** BOH = completed/summarized (private). Building
Permit = completed, live external Tableau link. Intramural + Tokyo Airbnb =
shells awaiting real Key Findings/Artifacts. Real Estate = currently
building, no results yet (correct). Journey page + Portfolio = live.

**Not yet published, discovered in repo:** `drafts/hawaii-value-stays.md`
(Hawai'i Airbnb vs hotels case study, ~36,000 listings, BUAN 4220; marked
"liked, approved for the site" in `archive/hawaii-airbnb-buan4220/README.md`)
is NOT yet wired into projects.ts or `src/pages/work/`. Publishing it is an
open task. `archive/tokyo-airbnb-group-project/` is reference-only, never
publish directly.

# Stable decisions

See `CLAUDE.md` for the full list. Highlights: chronology locked (BOH before
Italy); honest statuses; no invented metrics; no em dashes; content only via
`src/data/*.ts`; no WebGL; prototypes never override `src/`; never delete
files (permission denied twice; overwrite instead).

# Verified facts and chronology

Chronology verified in `src/data/journey.ts`, `prototypes/journey.html`, and
the experiment on 2026-07-10: Honolulu (2004–2022) → Seattle (2022) → Tokyo
(2024) → **Honolulu, BOH internship (Summer 2025)** → **Sansepolcro
(September 2025)** → Seattle (2026). All role names, dates, and metrics in
`src/data/experience.ts` match user-confirmed facts (see CLAUDE.md "Settled
facts"): basketball MIP not golf, "audience of 300+", no VP of Finance, no
"June 2026", "Dean's List and President's List".

# Recent session changes (2026-07-10 session)

1. **Chronology fix (canonical):** journey.ts had Italy before BOH; swapped
   stops 4/5 in journey.ts AND prototypes/journey.html; Sansepolcro year
   label now "September 2025"; BOH story ends "…before its last leg."
2. **Built `prototypes/portfolio-journey-experiment.html`** per Clark's
   product-ownership brief: journey globe as homepage spine (hero → journey
   stepper → work → lanes → experience → contact); hero drops the GA4/real
   estate sentence, 2 CTAs (See the work / Resume) with email+LinkedIn as
   quiet links; globe redesigned (sage ocean disc, stippled land computed
   from coastline data, dashed upcoming route + solid traveled route, crimson
   active stop); stepper interaction with no scroll hijack (buttons, chips,
   canvas click, ←/→ keys when focused, touch swipe, reduced-motion snaps,
   no-JS shows all chapters); type system Archivo/Fraunces/IBM Plex Sans
   (experiment only); work rows/experience/contact transplanted verbatim from
   portfolio-onepage.html so image structure, paths, and crossfades are preserved.
3. **Docs consolidation (this handover + CLAUDE.md created).**
4. `prototypes/README.md` rewritten (was stale and factually wrong about paths).
5. README.md corrected ("no client-side JavaScript" claim; docs pointers).

# Files created or modified (this session)

- Modified: `src/data/journey.ts`, `prototypes/journey.html` (chronology)
- Created: `prototypes/portfolio-journey-experiment.html`
- Created: `CLAUDE.md`, `docs/CLARK_PORTFOLIO_HANDOVER.md`
- Rewritten: `prototypes/README.md`; touched: `README.md`

# Tests and validation performed

- `npx astro build` in sandbox: passes, 8 pages (2026-07-10).
- Experiment: JS extracted and passed `node --check`; all 24 local asset
  references verified on disk (only `../public/resume.pdf` missing, a known
  launch blocker); all in-page anchors resolve; no duplicate ids.
- DESIGN.md previously linted clean with `npx -y @google/design.md lint`.
- NOT performed: rendering the experiment in a real browser (Claude-in-Chrome
  extension not connected). Globe visuals, stipple performance on mobile,
  and font rendering are code-reviewed but not eyeball-verified.

# Failed or rejected approaches

- Scrollytelling on the homepage: rejected (scroll hijack risk); stepper used
  instead. Scrollytelling remains fine on the dedicated /journey page.
- Filled land polygons on the orthographic canvas: rejected (spherical
  polygon clipping is error-prone without d3); stippled land dots chosen.
- WebGL globe, ShaderGradient, liquid-glass, ui-ux-pro-max skill, Google
  Sites continuation: all rejected earlier (see CLAUDE.md).
- Deleting duplicate files: blocked by user twice; never retry.
- First journey chronology (Italy before BOH): wrong, corrected everywhere.

# Known issues and uncertainties

- `public/resume.pdf` missing → Resume links 404 sitewide. Launch blocker.
- Experiment unrendered in a browser; stipple precompute (~12k point-in-
  polygon tests at load) is untested on low-end phones.
- Globe requires network for coastlines (graceful fallback coded, untested).
- Intramural + Tokyo Airbnb case studies have empty Key Findings/Artifacts:
  the site is copy-complete but evidence-light (see audit, Phase 6).
- Hawai'i value-stays draft approved but unpublished; needs artifacts and a
  projects.ts entry, and would change work-row numbering.
- LinkedIn URL (`linkedin.com/in/clark-hayashi`) unconfirmed; GPA display
  (3.71) awaiting Clark's confirmation.
- Domain not purchased; `site` in astro.config.mjs + robots.txt are placeholders.
- Two type systems now coexist (canonical vs experiment) pending Clark's call.

# Prioritized next actions

**Must fix before launch**
1. Clark: export `public/resume.pdf` (must match site facts: basketball MIP,
   President's List, hayashiclark@gmail.com).
2. Decide homepage direction (Astro as-is vs experiment); if experiment wins,
   port it into `src/` and update DESIGN.md fonts/sections deliberately.
3. Domain: buy, set in Vercel, update astro.config.mjs `site` + robots.txt.
4. Confirm LinkedIn URL and GPA display.

**Should improve**
5. Fill Key Findings/Artifacts for intramural + Tokyo Airbnb (2–3 findings +
   1 dashboard screenshot each; highest-impact proof gap).
6. Publish the Hawai'i value-stays case study from the approved draft.
7. Browser-test the experiment (desktop + phone): globe legibility, stipple
   performance, swipe, keyboard, reduced motion.

**Optional polish**
8. Real Estate results after one clean month of GA4 data.
9. Intramural/championship photos into `public/images/intramurals/`.
10. GA4 property + tag in Base.astro (production only).

# Immediate next task

Ask Clark to open `prototypes/portfolio-journey-experiment.html` next to
`portfolio-onepage.html` and the Astro site, and pick a direction. Everything
else queues behind that decision (except resume.pdf, which blocks regardless).

# Fresh-session startup instruction

Read `CLAUDE.md`, then this file, then skim `README.md` (edit map + launch
TODOs) and `DESIGN.md` (visual rules). Trust `src/data/*.ts` over memory for
all facts. Do not redesign anything without an explicit request; the next
step is Clark's homepage decision. Detailed references: `docs/portfolio-audit.md`
(6-phase audit, proof-density findings), `docs/journey-brief.md` (journey page
spec), `public/images/PHOTO-NOTES.md` (image map).
