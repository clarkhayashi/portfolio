---
version: alpha
name: Clark Hayashi Portfolio
description: Warm editorial minimalism for a hybrid analyst portfolio. Paper, ink, one quiet teal accent.
colors:
  primary: "#1C1C1C"
  secondary: "#6B5642"
  tertiary: "#5D8C88"
  tertiary-deep: "#4F7773"
  neutral: "#F7F4EF"
  crimson: "#8A1538"
  chrome: "#111C29"
  chrome-rule: "#B84A56"
  chrome-edge: "#DCE7E3"
  globe-ocean: "#112D38"
  globe-land: "#E9DFC9"
  globe-route: "#9BD7D4"
typography:
  h1:
    fontFamily: Zodiak
    fontSize: 3.5rem
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: -0.028em
  h2:
    fontFamily: Satoshi
    fontSize: 2.125rem
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: -0.03em
  h3:
    fontFamily: Satoshi
    fontSize: 1.625rem
    fontWeight: 700
    letterSpacing: -0.022em
  h4:
    fontFamily: Satoshi
    fontSize: 1.125rem
    fontWeight: 700
    letterSpacing: -0.01em
  case-title:
    fontFamily: Satoshi
    fontSize: 2.875rem
    fontWeight: 900
    lineHeight: 1.04
    letterSpacing: -0.028em
  body-lg:
    fontFamily: Satoshi
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.7
  body-md:
    fontFamily: Satoshi
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: Satoshi
    fontSize: 0.8125rem
    fontWeight: 500
  caption:
    fontFamily: Satoshi
    fontSize: 0.75rem
    fontWeight: 500
  micro:
    fontFamily: Satoshi
    fontSize: 0.6875rem
    fontWeight: 500
rounded:
  sm: 8px
  md: 14px
  lg: 16px
  full: 999px
spacing:
  sm: 12px
  md: 24px
  lg: 64px
  xl: 96px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.full}"
    padding: 10px
  button-primary-hover:
    backgroundColor: "{colors.tertiary-deep}"
    textColor: "{colors.neutral}"
  status-dot:
    backgroundColor: "{colors.tertiary}"
    size: 6px
  eyebrow:
    textColor: "{colors.tertiary-deep}"
    typography: "{typography.label}"
  status-dot-building:
    backgroundColor: "{colors.crimson}"
    size: 6px
  site-header:
    backgroundColor: "{colors.chrome}"
    textColor: "{colors.neutral}"
  site-header-active:
    backgroundColor: "{colors.chrome-rule}"
    textColor: "{colors.neutral}"
  site-header-edge:
    backgroundColor: "{colors.chrome-edge}"
    size: 9px
  journey-globe:
    backgroundColor: "{colors.globe-ocean}"
    textColor: "{colors.globe-land}"
  journey-globe-route:
    backgroundColor: "{colors.globe-route}"
    size: 2.4px
---

## Overview

Warm editorial minimalism. Premium but personal; recruiter-friendly, not
agency-flashy. Think quality paper stock, generous whitespace, confident
Satoshi 900 headings with one rare serif moment per page, quiet proof. Never
lifestyle-blog, never dashboard-cold, never template-grid. When in doubt,
choose calm over loud.

## Colors

