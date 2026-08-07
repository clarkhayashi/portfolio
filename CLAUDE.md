# CLAUDE.md · Clark Hayashi Portfolio · Project Constitution

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
5. Sansepolcro/Tuscany, late August to early September 2025 (Albers Italy
   study tour; the trip itself, see the note below)
6. Seattle, 2026 (graduation, Magna Cum Laude, GPA 3.71)

**The BOH internship and the Italy tour overlap, and the overlap is real, so
do not "correct" it in either direction.** The Albers course ran spring
quarter and summer and was taught mostly online, which Clark completed
alongside the BOH internship. The 10-day immersion in Italy happened at the
end of that summer, late August into early September 2025, after the
internship. So: the *trip* came after BOH, the *coursework* ran concurrently.
Both "Summer 2025" and "September 2025" are defensible for the tour; the
resume says Summer 2025 and the site now matches it. What is wrong is any
phrasing implying Clark was in Italy instead of at the bank.

## Settled facts (user-confirmed; do not re-derive)

- BOH: one of the bank's first AI interns; 50+ use cases, 19+ interviews,
  Power BI dashboard + scoring framework, readout to 60+. Details stay
  public-safe/summarized; work belongs to the bank.
  **Independently corroborated (verified 2026-08-06)** by Seattle U's own
  newsroom, "Experience By Doing", Tina Potterf, 2026-07-30: Clark "was part of
  a team working as AI consultants" that interviewed bank employees, organized
  50+ potential AI use cases, found solutions, and presented results to
  leadership. Note the article's own construction, "part of a team", and keep
  it: the 50+ figure is the team's output, not a solo claim. This is a .edu
  source describing the work, which is stronger than anything Clark says about
  himself, so it is worth citing rather than paraphrasing.
- Japanese minor: confirmed 2026-08-06 by the same Seattle U article, "the
  double major in business analytics and marketing (with a minor in Japanese)".
  Previously an unverified LinkedIn-only claim; now publishable.
- SUCUI: Co-founder & COO, January 2024 to July 2026 (advising after). The
  role is closed, not ongoing; "to present" is wrong. $20K Harriet
  Stephenson win + $2.5K eBay Best Marketplace Idea Prize at UW Dempsey 2025
  (competed as Seattle Financial Initiative, 174-team field); $22.5K total
  confirmed by Clark 2026-07-10. Membership 23→54.
  Do NOT list "VP of Finance" or an "→ Advisor" role suffix.
  **Attribution guard on the $22.5K (audited 2026-08-06).** Both wins are real
  and independently documented, and both belong to the ORGANISATION, not to
  Clark personally. Seattle U's Albers newsroom piece on the $20K Harriet
  Stephenson win (2024-06-03) names six representing students, Ana Giordano,
  Dora Becker, Emma Nguyen, Ethan Sue, Jonathan Tran and Julian Ma, and Clark
  is not among them. The $2.5K eBay Best Marketplace Idea Prize is confirmed in
  the Foster School's 2025 Dempsey Startup Competition writeup, awarded to
  "Seattle Financial Initiative". So the homepage phrasing, "I co-founded a
  student credit union initiative THAT WON $22.5K", is correct and has to stay
  built that way: the initiative is the subject of "won", not Clark. Never
  rewrite it to "I won $22.5K" or "my team won". A recruiter who checks finds
  six names that are not Clark's, and the sentence is what protects him.
  Note also that SUCUI's live team page lists Clark under Financial Literacy
  and Operations for Winter 2026, not as an advisor and not in Marketing, which
  does not match "role is closed, advising after". Ask Clark before reconciling;
  do not silently edit either side.
- UREC: "Intramural Sports Official → Manager", 2022–2026. 40+ officials.
  Analysis covers eight seasons, 2018 to 2025, 4,169 player-years; 648
  participants played at least one game in 2025 (711 / 721 / 720 in 2022-24).
  The older "64+ teams, 469+ participants, 7 years" line is **superseded**;
  `im-analytics/PHASE1_proposal_v2.md` records it as outdated copy that must be
  replaced with validated dataset numbers. Do not reintroduce it.
