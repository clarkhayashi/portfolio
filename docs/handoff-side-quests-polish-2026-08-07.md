# Handoff: Side Quests polish and the two decisions blocking it

Written 2026-08-07. Repo: `/Users/clarkhayashi/Desktop/CoWork/01_Career/Portfolio_Site/clark-hayashi-portfolio`

## Objective

**Inferred, not stated by Clark. Correct this if wrong.** Finish the `/side-quests`
visual pass. Clark's reference is Alex Chiu's portfolio at `https://mchiu.co.uk`
and his repeated complaint is that his cards feel emptier and flatter than
Alex's.

Done looks like: Clark stops asking for the page to feel denser. Two named
decisions below are blocking real progress and should be put to him before any
more CSS is written.

## Current state

Everything described here is **pushed to `main` and live on clarkhayashi.com**.
Working branch is `claude/work-thumbnails`, which tracks `origin/main` and is
level with it. Zero unpushed commits. Only `.claude/` is untracked, deliberately.

Shipped and verified on `/side-quests`:

- Cursor-following speech bubble (`#quest-tooltip`), teal `#4F7773`, 8px radius,
  8px/16px padding, 16px/500 type, `white-space: pre-line` so `\n` in a
  `data-tooltip` becomes a real second line. Eases toward the cursor at 0.12 per
  frame, types in at 7ms per character. Both collapse under
  `prefers-reduced-motion`.
- Same strings render as `.card-reveal` inside each card under `(hover: none)`,
  because a cursor bubble cannot fire on a phone and that copy was previously
  invisible to every mobile visitor.
- Grid is `duo + notes` / `spotify + github` / `strava` full-bleed. The Strava
  card sits last in the DOM; that is load-bearing, see Dead ends.
- Ground is 13% teal mixed into paper; cards are plain paper and lift ~0.12
  luminance off it.
- Duolingo, Spotify and Strava marks vendored to `public/images/logos/`, 40px,
  0.55 opacity, `aria-hidden`.
- Every text element on the page clears WCAG AA. Lowest is 4.52:1.

Impeccable detector: **64 findings, zero non-advisory** (was 91 with one warning
at session start). Remaining are advisory font-size and radius values, 36 of
them inside `src/pages/work/zippys-growth-strategy.astro`, which is a sanctioned
exception.

**Not done:** the two decisions in Open questions. Also `Reading Notes` is the
only card with no service mark.

## Next steps

1. **Put the two Open questions to Clark.** Both need him, and both change what
   gets built. Do not start CSS before this.
2. **If he overturns the emoji ban:** amend `CLAUDE.md:162` explicitly (it lists
   emoji alongside skill bars and tool-logo walls), then build the streak
   treatment. The visual weight in Alex's card is the large bold orange number,
   not the emoji; build that either way.
3. **If he wants dark mode:** scope it as its own project, do not bolt a toggle
   on. See Dead ends for what it actually touches.
4. **Tell him the density gap is content, not CSS.** Alex's cards are filled
   with custom illustration and product screenshots. Clark's hold a streak
   number, a book link and an hours count. More layout work will not close it;
   his own photographs would.

Unrelated and still parked on Clark from earlier in the session:

- **The Seattle U article is unarchived.** `https://www.seattleu.edu/newsroom/2026/experience-by-doing.php`
  is the only `.edu` source for the Bank of Hawaii work and the Japanese minor,
  it is cited in `src/data/person.ts` and linked by name from About, and its URL
  is year-partitioned. Wayback accepted the save twice and both times captured
  its own error page, then deduplicated against that empty capture. Needs a
  logged-in archive.org save or archive.today.
- **Bing Webmaster Tools.** Needs Clark's login. ChatGPT's search runs on Bing,
  and across three ChatGPT research passes clarkhayashi.com was never cited once
  despite ranking on Google page one with sitelinks.

## Decisions made

