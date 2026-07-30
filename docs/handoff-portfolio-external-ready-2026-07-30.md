# Handoff · clarkhayashi.com external-readiness · 2026-07-30

## Objective

Push the 5 completed commits on `claude/favicon-mark` to production, then clear the
four remaining blockers so the site can be sent to recruiters without caveats.

**Definition of done:** `clarkhayashi.com` and `www.clarkhayashi.com` both load
without warnings; no page contains the string "Content in progress"; every
Selected Work row carries a thumbnail; a proof strip naming Bank of Hawai'i,
Seattle University and Magna Cum Laude appears above the fold on the homepage.

---

## Current state

### Ready to ship, not yet pushed

Branch `claude/favicon-mark`, HEAD `081be01`, **5 commits ahead of `origin/main`**.
Production build passes at 10 pages. All 10 routes return 200 locally. Zero prose
em dashes. `DESIGN.md` lints 0 errors / 0 warnings.

| Commit | What it does |
|---|---|
| `081be01` | External-readiness pass: /about container, image crop anchor, OG card, JSON-LD, DESIGN.md reconciliation |
| `f7f60a4` | Globe chips use real photographs instead of drawn SVG dioramas |
| `1a4b35e` | Type scale 14 sizes → 9; ink opacities 6 → 3 |
| `b36a4cc` | Display face Cormorant Garamond → Newsreader |
| `1cb0b12` | Plainer journey headings; second Strava activity in a rotator |

**The push has never succeeded.** This environment has no GitHub credentials: no
`gh` CLI, no SSH key in `~/.ssh`, and the macOS keychain returns nothing usable.
`git push` fails with `fatal: could not read Username for 'https://github.com'`.
Clark must run the push himself, or run `brew install gh && gh auth login && gh
auth setup-git` once to unblock future sessions.

### Reverted, preserved, not lost

A globe overhaul (six-stop timeline replacing the tab row, per-stop zoom, land-10m
map data, institution logos on cards, English-only tabs) was built and then
reverted at Clark's request on 2026-07-30: *"it looks ok but super sloppy it is not
ready to go."* It lives on branch **`safety/globe-experiment-20260730`** (HEAD
`e2ecc8a`, 2 commits). Nothing was deleted. See Dead ends for why it was not
salvageable as-is.

Note that `f7f60a4` (photo chips) was deliberately **kept** rather than reverted,
because Clark had explicitly asked for real photographs over the SVG dioramas
(*"I do not like the current svg drawing it is just AI slop"*) and had approved the
Tokyo and Seattle results.

### Blocked on Clark

None of the four items below can be completed by an agent. All are verified as
still outstanding as of 2026-07-30.

1. **Eleven "Content in progress" placeholders.** Verified counts:
   `src/pages/work/tokyo-airbnb-pricing.md` = 4,
   `src/pages/work/real-estate-lead-analytics.md` = 4,
   `src/pages/work/intramural-participation.md` = 3.
   The intramural findings already exist in
   `03_Portfolio Website/im-analytics/PHASE3_insight_cards.md` (12 ranked cards
   with real numbers) plus 8 charts in `im-analytics/deck_assets/`. Publishing
   needs Clark to confirm attribution first: the page says "Sole analyst" but
   `im-analytics/` also contains `Group 5 Final Presentation.pdf`.
2. **`www.clarkhayashi.com` has no certificate.** Verified live: the served
   certificate's Subject Alternative Name list contains only `DNS:clarkhayashi.com`.
   Anyone reaching the site via `www.` gets a full-screen
   `ERR_CERT_COMMON_NAME_INVALID` interstitial with no click-through, because HSTS
   is set. Fix is Vercel dashboard only: project → Settings → Domains → Add
   `www.clarkhayashi.com` → accept the redirect-to-apex option. Free; it is not
   the paid "Bulk Redirects" feature.
3. **Selected Work rows have zero images.** Seven projects, no thumbnails, while
   the rest of the homepage carries 22 images. A background task was spawned for
   this and Clark started it; it appears to be branch
   `claude/beautiful-matsumoto-20b143`. It needs Clark to choose which image
   represents each project.
4. **No social proof above the fold.** Clark took this item himself.

---

## Decisions made

- **Display face is Newsreader, not Cormorant Garamond** (confirmed by Clark).
  Reason: Cormorant is the default serif of the elegant-portfolio template genre,
  which is precisely why the hero read as generic. Newsreader is a Production Type
  face with a real optical-size axis, so it self-adjusts between display and text
  sizes. Measured at identical size its glyphs are ~20% wider (x advance 60 vs 50).