- Akaka Scholar (added 2026-08-06). Ke'ehi Memorial Organization named Clark
  the **Senator Daniel K. Akaka Scholar, $2,500, Seattle University**, under the
  heading "Scholarship Recipients (2025-2026 Academic Year)". KMO is a Honolulu
  veterans' organization; the award honours Senator Daniel K. Akaka, a WWII
  veteran and chair of the Senate Veterans' Affairs Committee.
  Live page: https://www.klmemorial.org/scholarships/
  **Durable citation, use this one:**
  https://web.archive.org/web/20260609112104/https://www.klmemorial.org/scholarships/
  The live page is a rotating current-recipients list, not an archive. Its own
  copy says the 2026-2027 application closed 2026-05-15, so Clark's name is
  expected to drop off when that cycle is published. **A future session finding
  no Clark on the live page has NOT disproved this fact**; check the snapshot
  above, which was verified by hand on 2026-08-06 and contains the line
  verbatim. Any other live third-party page cited as proof of a Clark fact gets
  the same treatment: archive it, record the timestamped URL here, cite that.
  Clark's LinkedIn separately records the same recognition in 2024, which would
  make it recurring. That second year is NOT yet verified and must not be
  published until it is.
- Punahou: varsity basketball co-captain and Most Inspirational Player
  (**basketball, not golf**); JROTC Mayor's Award; Carnival class raised $337K.
