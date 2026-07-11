---
layout: ../../layouts/CaseStudy.astro
title: "Finding the Best Value Stays in Hawai'i"
summary: "What ~36,000 Hawai'i Airbnb listings — compared against average hotel rates — reveal about where visitors actually find value, island by island."
tags: ["Tableau", "Data Visualization", "Team Case Study"]
statusLabel: "Completed · artifacts publishing"
statusType: "progress"
---

<!--
SUPERSEDED 2026-07-10 — published to src/pages/work/hawaii-value-stays.md
with Clark's answers: Inside Airbnb dataset; reframed as Clark's own separate
build (inspired by the class original, no team credit per Clark); Reflection
drafted for his review; Recommendations pending his tweak. This file is kept
as source material per the never-delete rule.

Original draft header follows:
DRAFT — lives in drafts/, not src/pages/work/. Nothing on the site changes
until Clark moves this file and adds the projects.ts entry below.

Every number in this draft traces to the BUAN 4220 memo or deck
(archive/hawaii-airbnb-buan4220/). Items in [brackets] need Clark's
confirmation before publishing — do not publish with brackets intact.

projects.ts entry (add when ready, suggested position: after Seattle
Building Permit, before Real Estate):

  {
    title: "Finding the Best Value Stays in Hawai'i",
    description:
      "Airbnb vs. hotel value across the Hawaiian islands: ~36,000 listings, island and neighborhood pricing, ratings, and zoning context, built into an interactive Tableau dashboard with a two-person team.",
    tags: ["Tableau", "Data Visualization", "Team Case Study"],
    lane: "Analytics + Data",
    proof: "~36,000 listings · 2-person team · interactive dashboard",
    href: "/work/hawaii-value-stays",
    statusLabel: "Completed · artifacts publishing",
    statusType: "progress",
  },
-->

## Overview

A data visualization project examining where visitors actually find value in Hawai'i: Airbnb or hotels, and on which islands and neighborhoods. Built with Jayden Respicio as a two-person team for a Data Visualization course (BUAN 4220), using a ~36,000-listing Hawai'i Airbnb dataset compared against average hotel rates.

## Problem

Visitors choosing between an Airbnb and a hotel in Hawai'i are mostly guessing. Prices vary sharply by island and neighborhood, and the assumption that Airbnb is the budget option doesn't always hold. The question: where does each option actually win, and by how much?

## Context

Course project built as a guest-facing value analysis. One methodological caveat, stated plainly: hotel comparison rates are based on Google estimates for 3- and 4-star hotels, not a transaction dataset. [Confirm dataset source for the ~36,000 listings before publishing.]

## My Role

Two-person team with Jayden Respicio. [Confirm the split: who built which worksheets/dashboard sections, who wrote the memo, who presented — state it specifically and give Jayden clear credit for his share.]

## Approach

- Analyzed ~36,000 Hawai'i Airbnb listings: prices, locations by island and neighborhood, and user reviews
- Compared Airbnb pricing against average hotel rates (Google estimates, 3–4-star properties)
- Layered in Hawai'i's short-term-rental zoning context: rentals under 30 days are generally prohibited outside hotel/resort zones without a permit, which shapes where listings can exist
- Built a 14-worksheet Tableau workbook with a main interactive dashboard: island price comparisons, neighborhood averages, rating distributions, listing counts, and maps

## Key Findings

- Hotels are cheaper on average: $250 vs. $283 for Airbnb.
- 70% of Airbnb listings (under $1,000) are more expensive than comparable hotel rates.
- Quality is rarely the problem: the average Airbnb rating is 4.79/5.
- Maui and Kauai are the most expensive islands; Molokai has the lowest average prices.
- Oahu holds the most listings (~29% of all) at comparatively moderate prices — Central Oahu, away from the water, is the clearest budget option.
- Proximity to water drives price. On Kauai, where every neighborhood is coastal, every neighborhood averages above the typical hotel rate.
- Listings cluster where hotels are, a footprint shaped by zoning: Central Oahu, with zero hotels, is the exception that proves it.

## Recommendations

For a standard short stay, price a hotel first — most of the market says it wins. Airbnb earns its premium for specific cases: larger groups, longer stays, and neighborhoods hotels don't serve. Budget-focused visitors should look at Central Oahu and Molokai; travelers set on Maui or Kauai should expect coastal pricing everywhere. [Clark: confirm these read as what you'd actually tell someone — they're restatements of the findings above, but the voice should be yours.]

## Artifacts

*The class project's interactive Tableau dashboard is being published to Tableau Public; dashboard views and selected chart crops will be added here.*

<!--
Artifact plan (Clark's decision, July 9 2026): Clark publishes HIS version
of the workbook to his own Tableau Public profile:
  https://public.tableau.com/app/profile/clark.hayashi  (verified live)
No link to Jayden's revision. When the viz is published, add here:
  1. VerifiedLink: "Open the interactive dashboard — Tableau Public ↗"
     (link must resolve before it ships)
  2. 2–3 single-insight crops as CaptionedFigures, e.g.:
     - Airbnb vs. hotel average price comparison
     - Average price by island (Maui/Kauai high, Molokai low)
     - Map or neighborhood view showing the waterfront premium
  Captions state the finding, alt text describes the finding.

CONSISTENCY CHECK before publishing: if Clark's version differs from the
class workbook (different sample, filters, or metrics), the published
dashboard's numbers must match the Key Findings above — or the findings
get updated to match the published version. One source of truth.
-->


## Reflection

[Clark's voice required — 2–4 sentences. Possible angle you've already voiced: this project is what a good two-person split feels like, in contrast to carrying a five-person project. Write it yourself.]

## Status

Analysis and dashboard complete. Publishing the dashboard to Tableau Public and adding artifact views to this page.
