# Clark Hayashi Portfolio · Handover (living continuity record)

Last updated: 2026-07-10 (third session: full audit pass). Read `CLAUDE.md`
(project constitution) first.
Detailed audits linked at the bottom. This file is the single source of truth
for current state; update it at the end of every working session.

# Current objective

Get the site launch-ready, and decide between two competing homepage
directions: the canonical Astro site (`src/`) versus the new
`prototypes/portfolio-journey-experiment.html` (journey-globe-as-homepage,
new type system). Clark has not yet chosen.

# Current implementation state

Verified directly against the codebase on 2026-07-10 (both sessions);
`npx astro build` passes, 9 pages built.

**Astro site (canonical, builds clean):**
- Pages: `/` (index.astro), `/about`, `/journey`, `/work` + 5 case-study
  markdown pages (ai-use-case-prioritization, hawaii-value-stays,
  intramural-participation, real-estate-lead-analytics, tokyo-airbnb-pricing).
- Components: Header, Footer, ButtonLink, StatusLabel, ProjectRow, WorkList,
  LaneList, WaveDivider, ExperienceRow.
- Data files: projects.ts (8 work items), lanes.ts (5 lanes), experience.ts
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

**Hawai'i value-stays: PUBLISHED (2026-07-10, second session).**
`src/pages/work/hawaii-value-stays.md` created + projects.ts entry (after
Seattle Building Permit). Clark's answers, on record: dataset = Inside
Airbnb; framed as Clark's own separate build, inspired by the class
original, with NO team credit (Clark: "do not need to mention, separate
project, inspo from our original"); Reflection drafted by Claude AWAITING
Clark's review; Recommendations kept from draft but Clark chose "I'll
tweak" without providing text yet. Draft file kept in `drafts/` with a
superseded note. Artifacts section still a placeholder pending Clark's
Tableau Public publish. `archive/tokyo-airbnb-group-project/` remains
reference-only, never publish directly.

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

# Recent session changes (2026-07-10, third session: audit pass)

Full ownership audit of docs vs repo, then targeted fixes. Build passes
(9 pages), zero broken internal links except /resume.pdf, zero em dashes in
built HTML, all referenced images/fonts exist on disk, DESIGN.md lints 0/0.

1. **Factual consistency fixes (settled facts, propagated everywhere):**
   "40 officials" → "40+ officials" (experience.ts + both prototypes);
   BOH case page upgraded from "19 employees" to the settled "19+ employees
   ... 50+ AI use cases" and now ends with the 60+ readout sentence (src md +
   both prototypes, all three identical); intramural overview now "64+ teams
   and 469+ participants".
