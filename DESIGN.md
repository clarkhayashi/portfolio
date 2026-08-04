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
rounded:
  sm: 8px
  md: 16px
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
Zodiak 700 + italic (public/fonts/zodiak/): exactly one moment per page — the
page title, or one pull statement, or the finding number, never two on the
same screen. **Accent** is Bespoke Slab 700 (public/fonts/bespoke-slab/),
scoped to the intramural case study only, recorded in its front matter
(`accent: slab`); ceiling of three accents site-wide, ever. Dark surfaces
(header, contact card) use Core only.

The scale is nine steps and no more, desktop: 56 / 46 / 34 / 26 / 18 / 16 /
13 / 12 / 11 (mobile page titles drop to 34, sections to 26, row titles to
20). Sizes closer together than that are not perceived as a rank, they just
read as inconsistency. Line height is inversely proportional to size, tight
on display, open on body. Labels and eyebrows are sentence case, Satoshi 500
at 13px, interaction teal: no tracked uppercase anywhere. Nothing on any
surface goes below 11px. Any display line containing an italic descender gets
line-height 1.12 minimum.

Reading width tops out at 70ch; page containers at 1000px, including About.
Headings use text-wrap balance. Numerals are tabular only in stats and
tables, not in running prose. One italic serif accent is allowed per page
(currently "messy" in the hero). **No em dashes anywhere in copy** — use
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

## Shapes

Buttons are pills ({rounded.full}). Images and tiles use {rounded.sm} to
{rounded.md}. The wave mark uses uneven, hand-drawn crests, never a perfect
sine.

## Components

One solid button per view (ink, teal on hover); all other actions are ghost
buttons (25% ink border, teal on hover). Status labels are a 6px dot plus
sentence-case label text: the dot is teal for complete/progress, crimson for
building, bark for private/summarized — statuses always tell the truth. Crossfading visuals run
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