- **Primary (#1C1C1C):** Ink. All text, solid buttons, the dark contact card.
- **Secondary (#6B5642):** Bark. Metadata, eyebrows, proof lines, row numbers, captions.
- **Tertiary (#5D8C88):** Teal. Decorative accent: status dots, wave mark, large-text hovers, borders.
- **Tertiary-deep (#4F7773):** Interaction teal. All small-text links, hover fills, and the role eyebrow; meets WCAG AA (4.5:1) on paper.
- **Neutral (#F7F4EF):** Paper. Background everywhere; never pure white. A 3%-opacity fractal-noise grain overlays the page so the paper is literal.
- **Crimson (#8A1538):** Micro-accent only, reserved for the "currently building" status dot. Never large areas.

Four families sit outside the paper palette. Two are not page surfaces; the
other two belong to brands that are not Clark's. They are recorded here so that
a colour appearing nowhere in this file stays a real signal of drift.

- **Chrome (#111C29 denim, #B84A56 rule, #DCE7E3 edge):** the site header only.
  A cool near-black denim with a fine 4px weave, a teal top border, a scalloped
  paper edge, and a dusty rule under the active nav item. Deliberately *not*
  ink: the header reads as a bound cover over the paper, and matching ink would
  flatten it into the contact card. Crimson at full strength was too loud for a
  1px underline that sits on every page, hence the softer #B84A56. Nothing
  outside the header may use these.
- **Globe (#112D38 ocean, #E9DFC9 land, #9BD7D4 route):** the canvas atlas on
  /journey and the homepage stepper only. A map is a depiction, not chrome, and
  it needs land and water to read as land and water at 460px. The route teal is
  brightened from decorative teal so a 2.4px line survives on the dark ocean.
- **Zippy's (`--z-*` in src/pages/work/zippys-growth-strategy.astro):** that one
  route, and nothing else, ever. A campaign case study wears its subject's
  colours for the same reason the imagery rule asks every photo to be about the
  thing beside it: the palette is evidence, not decoration. Sanctioned by Clark,
  2026-08-06. Two conditions hold it in place. Every label still has to clear
  WCAG AA on its own ground, brand colour or not, and the type rules are not
  part of the exception: no tracked uppercase there either, because letter
  spacing is a generic editorial device and not something Zippy's owns.

- **Streak flame (#C2371F):** the Duolingo card on /side-quests, and nothing
  else. Sanctioned by Clark, 2026-08-07, on the same reasoning as Zippy's: a
  streak is Duolingo's own idea and the flame is how Duolingo draws it, so the
  colour is evidence rather than decoration. Scoped to the streak number and
  the flame glyph beside it. It is 4.96:1 on paper, so it clears WCAG AA at the
  normal-text threshold and not merely the 3:1 large-text one, which is why this
  shade and not a brighter one. Two conditions. The streak *label* under the
  number stays interaction teal: 13px sentence-case labels are one shared spec
  across the whole site and a second colour there would break the pattern for no
  gain. And it never spreads to a second card, a border, or a fill. Duolingo's
  own #FF9600 is 1.99:1 on paper and fails even the large-text floor, so the
  brand colour is quoted rather than copied. A previous pass used #e2472f at
  3.70:1, which passes for large text only and would have made it the least
  legible thing on the page; do not reinstate it.

- **Dark pilot (#14181A ground, #1F2527 card, #8FC7C2 link, #9BD7D4 accent,
  #FF9600 streak):** `/side-quests` only, sanctioned by Clark 2026-08-07 as a
  scoped pilot. Full reasoning and phasing in
  `docs/dark-mode-scope-2026-08-07.md`. Three things are settled and should not
  be re-litigated without reading that document.

  The ground is #14181A and **not black**, for exactly the reason paper is not
  white: a flat neutral extreme is what the light palette already refuses, and
  a dark theme that reaches for #000 contradicts the argument it inherits.

  The streak number is Duolingo's own **#FF9600** here. That colour is 1.99:1 on
  paper and was rejected outright for the light theme; on the dark card it is
  7.11:1. The brand colour that could not be used in light is the correct one in
  dark, and the light theme keeps #C2371F.

  **The header inverts** rather than merging. On dark it becomes the paper
  surface with ink type at 15.53:1, and its scalloped edge is restroked to
  #14181A so the teeth read as the dark page biting up into a paper band. The
  denim reads as a bound cover over paper, and on a dark ground there is no
  paper for it to cover; inverting which side is paper is what keeps the
  metaphor rather than abandoning it. The alternative, letting the header
  dissolve into one continuous dark surface, was built, compared on screen and
  rejected by Clark. Do not rebuild it.

  Every text element on the route clears WCAG AA at the normal-text threshold in
  both themes: 25 elements, zero failures, floor 4.52:1 light and 4.54:1 dark.

Everything else on every page comes from the six paper colours above.

Text hierarchy comes from ink at opacity steps: 100% headings, 75–80% body,
70% supporting, 65% metadata. 65% ink is the floor for any text that carries
information: it is the lowest step that passes WCAG AA (4.5:1) on paper.
Small bark text is full-strength bark for the same reason; bark tints below
90% are reserved for decoration (ghost numerals at 25%).

## Typography

Three layers, all self-hosted, all Indian Type Foundry, no external font
requests (rebrand decision by Clark, 2026-08-04; replaced Newsreader + static
Satoshi). **Core** is Satoshi variable (300–900 roman + drawn italic,
public/fonts/satoshi/): display, headings, body, labels, captions, data.
Headings are Satoshi 900 with tight tracking; the old "never Satoshi Black"
rule guarded the retired serif-display identity and died with it. **Voice** is
Zodiak 700 + italic (public/fonts/zodiak/): exactly one moment per page, the
page title, or one pull statement, or the finding number, never two on the
same screen. **Accent** is Bespoke Slab 700 (public/fonts/bespoke-slab/),
scoped to the intramural case study only, recorded in its front matter
(`accent: slab`); ceiling of three accents site-wide, ever. Dark surfaces
(header, contact card) use Core only.

The scale is nine steps and no more, desktop: 56 / 46 / 34 / 26 / 18 / 16 /
13 / 12 / 11 (mobile page titles drop to 34, sections to 26, row titles to
20). Sizes closer together than that are not perceived as a rank, they just
read as inconsistency. Line height is inversely proportional to size, tight
on display, open on body.

Tracking is four steps and no more, tightening as size grows: 34 and above
take -0.03em, 46 and 56 take -0.028em (Zodiak is a serif, and serifs bridge
letters on their own, so display tightens less than the sans does, not more),
26 takes -0.022em, 18 and below take -0.01em. Values between these steps read
as sloppiness rather than as a rank, the same way in-between sizes do.

Labels and eyebrows are sentence case, Satoshi 500
at 13px, interaction teal: no tracked uppercase anywhere. Nothing on any
surface goes below 11px. Any display line containing an italic descender gets
line-height 1.12 minimum.

Reading width tops out at 70ch; page containers at 1000px, including About.
Headings use text-wrap balance. Numerals are tabular only in stats and
tables, not in running prose. One italic serif accent is allowed per page
(currently "messy" in the hero). **No em dashes anywhere, in copy or in this
document.** The rule used to be stated with the character it bans. Use
commas, colons, periods, or "·".

## Layout

Single column, generous vertical rhythm (sections 4.5–6rem apart), hairline
separators at 10% ink. Work items are numbered editorial rows with oversized
ghosted Satoshi 900 numerals (bark at 25%), not cards. Experience rows carry a
uniform 176×112 right-rail visual: photos object-cover, logos object-contain
anchored right. Work rows carry a 19rem right rail holding the status label
above an optional 16:10 artifact thumbnail. That rail is a fixed width, not
auto, so thumbnails align down the list; a row with no real artifact shows the
status alone and never a stand-in. Mobile-first; grids collapse to stacked;
breakpoint 768px; touch targets ≥40px. The wave divider appears at most twice
per page.

## Elevation & Depth

Essentially flat. Hairlines and rounded corners carry structure. No drop
shadows, no glassmorphism, no gradients, no WebGL.

One exception, sanctioned by Clark on 2026-08-07. **/side-quests is an
expressive surface**, the way /journey already holds the site's loud license.
Its cards may lift on hover and carry a soft shadow, because the page is a
grid of things worth touching rather than a document to read, and because
Clark is deliberately building toward product design work and this is the one
surface on the site where interface craft can show. The conditions are narrow:
the shadow is mixed from ink and never pure black on paper, the lift stays at
or under 3px, motion stays under 300ms on the shared --ease-out curve, and none of it
leaves that route. Everything else on the site stays flat. A future session
finding a shadow there has found a decision, not drift.

Extended 2026-08-07, then **reversed the same day by Clark**. The tinted ground
is gone. /side-quests sits on plain paper like every other page, and its cards
are lifted 50% toward white to #FBFAF7. The separation comes from the cards
being lighter than the page, not from the page being darker than the cards.

The tint that was here, 13% teal mixed into paper, failed on both counts a
colour has to pass. It resolved to #E3E7E2, which is not teal but neutral grey:
13% of a muted teal into a warm off-white cancels the warmth, on a site whose
entire palette argument is that paper is warm and never white. And it broke
contrast. The subtitle italic is interaction teal at 18px regular sitting
directly on that ground, which measured **3.95:1 and failed WCAG AA**. The
session that shipped the tint recorded a page-wide floor of 4.52:1, so its
audit did not catch this element.

**Lightening a card works where darkening one fails, and only darkening had
been tried.** Every step toward white raises the contrast of everything sitting
on the card, rather than eating the small headroom interaction teal has:

| | before | after |
|---|---|---|
| interaction teal on card | 4.54 | 4.77 |
| streak flame on card | 4.96 | 5.21 |
| subtitle italic on ground | 3.95 FAIL | 4.54 PASS |

Measured across all 25 text elements on the route: zero failures, floor 4.52:1.

Per-card tints **darker** than paper were tried at 6%, 3% and 2% and removed at
every level, because a 2% tint dropped the action links to 4.40:1. That dead end
still stands. It is the direction that was wrong, not the idea of moving the
cards.

Glassmorphism is still out, and not only because it is on the rejected list:
`backdrop-filter` needs something behind it to refract, and over a flat ground
it returns the same flat ground. A tinted ground is the honest version of what
glass is usually reached for.

## Shapes

Buttons are pills ({rounded.full}). Images and tiles use {rounded.sm} to
{rounded.md}. The wave mark uses uneven, hand-drawn crests, never a perfect
sine.

## Components

The site header is the one piece of chrome: denim {colors.chrome} with a fine
4px weave, a 3px teal top border, a scalloped {colors.chrome-edge} bottom edge,
and a {colors.chrome-rule} hairline under the active nav item. Core type only,
nav at 13px sentence case. It carries no serif and no page content.

One solid button per view (ink, teal on hover); all other actions are ghost
buttons (25% ink border, teal on hover). Status labels are a 6px dot plus
sentence-case label text: the dot is teal for complete/progress, crimson for
building, bark for private/summarized. Statuses always tell the truth.
Crossfading visuals run
8s (2 images) or 16s (4 images), linear timing, aligned fade windows, logo
first, honoring prefers-reduced-motion. Maximum ~4 animated tiles per page.
Exception: /journey holds the site's single loud license, a scroll-driven
canvas atlas globe with progressive route drawing. It still obeys palette,
type, voice, reduced-motion, and the no-WebGL rule.

## Do's and Don'ts

Do: honest statuses, real numbers, third-party proof links, alt text on every
image, quiet motion, plain warm voice. Don't: parallax, Lottie, custom
cursors, skill bars, tool-logo walls, emoji, testimonial carousels, fake
results, stock imagery, "Welcome to my portfolio", AI-slop aphorisms (no
"X taught me Y" triads, no applause-line sentence endings).

## Agent Notes

New content goes through the data files (src/data/*.ts), never hardcoded in
layouts. Match the voice: plain, specific, warm, zero hype. This file follows
the DESIGN.md alpha spec; validate with `npx @google/design.md lint DESIGN.md`.