| Decision | Reason | Status |
|---|---|---|
| `/side-quests` is a licensed expressive surface | Clark asked for "flex", said he does not want to "be boring and flat all the time", and is deliberately building toward product design work | Confirmed by Clark. Recorded in `DESIGN.md` around line 220 |
| Tint the ground, not the cards | Interaction teal is 4.98:1 on paper, almost no headroom. Any card tint pushed action links under AA | Working decision, forced by measurement. Recorded in `DESIGN.md` |
| Zippy's keeps its own palette as a third sanctioned family | It is a campaign case study for a real brand; the palette is evidence | Confirmed by Clark. `DESIGN.md` line 146 |
| Site stays light-only for now | `DESIGN.md` is a deliberate single paper/ink palette | Working assumption, now under challenge, see Open questions |
| Homepage keeps "an initiative **that won** $22.5K" | Seattle U's own article names six representing students and Clark is not among them. The initiative won; he co-founded it. Both halves true | Confirmed. Guard written into `CLAUDE.md:75` so nobody "tightens" it into a first-person claim |
| Keep "Intramural Sports Manager" over "Competitive Sports Manager" | The Spectator uses the department's internal branding; "intramural" is what recruiters know | Confirmed by Clark |
| Dash check runs perl against built HTML, not grep against `src/` | Grepping `src/` missed em dashes living in DESIGN.md and CLAUDE.md for months. Two different grep forms then gave two different wrong answers | Recorded in `CLAUDE.md:223` with the reasoning |

## Dead ends

Highest-value section. Do not repeat these.

**Per-card tints.** Tried at 6%, 3% and 2%. Every level dropped the
`.card-action` links below WCAG AA (4.23, then 4.40 at the lightest). At a tint
pale enough to pass, the colour was not visible. Root cause: interaction teal
`#4F7773` is 4.98:1 on paper, so it has 0.48 of headroom and any darkening of
the card eats it. **Tint the ground instead.**

**Glassmorphism / "Apple liquid glass".** Clark asked for it directly. Two
reasons it did not ship. It is on the rejected list in `CLAUDE.md:190` by name,
and more importantly `backdrop-filter` needs something behind it to refract;
over a flat paper ground it returns the flat paper ground. You would take the
constitution violation and get none of the effect.

**Both Strava athlete widgets.** Clark supplied two iframe URLs
(`activity-summary` and `latest-rides`). Both answer `301 → /login` and send
`X-Frame-Options: SAMEORIGIN`. They cannot be framed from clarkhayashi.com at
all and render as "This content is blocked". That is Strava's header; no CSP
change on our side helps. Only the `strava-embeds.com` per-activity embeds
already on the card are frameable. There is a comment in `side-quests.astro`
saying do not re-add them. **I shipped one of these having only checked the
iframe fired a `load` event, which it does even for a redirect to a login page.
Run a `HEAD` request before trusting any embed.**

**In-card reveal replacing the bubble.** I removed the existing cursor tooltip
and replaced it with a paragraph inside each card. Wrong on two counts: Clark
wanted the bubble, and `.card-action` is absolutely positioned so the paragraph
landed on top of it. The bubble was restored; the in-card paragraph survives
only under `(hover: none)`.

**`currentColor` on `<img>`-loaded SVGs.** Does not inherit. An SVG loaded
through `<img>` is its own document. The vendored marks have their fill baked to
ink and CSS dims them with opacity.

**`loading="lazy"` on the marks.** All three reported `naturalWidth: 0`. On
files of 249 to 3012 bytes it buys nothing and costs a round-trip. Removed.

**Dark mode as a widget.** Alex's toggle works because his whole site has a dark
theme. A real toggle here touches: every colour token, the globe atlas (three
baked hex values in `JourneyStepper.astro` and `journey.astro`), the denim
header (it reads as *a cover over paper*, which is meaningless on dark), photo
selection, and Zippy's second palette. It is a project, not a card.

## Artifacts

