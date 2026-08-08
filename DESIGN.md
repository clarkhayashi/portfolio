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

Three families sit outside the paper palette. Two are not page surfaces; the
third belongs to a brand that is not Clark's. They are recorded here so that a
colour appearing nowhere in this file stays a real signal of drift.

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

Extended 2026-08-07: that surface may also **tint**. The page sits on a
slightly cooler ground than paper, and each card carries a wash keyed to its
own subject, so the grid stops reading as five identical rectangles. Tints stay
at or under 6% against the card fill, which is enough to separate the cards and
not enough to compete with the ink on them. Every tint is mixed from a colour
already in this file. Glassmorphism is still out, and not only because it is on
the rejected list: `backdrop-filter` needs something behind it to refract, and
over a flat ground it returns the same flat ground. Tint is the honest version
of what glass is usually reached for.

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
