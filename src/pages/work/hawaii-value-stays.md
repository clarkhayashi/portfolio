---
layout: ../../layouts/CaseStudy.astro
title: "Finding the Best Value Stays in Hawai'i"
summary: "What 29,011 Hawai'i Airbnb listings reveal about where visitors actually find value against a hotel benchmark, island by island and neighborhood by neighborhood."
tags: ["Tableau", "Data Visualization", "Team Case Study"]
statusLabel: "Completed · team project"
statusType: "progress"
---

## Overview

A data visualization project asking where visitors actually find value in Hawai'i, Airbnb or a hotel, and on which islands and in which neighborhoods. Built on Inside Airbnb data and compared against a fixed hotel benchmark, then assembled into a 14-worksheet Tableau workbook with one interactive dashboard.

## Problem

Visitors choosing between an Airbnb and a hotel in Hawai'i are mostly guessing. A single statewide average hides the decision people are actually making, because prices swing hard between islands and again between neighborhoods on the same island. The question: where does each option win, and by how much?

## Context

A course project for BUAN 4220 Data Visualization at Seattle University, co-created with Jayden Respicio. I grew up on O'ahu, so this is a question people genuinely ask me, which is why the test for every chart was whether it would change how someone books a trip.

## My Role

Data cleaning and preparation, the analysis, and the Tableau workbook and dashboard. Jayden Respicio co-created the project.

## Approach

- Started from 36,125 Inside Airbnb records, kept listings priced between $1 and $1,000, and excluded the separate "Hotel room" category, leaving an analytical sample of **29,011 listings**
- Compared those against a fixed benchmark of roughly $250 per night, drawn from broad Google estimates for three- and four-star hotels
- Layered in Hawai'i's short-term-rental zoning context: rentals under 30 days are generally prohibited outside hotel and resort zones without a permit, which shapes where listings can legally exist
- Built 14 Tableau worksheets mapping price and minimum-stay patterns, ranking islands and neighborhoods, and summarizing listing mix, then connected them into one dashboard with an island filter and cross-view actions

## Key Findings

**Location mattered more than any statewide number.** The average listing came in at $283.23 against the $250 benchmark, but that gap is not the story. High-price resort areas pull the statewide mean upward while a handful of neighborhoods sit well below the benchmark, and the two facts cancel out into a number that helps nobody.

**About 70.33 percent of analyzed listings sat in neighborhoods whose average price exceeded the $250 benchmark.** Stated precisely, because the distinction matters: this is a geographic comparison of neighborhood averages, not a claim that any individual listing was more expensive than a matched hotel stay on the same dates.

**Island averages split into three tiers.** Maui at $375.33 and Kaua'i at $370.58 sit far above the benchmark. Hawai'i at $274.83, Lāna'i at $268.44 and O'ahu at $254.09 hover just over it. Moloka'i is the only island clearly below, at $149.81.

**Within an island, neighborhoods change the answer entirely.** On O'ahu the spread runs from Ewa at $482.83 down to Central O'ahu at $193.26, a difference of nearly $290 a night on the same island. Central O'ahu is the clearest budget option in the state, and it is also the one area with essentially no hotels, which is the zoning footprint showing up in the data.

**On Kaua'i there is no budget neighborhood.** Every displayed neighborhood averaged above the benchmark, led by Kōloa-Po'ipū at roughly $456. Where every neighborhood is coastal, proximity to water stops being a differentiator and becomes the floor.

**Supply concentrates where the demand and the zoning allow.** O'ahu holds 28.96 percent of listings and Maui 28.81, with Hawai'i at 24.55, Kaua'i at 17.02 and Moloka'i at 0.63. Quality is rarely the differentiator: the average rating across the sample is 4.79 out of 5.

## Artifacts

The dashboard combines headline metrics, two geospatial views, island and neighborhood price rankings, listing share, and the benchmark comparison. The island selector drives both maps and the neighborhood ranking, so a reader can move from a statewide pattern to a local one without losing context. The selected state shown here is O'ahu.

![The Tableau dashboard: headline metrics across the top, Avg Price Density and Stay Length maps of O'ahu on the left, island and neighborhood price rankings on the right against a $250 hotel benchmark line, and listing share by island.](/images/work/hawaii-value-stays-dashboard.png)

The same density view for Kaua'i, where every neighborhood marker sits above the benchmark.

![Kaua'i map with neighborhood price-density markers for North Shore Kaua'i, Kapa'a-Wailua, Līhu'e, Waimea-Kekaha and Kōloa-Po'ipū.](/images/work/hawaii-value-stays-kauai.png)

## Recommendations

For a standard short stay, price a hotel first, because most of the market says it wins. Airbnb earns its premium in specific cases: larger groups, longer stays, and neighborhoods hotels do not serve. Budget-focused visitors should look at Central O'ahu and Moloka'i. Travelers set on Maui or Kaua'i should expect coastal pricing everywhere and plan around it rather than hunt for a bargain that is not there.

## What I Would Fix Before Calling This Booking Advice

The $250 figure came from broad Google estimates for three- and four-star hotels. It works as a classroom benchmark and it does not work as a matched comparison, because it was never matched by date, island, or neighborhood to the listings it is being measured against. Four things would have to change before this became advice rather than a visualization:

- **Match the comparison in time and place.** Use hotel daily rates for the same travel dates and the same geographic areas as the Airbnb observations.
- **Compare all-in stay cost.** Add cleaning fees, service fees, taxes, parking, and the effect of minimum-night requirements instead of resting on base nightly price.
- **Control for the travel party.** Compare options at the same guest capacity, room count, property tier, and stay length.
- **Document reproducibility.** Publish the cleaned dataset, source dates, field definitions, and exclusion logic alongside the workbook.

## Reflection

The useful discipline here was refusing to let a single average stand in for a decision. A statewide mean of $283 against a $250 benchmark reads as a narrow loss for Airbnb; the neighborhood view shows a $290 spread inside one island, which is the number that would actually change a booking. The second discipline was writing down why the benchmark is weak. It would have been easy to present the comparison as settled, and the honest version is more useful to anyone reading it.

## Status

Analysis, workbook and dashboard complete. The packaged workbook includes the source data and calculates the Airbnb average dynamically.