- **Cormorant was NOT simply replaced everywhere.** An earlier attempt at
  "Satoshi everywhere, drop Cormorant" was built, previewed, and **reverted by
  Clark** in favour of keeping a serif for display only. Do not re-propose
  Satoshi-only.
- **Serif for display ≥28px, Satoshi below** (working rule, now written into
  DESIGN.md). Reason: at 20px a display serif renders visually lighter than the
  16px Satoshi body copy beneath it, inverting the hierarchy.
- **Nine-step type scale: 56 / 36 / 28 / 24 / 18 / 16 / 14 / 12 / 11.** Reason:
  the homepage previously ran 14 distinct sizes with four of them inside a 1.4px
  band and three inside 5.6px. Sizes that close are not perceived as a rank.
- **Globe stays above Selected Work** (confirmed by Clark, 2026-07-30). An earlier
  audit recommended moving work up; Clark's counter-argument was accepted as
  correct: while the case studies are still empty, surfacing them faster is worse.
  **Revisit once the placeholders and thumbnails land** — the argument reverses.
- **No stock or watermarked imagery.** Clark supplied
  `waikiki-and-diamond-head-at-sunset-j-andruckow.jpg` and
  `istockphoto-598919748-612x612.jpg` on his Desktop and asked for them to be used;
  they were not, because both are other photographers' licensed work and
  `CLAUDE.md` bans stock imagery. The Seattle chip photo
  (`public/images/seattle/seattle-kerry-park.jpg`) came from an Unsplash file
  Clark downloaded, which is licensed for commercial use. **The Honolulu chip
  still needs an equivalent Unsplash Diamond Head file from Clark.**
- **Japanese appears only where it carries meaning.** 東京 / 留学 / 上智大学 on the
  Tokyo stop and the About page. Other places were not translated into katakana:
  the asymmetry marks the one place the language is Clark's.

---

## Dead ends

**The globe deep-zoom experiment. Do not simply retry it with bigger numbers.**

Clark asked to zoom close enough to see Puget Sound, the outline of Japan, Italy,
and O'ahu itself. Three real bugs were found and fixed along the way, and then a
fourth limit could not be fixed:

1. Latitude was damped to `lat * 0.58` for a pleasing tilt at world view. Zoom
   magnifies that offset; at 45× the target sat 1,381px off-canvas and the marker
   vanished. Fixed by relaxing damping to 1 by 4× (`latAim` helper).
2. That helper was declared *after* its first use, so the entire globe script died
   in the temporal dead zone and no map data ever loaded. The symptom was a solid
   dark circle and an empty `performance.getEntriesByType('resource')` list for
   world-atlas. Fixed by moving the declaration up.
3. Once the projected sphere greatly exceeds the canvas, d3's `Sphere` path stops
   producing a usable fill, leaving the ocean unpainted so the map read inverted.
   Fixed by painting the ocean as an explicit `ctx.arc` disc.
4. **Unfixed:** past roughly 12× zoom the clipped land path inverts `evenodd`
   parity and the fill flips again — beige ocean, dark land. Verified working at
   1.6×, 4.5×, 8×, 9×. Verified broken at 40×. Reaching O'ahu-level detail needs a
   different clipping approach or a real tile map (MapLibre), not a larger zoom
   value.

