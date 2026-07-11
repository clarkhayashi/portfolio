# Prototypes

Standalone HTML files, not part of the Astro build. All three use
`../public/...` relative paths, so they render by double-clicking **as long
as they stay in this folder** next to the project's `public/` directory.
(An earlier version of this README claimed the opposite; that was stale.)

## portfolio-onepage.html
Self-contained one-page version of the full site (no build step). Kept in
content sync with the Astro site.

## journey.html
Standalone version of the /journey page: scroll-driven atlas globe,
coastlines fetched at view time from jsDelivr (needs internet once).

## portfolio-journey-experiment.html
2026-07-10 product-design experiment: journey globe integrated into the
homepage as a stepper (no scroll hijack), redesigned globe (sage ocean,
stippled land), trimmed hero/CTAs, and a trial type system
(Archivo / Fraunces / IBM Plex Sans). Pending Clark's adopt/reject decision;
see `docs/CLARK_PORTFOLIO_HANDOVER.md`.

The live site remains the Astro app in `src/`.