2. **Accessibility contrast pass (canonical site only):** computed WCAG AA
   against paper #F7F4EF. Failing small text fixed: ink/45 and ink/55
   metadata → ink/65 (5.0:1); supporting ink/60 → ink/70; small bark/70 and
   bark/80 text (eyebrows, org lines, figcaptions, hero location) → full
   bark (6.3:1); ExperienceRow small links text-teal (3.4:1, violated
   DESIGN.md's own rule) → text-teal-deep (4.5:1). Decorative elements
   (ghost numerals bark/25, hover arrows, wave, How-I-Work step numbers)
   deliberately untouched. DESIGN.md hierarchy paragraph updated to record
   the 65% floor; linted clean after the edit.
   NOTE: the prototypes still use the old lower-contrast values; if the
   experiment is promoted, apply the same floor during the port.
3. **Link verification:** Tableau Building Permit dashboard confirmed live in
   a real Chrome tab (title renders). Tableau cannot be verified by plain
   fetch (client-rendered); don't mistake fetch failures for a dead link.
4. **Browser testing attempted:** experiment loads in Chrome via file://
   (title correct; Clark had it open at #experience). Visual globe/stipple
   check STILL not eyeball-verified: screen-capture approval timed out and
   Chrome's "Allow JavaScript from Apple Events" is off, so no DOM probing.
5. Verified NOT issues: $22.5K total (journey.ts, index, prototypes) is
   consistent everywhere but the eBay prize amount is unconfirmed by a
   source doc; website_copy.md says "$20,000 Harriet Stephenson" only. Ask
   Clark once: is $22.5K (20K + 2.5K eBay) right?

# Prior session changes (2026-07-10, second session)

1. **Verified repo against CLAUDE.md + this handover:** build re-run (passed,
   8 pages pre-change), chronology consistent in journey.ts + both prototypes,
   no em dashes in src/, audit docs present. Only discrepancy found: all work
   sat uncommitted on a single-commit repo.
2. **Git checkpoint commit** of all prior work (a stale `.git/index.lock` had
   to be removed; file deletion was user-approved for that purpose only; the
   never-delete rule for workspace files still stands).
3. **Homepage decision asked; still OPEN.** Clark: "not ready to decide but I
   do like the experiment and def see the potential." Do not port anything yet.
4. **Published the Hawai'i value-stays case study** (see above) and marked the
   draft superseded. Build verified after: 9 pages, new page linked from `/`
   and `/work`, zero em dashes in output.
5. NOT done: prototypes (`portfolio-onepage.html`, experiment) do NOT yet show
   the new Hawai'i work row; sync deliberately deferred until the homepage
   decision (additions are not "factual corrections" under the propagation rule,
   but the one-page mirror is now one row behind).

# Prior session changes (2026-07-10, first session)

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

- ~~resume.pdf missing~~ RESOLVED 2026-07-10: Clark supplied
  ClarkHayashiResume2026.pdf; installed at `public/resume.pdf`, fact-checked
  against site copy (email, President's List, 50+/60+, $20K+$2.5K, 23→54,
  40+/64+/469+ all match). Zero broken links sitewide now. Note: resume
  shows GPA 3.7 and "Interviewed 19"; site shows 3.71 and "19+". Not
  contradictions, but if Clark wants exact parity, pick one.
- Experiment unrendered in a browser; stipple precompute (~12k point-in-
  polygon tests at load) is untested on low-end phones.
- Globe requires network for coastlines (graceful fallback coded, untested).
- Intramural + Tokyo Airbnb case studies have empty Key Findings/Artifacts:
  the site is copy-complete but evidence-light (see audit, Phase 6).
- Hawai'i value-stays now published but carries three open items: Reflection
  awaiting Clark's review, Recommendations awaiting Clark's tweak, Artifacts
  awaiting his Tableau Public publish.
- LinkedIn URL and $22.5K total ($20K Harriet Stephenson + $2.5K eBay Best
  Marketplace Idea Prize): both CONFIRMED by Clark 2026-07-10 (now in
  CLAUDE.md settled facts). GPA display (3.71 vs resume's 3.7) still awaiting
  Clark's preference.
- Domain not purchased; `site` in astro.config.mjs + robots.txt are placeholders.
- Two type systems now coexist (canonical vs experiment) pending Clark's call.

# Prioritized next actions

**Must fix before launch**
1. ~~resume.pdf~~ DONE 2026-07-10 (installed and fact-checked).
2. Decide homepage direction (Astro as-is vs experiment); if experiment wins,
   port it into `src/` and update DESIGN.md fonts/sections deliberately.
3. Domain: buy, set in Vercel, update astro.config.mjs `site` + robots.txt.
4. ~~Confirm LinkedIn URL~~ DONE. Confirm GPA display (3.71 vs resume's 3.7).

**Should improve**
5. Fill Key Findings/Artifacts for intramural + Tokyo Airbnb (2–3 findings +
   1 dashboard screenshot each; highest-impact proof gap).
6. Hawai'i value-stays follow-ups: Clark reviews the Reflection, supplies his
   Recommendations tweak, publishes his workbook to Tableau Public
   (profile/clark.hayashi), then add the VerifiedLink + 2–3 chart crops
   (consistency check: published numbers must match Key Findings).
7. Browser-test the experiment (desktop + phone): globe legibility, stipple
   performance, swipe, keyboard, reduced motion.
7b. After the homepage decision: sync the Hawai'i work row into the surviving
   prototype(s).

**Optional polish**
8. Real Estate results after one clean month of GA4 data.
9. Intramural/championship photos into `public/images/intramurals/`.
10. GA4 property + tag in Base.astro (production only).

# Immediate next task

Resume.pdf is in; the launch path now runs through Clark's homepage decision
(he likes the experiment but hasn't committed; he's been browsing it, the
file:// tab was open at #experience). Next: get his decision. Remaining
direction-independent work: (a) Clark's three Hawai'i follow-ups (Reflection
review, Recommendations tweak, Tableau Public publish), (b) Key Findings for
intramural + Tokyo Airbnb, (c) domain purchase, (d) GPA display choice.

# Fresh-session startup instruction

Read `CLAUDE.md`, then this file, then skim `README.md` (edit map + launch
TODOs) and `DESIGN.md` (visual rules). Trust `src/data/*.ts` over memory for
all facts. Do not redesign anything without an explicit request; the next
step is Clark's homepage decision. Detailed references: `docs/portfolio-audit.md`
(6-phase audit, proof-density findings), `docs/journey-brief.md` (journey page
spec), `public/images/PHOTO-NOTES.md` (image map).
