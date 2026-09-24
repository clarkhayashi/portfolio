---
layout: ../../layouts/CaseStudy.astro
title: Bad Bets
summary: "A browser party game for 2 to 8 people, built around quick rounds and friends playing together."
tags: ["Product Design", "Game Design", "JavaScript", "Codex"]
statusLabel: "Beta · playtesting"
statusType: "building"
---

## Now · try the current game

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

## How it took shape

This came together through trial and error. I took references from games and interfaces I liked, drew on my own experience, and brainstormed ways to make them work for this game. I set the direction, worked with Codex to build it, and kept revising what felt confusing or unnecessary as I played.

## Before · the early prototype

The first version put a promotional headline, instructions and a room form on the same screen. I wanted people to start playing with less reading, so I reduced the entry point to two actions and moved the game choices into setup.

<figure class="iteration-shot">
  <a href="/images/bad-bets/early-entry.png" target="_blank" rel="noopener"><img src="/images/bad-bets/early-entry.png" width="2940" height="1666" loading="lazy" decoding="async" alt="Early Bad Bets entry screen with a large promotional headline, explanatory copy and a combined join and create-room form." /></a>
  <figcaption>Early entry screen. The current version above puts Start and Join first.</figcaption>
</figure>

<figure class="iteration-shot">
  <a href="/images/bad-bets/early-results.png" target="_blank" rel="noopener"><img src="/images/bad-bets/early-results.png" width="2940" height="1668" loading="lazy" decoding="async" alt="Early Bad Bets results screen with a large generic heading, a list of chip losses and a separate numeric leaderboard." /></a>
  <figcaption>Early results screen. This exposed another design problem: the outcome and its explanation need to come before the bookkeeping. That remains part of the next results pass.</figcaption>
</figure>

<style>.iteration-shot{margin:2rem 0}.iteration-shot img{display:block;width:100%;height:auto;border-radius:8px}.iteration-shot figcaption{margin-top:.65rem;font-size:.875rem;line-height:1.6;color:#56616d}</style>

<section class="try-game" aria-labelledby="try-game-title">
  <h2 id="try-game-title">Try it with your friends</h2>
  <p>It’s still a work in progress. If you play, please let me know what you think — what was fun, what was confusing, and what you’d change.</p>
  <div class="try-actions"><a class="try-primary" href="https://bad-bets.vercel.app/" target="_blank" rel="noopener">Try the game ↗</a><a href="mailto:hayashiclark@gmail.com?subject=I%20tried%20Bad%20Bets">Tell me what you think ↗</a></div>
</section>
<style>.try-game{margin-top:3rem;padding:2rem 0;border-top:1px solid #d8dfdf}.try-actions{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap}.try-actions a{display:inline-flex;align-items:center;min-height:48px}.try-actions .try-primary{padding:12px 24px;border-radius:10px;background:#087f98;color:white;text-decoration:none;font-weight:600}</style>
