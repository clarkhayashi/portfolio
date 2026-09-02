---
layout: ../../layouts/CaseStudy.astro
title: Fan Demand Lab
summary: "A SQL-first model of NBA home attendance, built end to end on AWS: S3 and Lambda collectors, DuckDB feature engineering, and a self-built Elo rating system validated against FiveThirtyEight's own historical ratings."
tags: ["SQL", "DuckDB", "AWS"]
statusLabel: "Currently building"
statusType: "building"
---

## Overview

A game-level model of NBA home attendance for a marketing-department audience, not a basketball-ops one: which factors fill seats, and what is a marginal win actually worth in tickets. Built as a SQL-first portfolio piece: all feature engineering happens in DuckDB SQL, not pandas, so the repository doubles as SQL evidence alongside the model itself.

## Problem

Team marketing departments have attendance numbers but rarely a clean answer to which levers actually move them: opponent quality, a win streak, a national TV slot, day of week. Without that, budget and scheduling decisions get made on instinct.

## Context

Solo project, built on AWS specifically to deepen SQL and cloud data engineering alongside the job search: an ingestion pipeline (S3, Lambda, EventBridge), a DuckDB warehouse, and a full feature and modeling layer on top. Same honesty rule as the real estate project: no number gets published until it traces back to the pipeline that produced it.

## My Role

Solo: data engineering, SQL feature engineering, modeling, and the eventual write-up.

## Approach

- Backfilled 13 NBA regular seasons (2013-14 through 2025-26) from the ESPN scoreboard API, deliberately excluding the two COVID-affected seasons rather than modeling around them
- Nightly AWS Lambda collectors (ESPN, SeatGeek, Ticketmaster) on EventBridge schedules, writing to S3
- All feature engineering in DuckDB SQL, each script asserting its own row counts and reconciling against a QC report before the next step runs
- A self-built Elo rating system (standard Elo, home-court adjustment, season carry-over) validated against FiveThirtyEight's own historical ratings

## Key Findings

Findings publish once the feature engineering and modeling phases are complete and validated. The load pipeline and Elo rating system are done; nothing about attendance itself has been modeled yet.

## Recommendations

Recommendations follow the findings, once there is evidence behind them.

## Artifacts

The SQL pipeline and QC reports are in a private repository for now. Publishing it, and linking it here, is a deliberate later step, not an oversight.

## Reflection

The most useful moment so far wasn't a modeling result, it was a validation check refusing to pass. The self-built Elo system was supposed to correlate at 0.98 or better against FiveThirtyEight's historical ratings, and one season came in far below that. Chasing it down meant separating a real bug (a date field off by a day, breaking most of the join) from a limit that no amount of tuning would fix (the two COVID seasons this project deliberately excludes are also missing from FiveThirtyEight's continuity, so one transition season can't fully validate). Reporting the honest number instead of adjusting the model until the check went green felt like the actual point of building the check in the first place.

## Status

Currently building. The ingestion pipeline and Elo rating system are done and validated; feature engineering, modeling, and the marketing-facing write-up are next.