| Path | Why it matters |
|---|---|
| `src/pages/side-quests.astro` | The whole page. ~1100 lines, markup + script + scoped style in one file |
| `DESIGN.md` | Visual constitution. Expressive-surface licence near line 220; Zippy's palette exception line 146. Must lint clean: `npx -y @google/design.md lint DESIGN.md` |
| `CLAUDE.md` | Project constitution. Emoji ban line 162; rejected directions line 190; dash-check procedure line 223 |
| `src/data/person.ts` | Person JSON-LD: `image`, `knowsAbout`, `hasCredential`, two `subjectOf` articles |
| `public/images/logos/{duolingo,spotify,strava}.svg` | Vendored from Simple Icons, fill baked to `#1C1C1C` |
| `public/duolingo-clark.svg` | Avatar. Grey `#E5E5E5` background removed by edge flood fill; 23.5KB → 7.6KB |
| `https://mchiu.co.uk` | Clark's reference. His bubble is `.cursor-tooltip`, worth re-reading its CSSOM |

Session commits: `128278a..8eff28f`, 24 commits, all pushed.

## Validation done

- `npx astro build`. 11 pages, clean, after every change.
- `npx -y @google/design.md lint DESIGN.md`. 0 errors, 0 warnings.
- Dash check. Zero em or en dashes in all 11 built pages and in both governing
  documents. Command is in `CLAUDE.md:223`; verify it can still fail by seeding a
  scratch file.
- Contrast. Computed in-browser across every text element on `/side-quests`.
  Zero failures, minimum 4.52:1.
- Bubble, keyboard and touch paths. Verified by dispatching synthetic
  `PointerEvent`s and reading computed styles.
- **Not verified:** what the Strava per-activity embeds actually render. They are
  cross-origin iframes and cannot be inspected.

## Constraints

**Environment gotchas that will waste your time otherwise:**

- The browser pane is usually hidden. **CSS transitions freeze mid-flight and
  screenshots come back blank.** Do not trust `getComputedStyle` on a
  transitioning property. Inject `*{transition:none!important}` first, or read
  the inline style, or dispatch synthetic events and measure geometry.
- **Do not poll clarkhayashi.com with curl.** I hit it every 10s for 7 minutes
  waiting on a deploy and tripped **Vercel's bot protection**; every `curl` then
  got a 403 "Security Checkpoint". Real browsers pass it. Use the browser tools,
  or a single long wait.
- `.claude/launch.json` at the CoWork root had stale paths. The `portfolio` entry
  is fixed; `once` and `tasuke` still point at `08_Once` / `08_Tasuke` and should
  be `03_Builds/…`.

**Clark's stated preferences, from this session:**

- Hates slop and spots it. He flagged two sentences himself and was right both
  times. Sharpen **his** wording; never bolt on a hook.
- No em dashes anywhere. No emoji. No "X teaches you Y" constructions.
- Wants blunt assessment, not agreement. He responds well to being told
  something will not work and why.
- Open to overturning his own constitution, but wants the amendment written down
  rather than the rule quietly broken.

**Never:** delete files in this workspace (permission denied twice
historically), force-push, run impeccable's `new-work` or `document` in this
repo (both replace `DESIGN.md`).

## Open questions

Both block meaningful progress on the objective.

1. **Does the 🔥 emoji get an exception?** Clark asked to copy Alex's fire-emoji
   streak. `CLAUDE.md:162` bans emoji outright and the site currently has none.
   The large bold orange number can be built regardless; only the glyph needs a
   ruling.
2. **Is dark mode a real project?** Clark asked for a "dark mode widget". It
   cannot be a widget. Ask whether he wants it scoped as its own piece of work,
   and note the honest argument for it: as a *portfolio artifact* demonstrating
   he can run one identity in two ceilings, it earns its cost. As a feature for
   recruiters, it does not.

---

## Starter prompt

```
Read docs/handoff-side-quests-polish-2026-08-07.md in
/Users/clarkhayashi/Desktop/CoWork/01_Career/Portfolio_Site/clark-hayashi-portfolio.

Objective: finish the /side-quests visual pass. Before writing any CSS, put the
two Open questions to me (the fire emoji exception, and whether dark mode becomes
its own project). Read the Dead ends section first so you don't retry per-card
tints, glassmorphism, or the Strava athlete widgets.
```
