# Dark mode: project scope

Written 2026-08-07. Decision by Clark the same day: dark mode is scoped as its
own project, not bolted on as a widget. This document is the scope. No code was
written for it.

## Status, updated 2026-08-07 later the same day

Clark scoped the MVP to **/side-quests as a pilot route**, with **system
preference plus a toggle**. Phases 1, 3 and 4 are built on that one route and
verified. What is done and what is not:

| | State |
|---|---|
| Phase 1, tokenise | Done **on /side-quests only**. That route's colours all resolve through `--sq-*`. The other 7 files still hold literals. |
| Phase 2, the four hard problems | Ground answered (#14181A). Header has two built candidates and no decision. Zippy's and the atlas untouched, out of pilot scope. |
| Phase 3, dark palette | Done for the pilot route. Zero contrast failures in either theme, floor 4.52 light and 4.54 dark. |
| Phase 4, toggle | Done. Persists to `localStorage`, follows the OS until overridden, inline no-flash script. |
| Phase 5, full audit and images | Done for the 25 text elements on the pilot route. Not done for the other 6 routes or the 54 images. |

**Known gaps on the pilot route**, none of them blocking:

- The Strava embed is a cross-origin iframe and stays light in dark mode. It
  cannot be themed from here, the same constraint recorded in the handoff.
- Dark requires JavaScript. The inline script resolves the theme, and there is
  deliberately no `prefers-color-scheme` CSS fallback, so a no-JS visitor gets
  light. Documented in the page.
- The vendored logo marks are inverted with a CSS filter rather than a second
  set of files, because an SVG loaded through `<img>` will not inherit
  `currentColor`.

## The one-line version

Dark mode is not a toggle, it is a second identity for the site. The site
currently carries **165 hardcoded hex values across 8 files, drawn from 31
distinct colours, of which only 6 are tokens**. Every one of those 165 is a
place where a toggle would do nothing until someone edits it by hand.

## Why it cannot be a widget

Alex Chiu's toggle works because his site was built with two themes from the
start. Ours was built with one, deliberately, and the single paper/ink palette
is load-bearing in `DESIGN.md`. Three specific things break, and none of them
are fixed by adding a `prefers-color-scheme` block.

**The palette is not tokenised.** `src/styles/global.css` defines six tokens.
The other 159 hex occurrences are literals sitting in component and page files.
A theme switch flips tokens. It cannot reach a literal.

**The header is an argument, not a colour.** The denim `#111C29` with its 4px
weave, teal top border and scalloped paper edge exists to read as *a bound cover
over paper*. On a dark ground there is no paper for it to be a cover over. The
header does not get darkened, it gets redesigned, and the redesign has to answer
what the metaphor becomes.

**The globe is a depiction.** The atlas on `/journey` and the homepage stepper
bakes ocean `#112D38`, land `#E9DFC9` and route `#9BD7D4` into canvas drawing
code, six values in total across the two files. A map has to read as land and
water at 460px. On a dark page the ocean is now nearly the page colour and the
land is the brightest thing on screen, which inverts the figure and ground. This
is a cartography problem, not a CSS problem.

## Surface inventory

Measured 2026-08-07, not estimated.

| File | Hex literals | What has to happen |
|---|---|---|
| `src/pages/side-quests/listening.astro` | 64 | Largest single concentration on the site, more than side-quests itself. Tokenise before anything else. |
| `src/pages/side-quests.astro` | 42 | Includes the ground tint, the card lift shadow and the new streak flame. The expressive-surface licence has to be restated for dark. |
| `src/components/JourneyStepper.astro` | 21 | Canvas atlas. See above. |
| `src/pages/work/zippys-growth-strategy.astro` | 20 | Sanctioned second palette for a real brand. Either it gets a dark variant approved by the same logic that approved the light one, or the route opts out of dark entirely. |
| `src/pages/journey.astro` | 7 | Second copy of the atlas colours. |
| `src/styles/global.css` | 6 | The only real tokens. This is the whole current theming surface. |
| `src/components/Header.astro` | 3 | Denim chrome. Redesign, not recolour. |
| `src/components/WaveDivider.astro` | 2 | Straightforward. |

Also in scope and not counted above:

- **54 raster images.** Photographs shot warm and light. They do not stop working
  on dark, but the ones with light backgrounds will halo, and the Duolingo avatar
  had its grey background flood-filled out specifically to sit on paper.
- **The grain overlay.** A 3% fractal noise sits over paper so the paper reads as
  literal. At 3% on a dark ground it is invisible, and at a visible strength it
  reads as noise rather than paper.
- **The streak flame `#C2371F`.** 4.96:1 on paper. On a dark ground it will need
  a lighter sibling, and the whole point of the shade was that it clears AA at
  the normal-text threshold.
- **Every contrast pair on the site.** The current floor is 4.52:1 and it was
  measured by hand. A dark theme is a second full contrast audit, not a rerun.

## The four hard problems

These have no obvious answer and should be decided before any code.

1. **What is the dark ground?** Not black. The light theme's whole argument is
   that paper is never pure white, so the dark theme cannot be pure black without
   contradicting itself. It needs its own justified value with its own reasoning
   in `DESIGN.md`.
2. **What does the header become?** The cover-over-paper metaphor has to be
   replaced with something, and "the same denim but darker" is not it, because
   the denim is already darker than everything.
3. **Does Zippy's follow?** A brand's colours are evidence. Inverting them makes
   them not that brand's colours. The honest options are a dark variant approved
   as its own decision, or that one route stays light and the toggle is disabled
   there with a visible reason.
4. **Does the atlas get a second palette or a second design?** Recolouring a map
   usually fails. It may need different land and water treatment entirely.

## Phasing

Phase 1 and Phase 2 have standalone value even if the project is abandoned after
them. That is the reason to order it this way.

- **Phase 1: tokenise.** Move all 165 literals behind tokens. Zero visual change,
  verified by building before and after and diffing the rendered HTML. This is
  worth doing regardless of dark mode; right now a palette change means editing
  eight files.
- **Phase 2: decide the four hard problems** and write them into `DESIGN.md` with
  their reasoning, the same way the expressive-surface licence and the Zippy's
  exception are recorded.
- **Phase 3: build the dark token set** and the `prefers-color-scheme` default.
  No toggle yet. Respecting the system preference is most of the value and none
  of the state management.
- **Phase 4: the toggle**, with persistence and a no-flash-on-load script.
- **Phase 5: full contrast audit on dark**, plus a pass over all 54 images.

## Cost and the honest argument

Phase 1 alone is a real session. All five phases is days, not hours, and Phase 2
is the one that needs Clark rather than an agent.

**The argument for it:** as a portfolio artifact it demonstrates running one
identity in two ceilings, which is exactly the product design capability Clark is
building toward. The work is legible to anyone who looks, and the reasoning trail
in `DESIGN.md` is arguably a better writing sample than the feature is a feature.

**The argument against it:** no recruiter has ever chosen a candidate because
their site had dark mode. The 165 literals are a real maintenance liability
today, but Phase 1 fixes that on its own without any of the rest.

**If only one phase ever ships, ship Phase 1.**

## What would kill this project

Any of these should stop it rather than be worked around:

- A dark ground that has to go to pure black to make contrast work. That means
  the palette is fighting the design, not extending it.
- The header metaphor having no dark answer that is not simply "a dark bar".
- The atlas needing a wholly separate drawing path, which doubles the
  maintenance cost of the site's most complex component permanently.
