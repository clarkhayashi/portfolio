---
layout: ../../layouts/CaseStudy.astro
title: Bad Bets
summary: "A browser party game for 2 to 8 people, built around quick rounds and friends playing together."
tags: ["Product Design", "Game Design", "JavaScript", "Codex"]
statusLabel: "Beta · playtesting"
statusType: "building"
---

<div class="play-showcase">
  <a class="play-launch" href="https://bad-bets.vercel.app/" target="_blank" rel="noopener">Play full screen ↗</a>
  <p>Play here, or open the game full screen. Friends join at <a href="https://bad-bets.vercel.app/">bad-bets.vercel.app</a> with your room code.</p>
  <iframe src="https://bad-bets.vercel.app/" title="Play Bad Bets — live multiplayer game" loading="lazy" allow="autoplay; fullscreen" allowfullscreen style="width:100%;height:720px;border:1px solid #d8dfdf;border-radius:16px;background:#f8f7f2;"></iframe>
  <p class="play-utility"><a href="https://bad-bets.vercel.app/feedback.html" target="_blank" rel="noopener">Suggest a game or report a bug</a></p>
</div>
<style>
.play-showcase .play-launch{display:inline-flex;align-items:center;min-height:48px;padding:12px 22px;border-radius:10px;background:#087f98;color:white;text-decoration:none;font-weight:600}.play-showcase .play-launch:focus-visible{outline:3px solid #087f98;outline-offset:4px}.play-showcase .play-utility{font-size:14px;text-align:right}@media(max-width:560px){.play-showcase iframe{height:680px!important}.play-showcase .play-launch{width:100%;justify-content:center}}
</style>

## The game

Start a game and share the room code. Everyone joins from their own phone. The host chooses 3, 6, 9, 12 or 15 rounds in Party mode, with play chips; Minigames lets the group choose one game and replay it without betting.

The seven games include matching answers, numerical guesses, a food draft, drawing, finding the faker, an in-person Shadowbox face-off, and a category game called Keep It Going. Shadowbox and Keep It Going use sound cues so the group can look up from their phones.

## What I designed

I set the game concept and rules, directed the build with Codex, and tested the flows. Early versions put too many choices on the home screen and made betting harder to follow. I reduced the entry screen to Start a game and Join a game, moved game selection into room setup, and gave each minigame its own visual style.

The rules keep everyone involved: players never get eliminated from the session, creative-game judges cannot bet on the outcome they control, and physical-game scores need player confirmation before chips move.

## Current status

This is a beta for small-group playtesting. Online room hosting is live. An eight-player production test verified shared rooms, simultaneous answers, consistent results, and reconnects. Automated checks cover scoring, private information, room permissions, and simultaneous actions. They do not replace testing with a full group of friends. Timing, balance, and the feel of each round are still being refined.
