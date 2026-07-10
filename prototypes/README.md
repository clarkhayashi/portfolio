# Prototypes

Archived design concepts kept for reference. These are **not** part of the Astro build.

## portfolio-onepage.html

A self-contained, no-build single-file version of the portfolio (an early
alternative concept). It uses relative `public/…` paths that assume it sits at
the project root, so **it may not render standalone from this `prototypes/`
folder** — images and fonts will 404 unless it is moved back to the root or
served alongside a copy of `public/`.

Kept as a source concept only. The live site is the Astro app in `src/`.
