# CLAUDE.md · Clark Hayashi Portfolio · Project Constitution

Stable facts and settled rules. For current state and next tasks, read
`docs/CLARK_PORTFOLIO_HANDOVER.md`. `DESIGN.md` is the visual authority. This
file never contains "current status"; it contains what does not change.

## How to read this file (restructured 2026-08-11, Clark's direction)

- This file settles **history and rules, not live state**. Any claim here about
  a live surface (the deployed site, LinkedIn, search results) is a dated
  observation: verify against the surface before repeating or acting on it.
  If the surface and this file disagree, the disagreement is a finding: report
  both, don't silently pick one.
- **Disagree openly.** If a rule here looks stale, contradictory, or
  counterproductive, say so with your reasoning instead of silently complying.
  Rules still bind until Clark changes them; silence is the failure mode.
- Every rule carries a one-line reason. The discovery stories behind the rules
  were moved to `docs/constitution-notes-2026-08-11.md`; read them only when
  a rule's reason isn't enough.

## Purpose and positioning

A personal portfolio for Clark Hayashi (hayashiclark@gmail.com), Business
Analytics & Marketing graduate, Seattle University, class of 2026, from
Hawai'i. Positioning: hybrid analyst/operator, never pigeonholed into a single
lane. Core line: "I turn messy data, ideas, and operations into clear
decisions." Audience: recruiters and hiring managers for analyst roles
(business, marketing, product/growth, operations, AI-workflow, sports
analytics); secondary: collaborators. **The 5-second read must be: analyst,
Magna Cum Laude, real AI work at a named bank.**

## Source-of-truth rules

- Content lives in `src/data/*.ts`; never hardcode content in layouts or
  components.
- The Astro app in `src/` is canonical. `prototypes/` are standalone HTML
  experiments; keep runnable, never authoritative.
- `DESIGN.md` (Google Stitch alpha format) must lint clean:
  `npx -y @google/design.md lint DESIGN.md` → 0 errors / 0 warnings.
- `public/images/PHOTO-NOTES.md` is the definitive image map.
- A fact is never allowed to be right in one file and wrong in another;
  corrections propagate to ALL versions (Astro site, one-page prototype,
  journey prototype, experiment).

## Verified chronology (settled, do not reorder)

1. Honolulu, 2004–2022 (Punahou 2018–2022; Eagle Scout; NEX 2020–2021)
2. Seattle, 2022 (Seattle University begins; UREC official from fall 2022)
3. Tokyo, Spring & Summer 2024 (Sophia University exchange)
4. Honolulu, Summer 2025 (Bank of Hawaii AI internship)
5. Sansepolcro/Tuscany, late Aug–early Sep 2025 (Albers Italy study tour)
6. Seattle, 2026 (graduation, Magna Cum Laude, GPA 3.71)

**The BOH internship and the Italy tour overlap, and the overlap is real, so do
not "correct" it in either direction.** The Albers course ran spring quarter
and summer, mostly online, completed alongside the internship; the 10-day
Italy immersion came after the internship ended. Wrong: any phrasing implying
Clark was in Italy instead of at the bank.

## Settled facts (user-confirmed; do not re-derive)

- **BOH**: one of the bank's first AI interns; 50+ use cases, 19+ interviews,
  Power BI dashboard + scoring framework, readout to 60+. Public-safe /
  summarized only; the work belongs to the bank. Independently corroborated by
  Seattle U newsroom, "Experience By Doing" (Tina Potterf, 2026-07-30): keep
  the article's own "part of a team" construction: the 50+ figure is team
  output, not a solo claim. A .edu source describing the work beats anything
  Clark says about himself; cite it rather than paraphrase.
