---
layout: ../../layouts/CaseStudy.astro
title: Intramural Sports Participation Analysis
summary: Eight seasons of participation data, turned into dashboards UREC leadership used for scheduling, marketing, and retention decisions.
tags: ["Excel", "Tableau", "Stakeholder Reporting"]
statusLabel: "Delivered · dashboards pending UREC sign-off"
statusType: "progress"
---

## Overview

Seattle University Recreation runs an intramural program that drew 648 players onto the court in 2025. I analyzed eight seasons of participation records (2018 to 2025), 4,169 player-years in total, and presented dashboards to UREC leadership to support scheduling, marketing, and retention decisions.

## Problem

Decisions about which leagues to grow, cut, or reschedule were made mostly on staff intuition. Years of participation records existed, but nobody had analyzed them.

## Context

This wasn't an outside consulting exercise. I worked inside this program for nearly four years as an official and later as Intramural Sports Manager, which shaped the questions: I knew where the operational pain was before opening the data.

## My Role

Sole analyst: data consolidation and cleaning in Excel, dashboard design in Tableau, and the presentation to UREC leadership. Separately, I managed the program's 40+ student officials.

## Approach

- Consolidated and cleaned participation data across sports, seasons, and class years (2018–2025)
- Analyzed engagement trends and involvement drivers: which leagues were growing, which were declining, and when students actually sign up
- Built Tableau dashboards highlighting participation patterns by sport, season, and class year
- Presented findings to UREC leadership to inform scheduling, marketing, and retention planning

## Key Findings

**Rostered and played are two different questions, and the program was reading them as one.** Rostered participants measure interest. Players who actually appeared measure engagement. Read apart, the two lines tell opposite stories: roster counts fell for three years while real participation held flat at 711, 721, and 720 from 2022 to 2024, then dropped to 648 in 2025. What had been shrinking was empty roster spots, not players. Over the same window the share of rostered players who actually showed up rose from 47 percent to 64 percent. Reframing the brief around two named metrics, rather than one ambiguous "participation" number, changed which problem the program was solving.

**The constraint is the front door, not the product.** New-player intake fell four years running, from 371 to 339 to 323 to 283, a 24 percent decline. Returning players covered that gap until 2025, the first year they did not. That moves the problem from retention programming to acquisition.

**Activation predicts return, and the threshold is three games.** Across 2,430 new players, first-year depth tracked the following year's return closely: 1 to 2 games returned at 23 percent, 3 to 5 at 49 percent, 6 to 10 at 67 percent, and 11 or more at 84 percent. Playing a second sport moved return from 41 percent to 64 percent. Roughly half of new players never reached a third game. Motivated players both play more and return more, so this is a leading indicator rather than a proven lever, but it gives staff a single number to move weekly.

**Retention concentrates in groups, not individuals.** Players whose social group stayed together returned at 70 to 78 percent, even when the team changed names. Players whose group dissolved returned at 29 percent. Only 42 percent of groups persisted, and persistence tracked closely with whether the captain came back: 63 percent against 11 percent. Group survival and individual return are a joint decision, so the gradient overstates any causal effect. It still points retention effort at teams rather than at individuals, which is a cheaper place to aim.

**A small core carries the program.** The top 10 percent of players, 293 people, generated 44.5 percent of all recorded activity. Captains returned at 55 percent against 43 percent for everyone else, and attended at 68 percent against 53 percent. That is a dependency risk and, at the same time, the only distribution channel the program already owns.

## Recommendations

- Adopt a two-metric standard: rostered uniques as the demand number, players with at least one game as the engagement number. Every target names which one it means.
- Treat acquisition as the binding constraint. Set an intake floor, give it a named owner, and add a "how did you hear about intramurals?" field at registration so the channel mix stops being a guess.
- Aim new-player communication at the third game rather than at signup, and protect new-player leagues from the forfeits that truncate a first season early.
- Make team renewal one click and prompt every captain to name a successor in their final season. Both are near zero cost inside the existing registration system.
- Formalize the captain layer with recognition and early registration priority, and measure registrations attributed to it.

## Method

Participation records were consolidated and cleaned in Excel, then analyzed by first-played year to separate new from returning players. Group continuity used a hybrid match, a next-year team in the same sport family sharing at least three members or a Jaccard overlap of 0.4 or better, chosen after name matching proved too noisy to trust: only about 10 percent of team names persist year to year, while 42 percent of the underlying groups do. Findings are reported as association, not cause. Where the data could not settle a question, the write-up says so instead of reaching.

## Artifacts

Dashboards were built in Tableau and presented to UREC leadership. Because the underlying records are student participation data belonging to the university, chart exports publish here in public-safe form once UREC has signed off on the specific views.

## Reflection

Knowing the program from the floor and then seeing it in the data taught me how different those two views can be, and how much easier leadership buy-in comes when findings arrive as a dashboard instead of a spreadsheet.

## Status

The analysis, the leadership presentation, and this write-up are complete. Dashboard exports publish once UREC has approved the specific views.
