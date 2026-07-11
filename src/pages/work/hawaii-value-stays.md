---
layout: ../../layouts/CaseStudy.astro
title: "Finding the Best Value Stays in Hawai'i"
summary: "What ~36,000 Hawai'i Airbnb listings reveal about where visitors actually find value compared with average hotel rates, island by island."
tags: ["Tableau", "Data Visualization"]
statusLabel: "Completed · artifacts publishing"
statusType: "progress"
---

## Overview

A data visualization project examining where visitors actually find value in Hawai'i: Airbnb or hotels, and on which islands and neighborhoods. Built on the Inside Airbnb dataset of ~36,000 Hawai'i listings, compared against average hotel rates.

## Problem

Visitors choosing between an Airbnb and a hotel in Hawai'i are mostly guessing. Prices vary sharply by island and neighborhood, and the assumption that Airbnb is the budget option doesn't always hold. The question: where does each option actually win, and by how much?

## Context

The idea started as a data visualization course project (BUAN 4220); this is my own separate build of the analysis, published to my Tableau Public profile. One methodological caveat, stated plainly: hotel comparison rates are based on Google estimates for 3- and 4-star hotels, not a transaction dataset.

## My Role

Solo analyst on this version: dataset preparation, analysis, the Tableau workbook and dashboard, and the write-up.

## Approach

- Analyzed ~36,000 Hawai'i Airbnb listings from Inside Airbnb: prices, locations by island and neighborhood, and user reviews
- Compared Airbnb pricing against average hotel rates (Google estimates, 3- and 4-star properties)
- Layered in Hawai'i's short-term-rental zoning context: rentals under 30 days are generally prohibited outside hotel/resort zones without a permit, which shapes where listings can exist
- Built a 14-worksheet Tableau workbook with a main interactive dashboard: island price comparisons, neighborhood averages, rating distributions, listing counts, and maps

## Key Findings

- Hotels are cheaper on average: $250 vs. $283 for Airbnb.
- 70% of Airbnb listings (under $1,000) are more expensive than comparable hotel rates.
- Quality is rarely the problem: the average Airbnb rating is 4.79/5.
- Maui and Kauai are the most expensive islands; Molokai has the lowest average prices.
- Oahu holds the most listings (~29% of all) at comparatively moderate prices. Central Oahu, away from the water, is the clearest budget option.
- Proximity to water drives price. On Kauai, where every neighborhood is coastal, every neighborhood averages above the typical hotel rate.
- Listings cluster where hotels are, a footprint shaped by zoning: Central Oahu, with zero hotels, is the exception that proves it.

## Recommendations

For a standard short stay, price a hotel first; most of the market says it wins. Airbnb earns its premium for specific cases: larger groups, longer stays, and neighborhoods hotels don't serve. Budget-focused visitors should look at Central Oahu and Molokai; travelers set on Maui or Kauai should expect coastal pricing everywhere.

## Artifacts

*The interactive Tableau dashboard is being published to Tableau Public; dashboard views and selected chart crops will be added here.*

## Reflection

I grew up on O'ahu, so the question behind this one is personal; where to stay is something people actually ask me. Rebuilding the analysis as my own project meant each chart had to pass a simple test: would it change how someone books a trip?

## Status

Analysis and dashboard complete. Publishing the dashboard to Tableau Public and adding artifact views to this page.
