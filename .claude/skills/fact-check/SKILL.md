---
name: fact-check
description: Consistency gate for Clark's site copy and resume. Run BEFORE shipping any change to site content (src/data/*.ts, src/pages, prototypes/*.html) or before replacing public/resume.pdf, and any time Clark asks "is the site/resume consistent", "fact check", or "/fact-check". Blocks any change that would make a fact right in one place and wrong in another.
---

# Fact-check gate

Purpose: enforce the CLAUDE.md rule that "a fact is never allowed to be right
in one file and wrong in another." This skill does not write copy. It audits,
reports, and blocks.

## When invoked

Run the full audit below and end with a verdict: **PASS** (ship it) or
**BLOCK** (list every mismatch). If auditing a proposed change, check the
change against every source; if run standalone, check all sources against
each other.

## Sources to load, in authority order

1. `CLAUDE.md` sections "Verified chronology", "Settled facts", "Writing
   standards". These are settled by Clark and outrank everything below.
   If any other file contradicts them, that file is wrong.
2. `public/resume.pdf` (extract text with `pdftotext` or Read).
3. `src/data/experience.ts`, `projects.ts`, `lanes.ts`, `journey.ts`.
4. Rendered copy in `src/pages/` and `src/components/`.
5. `prototypes/portfolio-onepage.html`, `prototypes/journey.html`,
   `prototypes/portfolio-journey-experiment.html`.

## Checks

### 1. Number sweep

Extract every number from every source (dollar amounts, counts, years, GPA)
and diff them across sources. Known-correct anchors:

- GPA 3.71, Magna Cum Laude, class of 2026
- SUCUI: $20K Harriet Stephenson + $2.5K eBay prize = $22.5K total,
  174-team field, membership 23 to 54
- BOH: 50+ use cases, 19+ interviews, readout to 60+
- UREC: 40+ officials, 64+ teams, 469+ participants, 7 years of data
- Punahou Carnival: $337K raised
- Hui o Nani: "audience of 300+" (never "300+ participants")
- Tokyo Airbnb: 25,000+ listings, solo project

Any number appearing in one source but differing in another is a BLOCK.
A number missing from one version is fine; a conflicting number is not.

Known false positives to skip (verified 2026-07-25): numbers inside SVG
`path d="..."` data and other markup attribute values are coordinates, not
claims; the standalone em-dash glyph in `side-quests.astro`'s streak span
is a JS-replaced placeholder, not copy. Always read the surrounding context
of a raw grep hit before reporting it.

### 2. Chronology sweep

Verify no source implies an order contradicting the settled sequence:
Honolulu 2004-2022 → Seattle 2022 → Tokyo spring/summer 2024 →
Honolulu summer 2025 (BOH) → Sansepolcro September 2025 (Italy) →
Seattle 2026 (graduation). The BOH internship precedes the Italy tour;
this regressed once before, so check it explicitly every run.

### 3. Titles and phrasing traps

- SUCUI: "Co-founder & COO, 2024 to present". Never "VP of Finance",
  never an "→ Advisor" suffix.
- UREC: "Intramural Sports Official → Manager", 2022-2026.
- Punahou: basketball co-captain and Most Inspirational Player
  (basketball, never golf).
- Education: "Dean's List and President's List" (never "multiple-time
  Dean's List"); no "June 2026" attached to the degree.
- LinkedIn URL is exactly linkedin.com/in/clark-hayashi.

### 4. Style gate (site copy only, not the PDF)

- No em dashes anywhere in site copy. Grep all copy sources for the
  em dash character; any hit is a BLOCK.
- No banned patterns: "Welcome to my portfolio", "X taught me Y" triads,
  invented metrics, emoji in copy.
- Max one italic serif accent per page.

### 5. Resume drift

Diff the resume's factual claims against site copy. The resume was
fact-checked against the site at install time (2026-07-10); if either side
changed since, every shared claim must still agree. If Clark supplies a new
resume PDF, run this entire audit before overwriting `public/resume.pdf`,
and never overwrite until it passes.

## Report format

End with one of:

- `PASS: N claims checked across M files, no mismatches.`
- `BLOCK:` followed by a table of mismatches: claim, file A value
  (with path), file B value (with path), and which one authority order
  says is correct. Do not fix anything unless Clark asks; the gate's job
  is to stop the ship, not to rewrite.

If a mismatch is found in CLAUDE.md itself against something Clark has
said more recently in conversation, flag it for Clark rather than assuming
either is right: settled facts change only by his confirmation.
