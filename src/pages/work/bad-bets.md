---
layout: ../../layouts/CaseStudy.astro
title: Bad Bets
summary: "A browser party game for 2 to 8 people, built around quick rounds and friends playing together."
tags: ["Product Design", "Game Design", "JavaScript", "Codex"]
statusLabel: "Beta · playtesting"
statusType: "building"
---

[Open the game preview](https://bad-bets.vercel.app/) · [Suggest a game or report a bug](https://bad-bets.vercel.app/feedback.html)

## The game

Start a game and share the room code. Everyone joins from their own phone. Party mode runs for nine rounds with play chips; Minigames lets the group choose one game and replay it without betting.

The seven games include matching answers, numerical guesses, a food draft, drawing, finding the faker, an in-person Shadowbox face-off, and a category game called Keep It Going. Shadowbox and Keep It Going use sound cues so the group can look up from their phones.

## What I designed

I set the game concept and rules, directed the build with Codex, and tested the flows. Early versions put too many choices on the home screen and made betting harder to follow. I reduced the entry screen to Start a game and Join a game, moved game selection into room setup, and gave each minigame its own visual style.

The rules keep everyone involved: players never get eliminated from the session, creative-game judges cannot bet on the outcome they control, and physical-game scores need player confirmation before chips move.

## Current status

This is a beta for small-group playtesting. Same-Wi-Fi multiplayer has been tested locally; public room hosting is still being connected. The hosted site currently provides a preview. Automated checks cover scoring, private information, room permissions, and simultaneous actions. They do not replace testing with a full group of friends. Timing, balance, and the feel of each round are still being refined.
