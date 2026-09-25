---
layout: ../../layouts/CaseStudy.astro
title: Oops, All In
summary: "A browser party game for 2 to 12 people. Quick minigames, pretend-chip betting, and a final round the room writes itself."
tags: ["Product Design", "Game Design", "JavaScript", "Codex", "Claude Code"]
statusLabel: "Beta · ready for group testing"
statusType: "building"
---

## Now · try the current game

<div class="play-showcase">
  <a class="play-launch" href="https://play.clarkhayashi.com/" target="_blank" rel="noopener">Play full screen ↗</a>
  <p>Play here, or open the game full screen. Friends join at <a href="https://play.clarkhayashi.com/">play.clarkhayashi.com</a> with your room code.</p>
  <iframe src="https://play.clarkhayashi.com/" title="Play Oops, All In, a live multiplayer game" loading="lazy" allow="autoplay; fullscreen" allowfullscreen style="width:100%;height:720px;border:1px solid #d8dfdf;border-radius:16px;background:#f8f7f2;"></iframe>
  <p class="play-utility"><a href="https://play.clarkhayashi.com/feedback.html" target="_blank" rel="noopener">Suggest a game or report a bug</a></p>
</div>
<style>
.play-showcase .play-launch{display:inline-flex;align-items:center;min-height:48px;padding:12px 22px;border-radius:10px;background:#087f98;color:white;text-decoration:none;font-weight:600}.play-showcase .play-launch:focus-visible{outline:3px solid #087f98;outline-offset:4px}.play-showcase .play-utility{font-size:14px;text-align:right}@media(max-width:560px){.play-showcase iframe{height:680px!important}.play-showcase .play-launch{width:100%;justify-content:center}}
</style>

## The game

Start a game and share the room code, a QR code, or an invite from your phone's share sheet. Everyone joins from their own phone, up to 12 players, with no app and no account. An optional TV screen shows the room code, prompts and scores to the whole room.

**Three ways to play.** Party mode is quick minigames where everyone starts with 100 pretend chips and bets on themselves each round (stay in, raise, fold, and from round 3, go all in). Minigames is the same games with no chips. Date Night is 36 questions for two people that get more personal level by level, and you only go deeper if you both say yes.

**Nine games.** Same Brain (match answers), Ballpark (guess the number), Fantasy Draft, Bidding War, Bad Answers, Drawn Into Trouble, Imposter, Shadowbox (an in-person pointing duel) and Keep It Going (name things to a beat). Fantasy Draft and Bidding War roll a random theme each time, from Food Court and Heist Crew to NBA, NFL and MLB lineups mixing stars and cult heroes, and anyone can veto the theme once per game.

**A finale the room writes.** In the last round, everyone writes a prompt, the room taps "this or that" to pick the best one, everyone plays it, and the votes pay out a double pot, a Best Prompt bonus, and a Toilet Bowl prize for the worst answer.

## How it took shape

This came together through trial and error. I took references from games and interfaces I liked, drew on my own experience, and brainstormed ways to make them work for this game. I set the direction and made the calls; Codex and Claude Code did most of the building, and I kept revising what felt confusing or unnecessary as I played.

Before the first group test I ran an audit as if strangers were at the party: could someone join without help, understand a bet, and recover if their phone locked? That led to plain betting words ("stay in" instead of "match"), a clear warning that folding loses the chips you put in, rejoin after a closed tab, and a one-tap "Was this one fun?" rating after each round. The ratings are anonymous counts per prompt, and prompts people like start coming up more often.

## Before · the early prototype

The first version put a promotional headline, instructions and a room form on the same screen. I wanted people to start playing with less reading, so I reduced the entry point to two actions and moved the game choices into setup.

<figure class="iteration-shot">
  <a href="/images/bad-bets/early-entry.png" target="_blank" rel="noopener"><img src="/images/bad-bets/early-entry.png" width="2940" height="1666" loading="lazy" decoding="async" alt="Early Oops, All In entry screen with a large promotional headline, explanatory copy and a combined join and create-room form." /></a>
  <figcaption>Early entry screen. The current version above puts Start and Join first.</figcaption>
</figure>

<figure class="iteration-shot">
  <a href="/images/bad-bets/early-results.png" target="_blank" rel="noopener"><img src="/images/bad-bets/early-results.png" width="2940" height="1668" loading="lazy" decoding="async" alt="Early Oops, All In results screen with a large generic heading, a list of chip losses and a separate numeric leaderboard." /></a>
  <figcaption>Early results screen. This exposed another design problem: the outcome and its explanation need to come before the bookkeeping. That remains part of the next results pass.</figcaption>
</figure>

<style>.iteration-shot{margin:2rem 0}.iteration-shot img{display:block;width:100%;height:auto;border-radius:8px}.iteration-shot figcaption{margin-top:.65rem;font-size:.875rem;line-height:1.6;color:#56616d}</style>

## The look

I wanted the game to feel like a sticker sheet. The mascot is a poker chip that acts out each game, and the logo is the same chip tipping over mid "oops". I directed the art and picked every version; it was drawn with AI tools.

<figure class="iteration-shot">
  <a href="/images/bad-bets/mascot-tiles.png" target="_blank" rel="noopener"><img src="/images/bad-bets/mascot-tiles.png" width="1200" height="1200" loading="lazy" decoding="async" alt="Nine game tiles showing the poker chip mascot acting out each game: bidding with a paddle, telling a joke, pointing in a duel, drumming, sharing a thought, guessing under a cap, carrying a food tray, drawing with a crayon, and wearing a disguise. AI-generated illustration." /></a>
  <figcaption>Game tiles: the chip mascot acts out each game. AI-generated illustration, art directed by me.</figcaption>
</figure>

<figure class="iteration-shot">
  <a href="/images/bad-bets/brand-board.png" target="_blank" rel="noopener"><img src="/images/bad-bets/brand-board.png" width="1720" height="1380" loading="lazy" decoding="async" alt="Brand board for Oops, All In: the tipping chip logo with the wordmark, app icons at several sizes, fonts, a seven colour palette, the phone home screen and the link preview card. AI-assisted design." /></a>
  <figcaption>Brand board: logo, icon sizes, fonts, palette and the link preview. AI-assisted, art directed by me.</figcaption>
</figure>

<section class="try-game" aria-labelledby="try-game-title">
  <h2 id="try-game-title">Try it with your friends</h2>
  <p>It’s still a work in progress. If you play, please let me know what you think: what was fun, what was confusing, and what you’d change.</p>
  <div class="try-actions"><a class="try-primary" href="https://play.clarkhayashi.com/" target="_blank" rel="noopener">Try the game ↗</a><a href="mailto:hayashiclark@gmail.com?subject=I%20tried%20Oops%2C%20All%20In">Tell me what you think ↗</a></div>
</section>
<style>.try-game{margin-top:3rem;padding:2rem 0;border-top:1px solid #d8dfdf}.try-actions{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap}.try-actions a{display:inline-flex;align-items:center;min-height:48px}.try-actions .try-primary{padding:12px 24px;border-radius:10px;background:#087f98;color:white;text-decoration:none;font-weight:600}</style>
