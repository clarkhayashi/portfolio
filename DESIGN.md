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
    fontFamily: Cormorant Garamond
    fontSize: 3.5rem
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: -0.01em
  h2:
    fontFamily: Cormorant Garamond
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.15
  h3:
    fontFamily: Cormorant Garamond
    fontSize: 1.35rem
    fontWeight: 700
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
  label-caps:
    fontFamily: Satoshi
    fontSize: 0.72rem
    fontWeight: 500
    letterSpacing: 0.14em
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
    textColor: "{colors.secondary}"
    typography: "{typography.label-caps}"
  status-dot-building:
    backgroundColor: "{colors.crimson}"
    size: 6px
---

## Overview

Warm editorial minimalism. Premium but personal; recruiter-friendly, not
agency-flashy. Think quality paper stock, generous whitespace, large confident
serif headings, quiet proof. Never lifestyle-blog, never dashboard-cold,
never template-grid. When in doubt, choose calm over loud.

## Colors

- **Primary (#1C1C1C):** Ink. All text, solid buttons, the dark contact card.
- **Secondary (#6B5642):** Bark. Metadata, eyebrows, proof lines, row numbers, captions.
- **Tertiary (#5D8C88):** Teal. Decorative accent: status dots, wave mark, large-text hovers, borders.
- **Tertiary-deep (#4F7773):** Interaction teal. All small-text links, hover fills, and the role eyebrow; meets WCAG AA (4.5:1) on paper.
- **Neutral (#F7F4EF):** Paper. Background everywhere; never pure white. A 3%-opacity fractal-noise grain overlays the page so the paper is literal.
- **Crimson (#8A1538):** Micro-accent only, reserved for the "currently building" status dot. Never large areas.

Text hierarchy comes from ink at opacity steps: 100% headings, 75–80% body,
60–70% supporting, 45–55% metadata.

## Typography

Cormorant Garamond (600/700 + italic 600, Google Fonts) for the wordmark, H1,
H2, section titles, project and role titles. Satoshi (400/500/700,
self-hosted at public/fonts/satoshi/) for everything else. Never Satoshi
Black. Eyebrows are label-caps, uppercase. Reading width tops out at 70ch;
page containers at 1000px. Headings use text-wrap balance; numerals are
tabular. One italic serif accent is allowed per page (currently "messy" in
the hero). **No em dashes anywhere in copy** — use commas, colons, periods,
or "·".

## Layout

Single column, generous vertical rhythm (sections 4.5–6rem apart), hairline
separators at 10% ink. Work items are numbered editorial rows with oversized
ghosted serif numerals (bark at 25%), not cards. Experience rows carry a
uniform 176×112 right-rail visual: photos object-cover, logos object-contain
anchored right. Mobile-first; grids collapse to stacked; breakpoint 768px;
touch targets ≥40px. The wave divider appears at most twice per page.

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
label-caps text: teal for complete/progress, crimson for building, bark for
private/summarized — statuses always tell the truth. Crossfading visuals run
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