**Font shopping.** Five separate lists were brought to the conversation (Figma's
"24 best fonts", a Google AI Overview, Futura PT / Freight Display Pro, a Flux
Academy video, Figma's Google Font Pairings). Every candidate on them —
Inter, Roboto, Montserrat, Playfair Display, Poppins, Raleway, Lato, Open Sans,
EB Garamond, Space Grotesk — is on those lists *because it is popular*, which is
the exact quality being escaped. Futura PT and Freight Display Pro are also paid
Adobe Fonts requiring a Typekit kit and a CSP change. The type decision is settled;
reopening it is not a good use of a session.

**A `type-lab.astro` comparison page** was built to show four display faces side by
side. Clark never opened it. Applying a change to the real site and screenshotting
it worked; an isolated lab page did not. The file has since been deleted.

---

## Artifacts

| Path / name | Why it matters |
|---|---|
| `claude/favicon-mark` (HEAD `081be01`) | The 5 commits to push. Branch name is stale — no favicon work happened. |
| `safety/globe-experiment-20260730` (HEAD `e2ecc8a`) | The reverted globe timeline/zoom work, preserved intact. |
| `local-work-2026-07-27` (HEAD `63239c5`) | Older preserved branch: Top-Tier Store case study + artifacts, never deployed. `/work/top-tier-store` 404s live. |
| `docs/handoff-chat-to-clarkhayashi-com-2026-07-28.md` | Clark's own publishing procedure. **Read this before pushing.** It mandates scoped commits, `git fetch` first, and task branches off `origin/main`. |
| `docs/CLARK_PORTFOLIO_HANDOVER.md` | Dated 2026-07-15 and **stale**. Describes an 8/9-page build and an open homepage decision. Historical context only. |
| `03_Portfolio Website/UIUX_AUDIT_v2_2026-07-27.md` | Full design audit with measured evidence. Most findings still stand. |
| `03_Portfolio Website/im-analytics/PHASE3_insight_cards.md` | The unpublished intramural findings. 12 ranked cards, real numbers. |
| `public/og-card.png` | New 1200×630 link-preview card, built this session. |
| `~/Desktop/AlbersLogo.png` | Albers School logo Clark supplied. Installed at `public/images/logos/albers.png` **only on the reverted safety branch** — not on `claude/favicon-mark`. |

**Two checkouts of this repo exist and both point at the same origin:**
`~/Desktop/Claude_CoWork/clark-hayashi-portfolio` and
`~/Desktop/CoWork/03_Portfolio Website/clark-hayashi-portfolio` (this one).
Editing `main` in both without fetching is what caused earlier divergence. Always
`git fetch origin` and check `git rev-list --left-right --count HEAD...origin/main`
before starting.

---

## Validation done

- `npx astro build` → 10 pages, no errors.
- All 10 routes return HTTP 200 on the local dev server.
- `grep -rn "—" src` excluding the Duolingo placeholder → 0 prose em dashes. The
  one remaining em dash is `<span id="duo-streak-number">—</span>` in
  `src/pages/side-quests.astro`, a loading placeholder, not copy. Expected steady
  state is 1, not 0.
- `npx -y @google/design.md lint DESIGN.md` → 0 errors, 0 warnings.
- All internal links in built HTML resolve to real files.
- Type scale and colour count re-measured in-browser after the change: 9 sizes,
  15 text colours (was 14 and 20).
- Live `www.clarkhayashi.com` certificate SAN re-checked: still only
  `DNS:clarkhayashi.com`.

**Not verified:** the rendered appearance of `/about` and `/journey` after the
container and type changes. The browser preview pane repainted unreliably for much
of this session; measurements were taken from the DOM instead. Eyeball both pages
before merging.

---

## Constraints

- **Never delete files without explicit permission.** Clark has enforced this
  twice. Archive or overwrite instead. (The two scratch pages removed this session
  were created by the assistant in this session, not Clark's work.)
- **No em dashes in site copy.** Clark does not use them and does not want them.
  Applies to prose written for him as well.
- **Be blunt.** Clark has asked repeatedly for direct, evidence-based feedback and
  has explicitly rejected hedging. Lead with the recommendation.
- **Ask at decision points** rather than assuming, especially where work could be
  lost.
- **Don't push without being asked.** Clark's own handoff doc treats "push",
  "deploy", "ship it" as the authorization words.
- **Astro 5 + Tailwind 4, no JS framework.** Do not add React. The only dependency
  beyond Astro/Tailwind is `d3-geo`, used by the globe.
- `d3-geo` is declared in `package.json` and **was missing from the committed
  lockfile** at one point; it is present now. Vercel runs `npm install`, not
  `npm ci`, which is why production survived. Keep the lockfile in sync.

---

## Open questions

1. **Intramural attribution.** The case study says "Sole analyst" but
   `im-analytics/` contains `Group 5 Final Presentation.pdf`. Clark must confirm
   the correct credit line before those findings are published.
2. **AI-assistance disclosure.** The intramural phase documents were produced with
   Claude as an analytics partner. Given "AI Enablement" is one of Clark's target
   lanes, disclosing this is arguably an asset. Clark has not decided.
3. **Whether the globe experiment gets a second life.** The timeline component in
   `safety/globe-experiment-20260730` solved a real problem (the four-place tab row
   could not reach two of six stops). The zoom work is what failed. Those could be
   separated.

---

## Starter prompt

```
Read docs/handoff-portfolio-external-ready-2026-07-30.md in
~/Desktop/CoWork/03_Portfolio Website/clark-hayashi-portfolio, then
docs/handoff-chat-to-clarkhayashi-com-2026-07-28.md for the publishing procedure.

Objective: get branch claude/favicon-mark (5 commits) onto production, then clear
the four blockers listed in the handoff. Start by confirming which checkout is
active and running git fetch origin to check divergence. I will run the push
myself; you do not have GitHub credentials.
```