- Hui o Nani: "audience of 300+" (not "300+ participants").
- Education line: "Dean's List and President's List" (never "multiple-time
  Dean's List"); do not attach "June 2026" to the degree.
- LinkedIn URL: linkedin.com/in/clark-hayashi (confirmed by Clark 2026-07-10).
- Resume: `public/resume.pdf` = ClarkHayashiResume2026, supplied by Clark
  2026-07-10; fact-checked against site copy at install time.
- Applied Analytics SU: Fall 2023 Seattle Building Permit dashboard, team
  project, live on Tableau Public (Daniel Rios' profile).
- Tokyo Airbnb pricing analysis (25,000+ listings) is Clark's SOLO project;
  the archived MKTG 4550 group project (`archive/tokyo-airbnb-group-project/`)
  is separate reference material and is not published.

## Design principles (summary; DESIGN.md is authoritative)

- Palette: paper #F7F4EF, ink #1C1C1C, teal #5D8C88 (decorative), teal-deep
  #4F7773 (interactive, WCAG AA on paper), bark #6B5642, crimson #8A1538
  (micro-accent only).
- Canonical site type (Clark's explicit rebrand decision, 2026-08-04, from the
  "Clark Hayashi Brand System" Type System proposal): all self-hosted, all
  Indian Type Foundry. Core = Satoshi variable 300–900 + drawn italic (all
  headings at 900, body, labels, captions). Voice = Zodiak 700 + italic, ONE
  moment per page (page title, or one pull statement, or the finding number).
  Accent = Bespoke Slab 700, intramural case study only, recorded in front
  matter; ceiling of three accents site-wide. Labels are sentence case 13px
  Satoshi 500, no tracked uppercase anywhere. Dark surfaces use Core only.
  This replaced Newsreader (2026-07-28 to 2026-08-04), which had replaced
  Cormorant Garamond; do not reintroduce Cormorant or Newsreader on the
  canonical site, and the old "never Satoshi Black" rule is retired with the
  serif-display identity it protected.
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
  endings, skill bars, tool-logo walls, emoji, testimonial carousels, generic
  stock imagery, fake results, parallax, Lottie, custom cursors.
- One italic serif accent per page maximum (e.g. "messy" in the hero).
- Imagery test (revised 2026-07-30, replaces a flat "no stock imagery" ban):
  every image must be *about* the thing it sits next to. Clark's own photos and
  artifacts are always fine. Third-party imagery is allowed when the subject is
  the subject: a brand's product shot on a case study about that brand, an org's
  logo on that org's role. What stays banned is decorative filler that would work
  equally well on any other site (smiling strangers at whiteboards, abstract
  "data" swooshes, unrelated cityscapes), and any image implying work, a result,
  or a credential that is not real. Prefer Clark's own asset when one exists.
  Never picsum or a placeholder service.
- Generated assets (revised 2026-08-06, at Clark's direction). The line is what
  the image claims, not how it was made. **Allowed, with Clark's approval on the
  specific asset:** anything depicting no real place, person, artifact, or
  result. Diagrams, textures, section marks, abstract figures, and charts
  rebuilt as clean SVG all qualify, and a well-made one is better than an empty
  slot. **Still banned:** generated photographic imagery standing in for Clark's
  own life or work, such as a rendered coastline beside the Hawai'i story or a
  synthesized office beside the Bank of Hawaii internship. A reader cannot tell
  a generated beach from a real one, the whole site asks to be believed on its
  numbers, and one fabricated photo puts that credit at risk. This is the "no
  invented metrics" rule applied to pixels. Placeholder services stay banned
  outright: shipping one is shipping an unfinished page.

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

## Publishing

"Push it", "ship it", "publish it", and "make it live" are explicit
authorization to finish the whole job without handing back commands:

1. Inspect `git status` and the diff.
2. Run the build and the project checks (`npx astro build`, the dash search,
   `npx -y @google/design.md lint DESIGN.md`).

   The dash search runs against the **built HTML**, not `src/`. Searching
   `src/` alone missed em dashes living in DESIGN.md and CLAUDE.md for months,
   including one inside the sentence that states the ban. Both dashes are
   checked, because an en dash used as a range separator is the same
   inconsistency wearing a shorter character:

   Use perl with `\x{...}` escapes. Do not use grep, and do not put the literal
   glyph in the pattern, for three reasons learned the hard way on 2026-08-06:
   a literal glyph makes this file flag itself forever; BSD grep does not
   support `\|` alternation in a basic regex, so a grep pattern joining the two
   glyphs with `\|` silently searches for that four-character string instead
   and reports a clean 0 on a dirty tree; and a bracket class holding the two
   glyphs matches multibyte characters byte by byte, which reported 182 hits
   against 0 real ones. Two different greps gave two different wrong answers
   before perl gave the right one. Describe the glyphs, never paste them.

   ```
   find dist -name '*.html' -exec perl -CSD -ne 'print "$ARGV:$.\n" if /\x{2014}|\x{2013}/' {} \;
   perl -CSD -ne 'print "$ARGV:$.\n" if /\x{2014}/' DESIGN.md CLAUDE.md
   ```

   Both must print nothing. Verify the check itself still works by seeding a
   scratch file with an em dash and confirming it is caught; a check that
   cannot fail is not a check.

   Scope is deliberate. Shipped HTML is checked for **both** dashes, because a
   visitor sees them. The two documents are checked for the **em dash only**:
   en dashes in their prose are numeric ranges (`300–900` font weights,
   `75–80%` opacity, `2004–2022`), which is what an en dash is for, and no
   visitor ever reads them.
3. Stage only the files belonging to the current task, never `git add -A`.
4. Commit with an accurate message.
5. Push the current branch to its existing origin.
6. Verify the change on the live URL and report what was checked.

Do not hand Clark a command to run when the command can be run here.

Stop and ask first when: unrelated changes are mixed into the working tree, a
rebase conflicts, the build or checks fail, a secret appears in the diff, the
target repository or branch is ambiguous, or finishing would need a
force-push, a deletion, or overwriting someone else's work. Never force-push,
never commit credentials, never discard existing work.

Auth is SSH as of 2026-07-31, key `SHA256:+VFQ/ilVMOOlgyB5S0tKIRipLYPnwAtQoiAckPJq2cw`,
with `~/.ssh/config` set to `UseKeychain yes` so it survives reboots. Both
`portfolio` and `my-websites` use `git@github.com:` remotes. There is no `gh`
CLI and no Homebrew on this machine; do not suggest installing either.

Both sites deploy on push to `main`: `clarkhayashi.com` through Vercel, the
reading notes through GitHub Pages. Pushing is publishing, so verify live
rather than reporting a green build.