- **Japanese minor**: confirmed by the same SU article. Publishable.
- **SUCUI**: Co-founder & COO, January 2024 – July 2026 (advising after; "to
  present" is wrong). $20K Harriet Stephenson win + $2.5K eBay Best
  Marketplace Idea Prize at UW Dempsey 2025 (as Seattle Financial Initiative,
  174-team field); $22.5K total confirmed 2026-07-10. Membership 23→54.
  Do NOT list "VP of Finance" or an "→ Advisor" suffix on this site.
  **Attribution guard: both wins belong to the ORGANISATION, not Clark.** SU's
  newsroom names six representing students and Clark is not among them (list
  in constitution-notes). The homepage phrasing "I co-founded a student credit
  union initiative THAT WON $22.5K" is built that way on purpose: the
  initiative is the subject of "won". Never rewrite to "I won" / "my team
  won"; the sentence is what protects him from a checking recruiter.
  Note: SUCUI's live team page has listed Clark under Financial Literacy and
  Operations for Winter 2026, which conflicts with "role closed, advising
  after." Ask Clark before reconciling; do not silently edit either side.
- **UREC**: "Intramural Sports Official → Manager", 2022–2026. 40+ officials.
  Analysis covers eight seasons 2018–2025, 4,169 player-years; 648 played in
  2025 (711 / 721 / 720 in 2022–24). The old "64+ teams, 469+ participants,
  7 years" line is **superseded**: flag it anywhere it appears; never
  reintroduce it.
- **Akaka Scholar**: Senator Daniel K. Akaka Scholar, $2,500, Seattle
  University, 2025-2026 year, Ke'ehi Memorial Organization. Cite the durable
  snapshot, not the live page (it rotates yearly):
  https://web.archive.org/web/20260609112104/https://www.klmemorial.org/scholarships/
  A future session finding no Clark on the live page has NOT disproved this
  fact. Same treatment for any third-party proof of a Clark fact: archive it,
  record the timestamped URL here, cite that. A possible 2024 recurrence is
  unverified; do not publish it.
- **Punahou**: varsity basketball co-captain and Most Inspirational Player
  (basketball, not golf); JROTC Mayor's Award; Carnival class raised $337K.
- **Hui o Nani**: "audience of 300+" (not "300+ participants").
- **Education line**: "Dean's List and President's List" (never "multiple-time
  Dean's List"); no "June 2026" attached to the degree; Magna Cum Laude leads.
- **LinkedIn URL**: linkedin.com/in/clark-hayashi (confirmed 2026-07-10).
- **Resume**: UNPUBLISHED from the site 2026-08-11 (cell number was exposed on
  an unauthenticated URL; brokers resold it). File preserved at
  `drafts/resume_UNPUBLISHED_2026-08-11.pdf`. Before any resume returns to
  `public/`: fix its superseded UREC numbers and its SUCUI attribution, and
  strip the phone number. Details in constitution-notes.
- **Applied Analytics SU**: Fall 2023 Seattle Building Permit dashboard, team
  project, live on Tableau Public (Daniel Rios' profile), always attributed
  as a team.
- **Tokyo Airbnb pricing analysis** (25,000+ listings) is Clark's SOLO
  project; the archived MKTG 4550 group project is separate reference
  material, not published.

## Design principles (summary; DESIGN.md is authoritative)

- Palette: paper #F7F4EF, ink #1C1C1C, teal #5D8C88 (decorative), teal-deep
  #4F7773 (interactive, WCAG AA on paper), bark #6B5642, crimson #8A1538
  (micro-accent only).
- Type (Clark's rebrand decision 2026-08-04; all self-hosted, all Indian Type
  Foundry): Core = Satoshi variable 300–900 + drawn italic (headings at 900,
  body, labels, captions). Voice = Zodiak 700 + italic, ONE moment per page.
  Accent = Bespoke Slab 700, intramural case study only, ceiling of three
  accents site-wide. Labels: sentence case 13px Satoshi 500, no tracked
  uppercase. Dark surfaces use Core only. Do not reintroduce Cormorant or
  Newsreader; the old "never Satoshi Black" rule is retired.
- The experiment (`prototypes/portfolio-journey-experiment.html`) trials
  Archivo/Fraunces/IBM Plex Sans by explicit user direction; adopting it is an
  explicit decision that updates DESIGN.md first.
- Warm editorial minimalism: numbered rows not cards, hairlines, generous
  whitespace, flat depth. /journey holds the single "loud" license.
- Honest statuses always: teal = complete/progress, crimson = building, bark =
  private/summarized. Statuses never overstate.

## Writing standards and anti-slop constraints

- Voice: plain, specific, warm, zero hype. Real numbers only, sourced from
  Clark; no invented metrics or results, ever.
- **No em dashes anywhere in site copy** (use commas, colons, periods, "·").
- Banned: "Welcome to my portfolio", "X taught me Y" triads, applause-line
  endings, skill bars, tool-logo walls, testimonial carousels, generic stock
  imagery, fake results, parallax, Lottie, custom cursors.
- Emoji: allowed only where the glyph does real work for the thing beside it
  (the imagery test applied to glyphs; e.g. the Duolingo streak flame on
  /side-quests). Banned: emoji as bullets, in headings, as status colours, or
  in strings.
- One italic serif accent per page maximum.
- Imagery test: every image must be *about* the thing it sits next to. Clark's
  own photos and artifacts always fine; third-party imagery fine when the
  subject is the subject. Banned: decorative filler that would work on any
  other site, and any image implying unreal work, results, or credentials.
  Never picsum or placeholder services.
- Generated assets (Clark's approval required per asset): **allowed, including
  photographic imagery.** The old blanket ban on generated photography was
  retired 2026-08-31 at Clark's direction: it ruled out speculative product
  comps and packaging mockups, which are ordinary portfolio work, and Clark
  wants the AI tooling used to its full range. Two conditions replace it.
  1. **Any generated image that could pass as a photograph of a real thing
     carries a legible label on the image itself**, naming it as AI-generated,
     and repeats that in its caption and its alt text. On the image, not only
     under it: captions do not survive a screenshot, a re-host, or Google
     Images, and the label is what keeps a comp from reading as a real product.
  2. **Still banned outright: generated imagery standing in for Clark's own
     life, work, results, or credentials.** A fabricated photo of Clark, his
     team, his workplace, or a dashboard he did not build is a lie about the
     record, and one of those puts every number on the site in doubt. A
     labelled speculative product is not that.
  Provenance goes in `public/images/PHOTO-NOTES.md`: what generated it, when,
  and what the on-image label says.

## Rejected directions (do not reintroduce)

WebGL globe · ShaderGradient, liquid-glass-js, glassmorphism, gradients,
neon/AI-demo looks · the old Google Sites page · scroll-hijacking on the
homepage (scrollytelling licensed only on /journey) · decorative grain and fake
hand-drawn irregularity (experiment) · Cormorant/Satoshi/Inter/Space Grotesk in
the experiment's direction · em dashes in copy.

**`ui-ux-pro-max` moved off this list 2026-08-31, Clark's call.** It was a
blanket ban; the revised stance is judge it by output. Use it where it fits and
produces something good, drop it where it does not. What earned the original
ban still stands as the thing to watch for: it ships a catalogue of 192
palettes, 74 font pairings and 17 GSAP presets, so its failure mode is picking
a look off a shelf instead of deriving one from the subject. The Zippy's case
study is the counter-example worth remembering: its palette and type came from
scraping zippys.com, and no preset library would have produced them. Take its
suggestions as candidates, never as an answer, and if its output could have
been generated for any other brief, throw it out.

## Repository guidance

- **Never delete files in this workspace** (permission explicitly denied
  twice). Overwrite in place, or leave duplicates documented in PHOTO-NOTES.md.
- `prototypes/*.html` use `../public/...` paths; they must stay in
  `prototypes/` to render.
- Sandbox build recipe (when the shell filesystem differs from the mounted
  folder): copy `src public package.json astro.config.mjs` to /tmp/build, run
  `timeout 42 npm install --no-audit --no-fund` (may need two runs), then
  `timeout 42 npx astro build`.
- Tailwind v4 lives entirely in `src/styles/global.css` via `@theme`; there is
  intentionally no tailwind.config.
- `archive/` and `drafts/` are source material, not part of the build.

## Publishing

"Push it", "ship it", "publish it", "make it live" authorize the whole job:

1. Inspect `git status` and the diff.
2. Run the checks: `npx astro build`; the dash search; DESIGN.md lint if
   DESIGN.md changed.

   Dash search runs against **built HTML** (src/ alone missed dashes in the
   docs for months) using perl with `\x{...}` escapes; grep gave two
   different wrong answers on this exact job, and pasting the literal glyph
   makes the file flag itself (forensics in constitution-notes):

   ```
   find dist -name '*.html' -exec perl -CSD -ne 'print "$ARGV:$.\n" if /\x{2014}|\x{2013}/' {} \;
   perl -CSD -ne 'print "$ARGV:$.\n" if /\x{2014}/' DESIGN.md CLAUDE.md
   ```

   Both must print nothing. Verify the check works by seeding a scratch file
   with an em dash and confirming it is caught. Scope: shipped HTML is checked
   for both dashes (visitors see them); the two docs for em dashes only (their
   en dashes are numeric ranges, which is what an en dash is for).
3. Stage only the files belonging to the current task; never `git add -A`.
4. Commit with an accurate message.
5. Push the current branch to its existing origin.
6. Verify the change on the live URL and report what was checked.

Do not hand Clark a command that can be run here. Stop and ask first when:
unrelated changes are mixed in, a rebase conflicts, checks fail, a secret
appears in the diff, the target repo/branch is ambiguous, or finishing would
need a force-push, a deletion, or overwriting someone else's work.

Auth: SSH as of 2026-07-31, key
`SHA256:+VFQ/ilVMOOlgyB5S0tKIRipLYPnwAtQoiAckPJq2cw`, `~/.ssh/config` has
`UseKeychain yes`. Both `portfolio` and `my-websites` use `git@github.com:`
remotes. No `gh` CLI, no Homebrew on this machine; do not suggest installing
either. Both sites deploy on push to `main` (clarkhayashi.com via Vercel,
reading notes via GitHub Pages). Pushing is publishing: verify live, don't
report a green build.
