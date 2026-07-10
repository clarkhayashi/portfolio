# Portfolio Self-Audit Loop — July 2026

Goal: make the site answer "here is what I can do for your team" for
Business / Marketing / Product-Growth / Operations / Revenue / AI-Workflow
Analyst roles. Preserved by mandate: the Hawai'i–Seattle–Japan identity, the
editorial design, the core line, honest statuses.

---

## PHASE 1 — Draft

The draft under audit is the site as it stood before this loop: proof-loaded
hero, 5 lanes, 6 work rows (2 completed, 1 delivered, 2 in progress, 1 live),
13 equal-weight experience entries, Rooted Perspective with a 4-photo gallery.

## PHASE 2 — Self-audit (scored as the pre-loop site)

| Dimension | Score | Note |
|---|---|---|
| Clarity | 8 | Hero names roles + employers. |
| Credibility | 7 | Real orgs, 6 third-party links. Two flagship case studies still have empty Findings. |
| Proof density | 4 | One clickable finished artifact on the whole site (Tableau). No screenshots anywhere. |
| Differentiation | 8 | BOH AI internship + Hawai'i/Japan identity + honest statuses. Genuinely uncommon combination. |
| Recruiter usefulness | 6 | First screen strong; About page was a 13-entry, six-screen biography. |
| Visual hierarchy | 7 | Weights fixed, right rail aligned; snapshot monotonous. |
| Concision | 4 | About = life archive. Intro paragraph duplicated the snapshot below it. |
| Authenticity | 8 | Honest statuses carry it; a few slogan lines undercut it. |
| AI-slop risk | Moderate | See list below. |

**Five weakest parts**
1. Empty Key Findings/Artifacts in Tokyo Airbnb and Intramural case studies. This is a content gap, not a copy or design problem, and it caps the whole site.
2. Experience Snapshot: 13 entries at equal visual weight = biography, not a hiring document.
3. Slogan endings that sound written-for-effect: "Fast learning, constant adjustment, zero spotlight." / "First jobs teach things no classroom does."
4. Selected Work intro was apologetic: "case studies are being written up as results land" reads as *please excuse the site*.
5. About intro paragraph retold SUCUI and UREC, which the snapshot restates 30 seconds later.

**Repetition:** the messy→clear motif appears in the hero, the contact strip,
the About intro, and Rooted Perspective. Two instances is a brand; four is a tic.
**Overclaim check:** none found — numbers all trace to documents Clark provided.
**Buried:** nothing critical; the Dempsey prize was surfaced earlier.

## PHASE 3 — Revision (implemented)

- Experience Snapshot split: **5 main entries** (Bank of Hawaii, SUCUI, UREC,
  Applied Analytics, SU degree) + **collapsible "Background"** holding the
  other 7 (NCAA practice player, Hui o Nani, Sophia, Italy, NEX, Punahou,
  Eagle Scout) with all visuals intact. Full story preserved, one click away.
- Cut both slogan endings. The facts stand better without applause lines.
- Selected Work intro → "Completed work leads. Anything unfinished says so."
- About intro paragraph 2 rewritten: keeps BOH (the flagship) + the flag-football
  line (earns its place as personality), drops the SUCUI/UREC duplication.
- "June 2026" cut from the degree line (dates column already says 2026);
  "multiple-time Dean's List" → "Dean's List and President's List";
  SUCUI role back to "Co-founder & COO" (the detail explains current advising).

## PHASE 4 — Adversarial review of the revision

- **What makes a recruiter leave?** Still the same thing: no dashboard
  screenshot exists anywhere on a site that claims dashboards as the core
  skill. Nothing in this loop can fix that; only Clark's artifacts can.
- **Still generic?** The hero eyebrow names two titles (Business / Marketing
  Analyst) while Clark targets six role families. Verdict: keep. Naming all
  six would read indecisive; the two named are the most-searched titles and
  the skill words (measurement, dashboards, AI workflows) cover the rest.
  Role-specific tailoring belongs in the resume per application, not the site.
- **Three taxonomies problem:** identity chips (6), lanes (5), How-I-Work
  steps (3) all describe the same person. Borderline redundant. Kept, because
  they serve different scan depths (2s / 20s / 60s), but nothing new should be
  added to the homepage.
- **Motif repetition:** hero + contact strip echoes kept as intentional
  bookends; About keeps one instance because people land there directly from
  LinkedIn. Watch-item, not fixed.
- **Could be misunderstood:** "Completed · summarized" on BOH could set
  case-study expectations; the page explains confidentiality within two
  sentences. Acceptable.
- **Remove entirely?** The Portfolio Website row (06) is the weakest item.
  Kept only as the Visual Communication lane's proof; it should be replaced
  the day the poster/design files arrive.

## PHASE 5 — Final version

The final version is live in the codebase (both the Astro site and
portfolio-onepage.html). Section order, confirmed:

**Home:** role eyebrow + hero + proof subhead → identity strip → What I Bring →
Selected Work (completed first) → How I Work → About teaser → contact strip.
**About:** short intro → lanes → Experience (5) → Background (collapsible 7) →
Rooted Perspective + 4-photo gallery → Building Now → contact.

Post-revision estimate: clarity 9 · credibility 7.5 · proof density 5 ·
differentiation 8 · recruiter usefulness 8 · hierarchy 8 · concision 7.5 ·
authenticity 8.5 · slop-risk low.

Plain statement: **the site is copy-complete and evidence-light.** Proof
density cannot pass ~6 through editing. Every further point comes from
artifacts, not words.

## PHASE 6 — Change log

**Changed:** experience split with collapsible Background; two slogan lines
cut; Selected Work intro de-apologized; About intro deduplicated; degree line
cleaned (no date, Dean's + President's List); SUCUI role simplified.
**Kept deliberately:** the core hero line; editorial palette and type; honest
statuses; Rooted Perspective and its gallery (this is the differentiation, not
the fat); all Background entries with logos/photos (collapsed, not deleted).
**Cut deliberately:** applause-line sentence endings; duplicate biography;
"June 2026"; the arrow-Advisor role suffix.

**Still requires real evidence from Clark (ranked by impact):**
1. Tokyo Airbnb: 2–3 written findings + 1 Tableau screenshot → fills the
   flagship case study.
2. Intramural: same. These two items alone would raise proof density more
   than everything else combined.
3. `public/resume.pdf` — launch blocker; confirm it matches the site
   (basketball MIP, President's List, hayashiclark@gmail.com).
4. Custom domain + Vercel deploy.
5. Poster/design files → replaces the Portfolio Website row with real
   Visual Communication work.
6. A UREC officiating/manager photo and any public-safe BOH cohort photo.
7. Two or three short quotes (LinkedIn recommendations) for a future
   credibility strip.
