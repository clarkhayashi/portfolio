# The Journey Page · Improved Prompt (canonical spec)

Act as my senior front-end developer, motion designer, and editor. Build
/journey: an interactive, scroll-driven story page that traces my life and
work across the world on a hand-drawn atlas globe. It is the site's single
"loud" page: more motion and drama are licensed here, but every brand rule
in DESIGN.md still applies (palette, type, voice, no em dashes, honest tone).

## Locked decisions
- Globe form: SVG/canvas orthographic "atlas plate" globe. Ink coastlines on
  paper, teal-deep route arcs, crimson dot only for the current stop. No
  WebGL, no textures, no space-dark background, zero external JS libraries.
- Interaction: scroll story is the spine. A pinned globe rotates to each stop
  as its chapter scrolls into view; the route draws progressively. A stop
  index (01-05) is always visible and clickable as shortcuts.
- Mobile: adapted experience. Globe pinned smaller at the top, chapters
  scroll beneath. Same story, tuned layout, touch targets >=40px.
- Placement: its own page at /journey, linked from the header nav and from
  Rooted Perspective on /about.
- It ships as Selected Work item 07 (Visual Communication lane), with an
  honest proof line: zero libraries, hand-written canvas math.

## The route (the story is a loop, not a line)
01 Honolulu 2004-2022 -> 02 Seattle 2022 -> 03 Tokyo 2024 ->
04 Sansepolcro 2025 -> 05 Honolulu, again (BOH AI internship, Summer 2025)
-> epilogue: Seattle, now. Coming home as chapter five is the point:
the journey ends where it started, with something to give back.

## Each chapter shows
- Eyebrow (STOP 01 · HONOLULU), serif chapter title, years on the arc.
- 2-4 sentences of story in my voice: plain, specific, warm, zero hype,
  no aphorism triads, no em dashes.
- One real photo from public/images (prefer benched photos over ones already
  used in the About gallery).
- Small teal links to the related experience (About page or external).

## Globe rendering spec
- Canvas 2D, devicePixelRatio-aware, sized to its container, square.
- Orthographic projection; graticule every 20 degrees at ink/15.
- Real coastlines: world-atlas land-110m TopoJSON fetched at runtime from
  jsDelivr, decoded inline (~25 lines, no topojson library). If the fetch
  fails, the globe still renders graticule + route + stops gracefully.
- Coastlines stroked (etched look), never filled; ink at ~30%.
- Route arcs: great-circle slerp, teal-deep, drawn progressively; the
  traveled route stays solid, the active leg animates in (~1s).
- Stops: teal dots; the active stop is crimson with a soft pulse; serif
  labels with bark year captions.
- Rotation eases toward the active stop (shortest angular path); no easing
  jank, single requestAnimationFrame loop.

## Accessibility and performance budget
- prefers-reduced-motion: rotation jumps instantly, no arc animation, no
  pulse. Content order works read top-to-bottom without the globe.
- All photos have real alt text. Stop index buttons are real buttons.
- Page JS < 10KB hand-written; only network extra is the land TopoJSON
  (~100KB, cached). No layout shift: canvas container reserves space.

## Don'ts
No WebGL, no three.js/globe.gl, no scroll hijacking (native scroll only),
no autoplay sound, no gradients/glow, no dark-space aesthetic, no fake
stops I haven't lived, no invented dates.

## Acceptance
Astro build passes; globe rotates through all six beats; stop index jumps
work; mobile layout keeps globe visible while reading; reduced-motion
verified; work item 07 appears on home and /work; header nav includes
Journey; DESIGN.md records the loud-page license.
