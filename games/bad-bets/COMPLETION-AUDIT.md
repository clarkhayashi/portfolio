# Nine-game release audit · September 24, 2026

Playable: https://bad-bets.vercel.app/
Portfolio: https://clarkhayashi.com/work/bad-bets

## Implemented

- Nine selectable games. Food Auction uses restaurant-first bidding, $20 meal budgets, $1 raises, pass/reroll/free-allocation fallbacks and four meal slots. Bad Answers has 60 original prompts, 45-second answers, private 20-second voting and pause/skip controls.
- Creative Party matchups reserve two judges. Missing answers, absent judges, no votes and all-contestant ties refund. Judges cannot bet on the creative result. Multi-contestant joint leaders can win.
- One optional 20-chip comeback, without debt or automatic refills; consent, agreement/performance timeouts and an audience option.
- Physical score review/dispute windows, host recovery, stale bid/score/prompt rejection, bounded histories and room expiry.
- Read-only shared display with a separate capability token and no unrevealed submissions or secret roles. Phones remain sufficient for playing.
- Accurate written help and NotebookLM brief; obsolete video removed from the help interface.

## Verified evidence

- 64 tests pass, including the existing suite and new mechanics. Complete simulated nine-round sessions cover 2, 3, 4 and 8 players; standalone auction fallbacks cover 2, 4 and 8 creators.
- Live four-player API test: concurrent Bad Answers submissions and votes settled correctly; public answers remained hidden until reveal; Food Auction completed 48 actions through all four slots. See production-release-check.json.
- Browser: live help and entry flow verified; local two-tab auction bids and restaurant item selection verified. Narrow 390px iframe showed no horizontal overflow. These are browser checks, not physical-phone certification.
- Local benchmark: 800 reads at concurrency 8, p95 about 2.2ms on loopback. Cleanup removed 3,000 expired rooms; sampled post-GC heap stayed around 10.8MB. Does not prove absence of leaks or predict cloud latency.
- Vercel game and portfolio deployment checks succeeded for 550b90dbc3627e87a438187b28bdd8077d107e0e.

## Still required before calling every field-test gate complete

- Real iPhone Safari and Android Chrome: keyboard, drawing, sound unlock, phone lock and reconnect. No hardware result has been invented.
- Four-person observed session, then larger group. Measure joining time, first-action confusion, idle time and perceived fairness. Compare Draft versus Auction rather than assuming variety helps.
- Full editable Figma synchronization remains incomplete. A verified raster review of Auction and Bad Answers is at node 32:2; older transfers/render discrepancies remain recorded in FIGMA-REVIEW.md. Existing human comments/edits were preserved.
- Supplied Apple device assets were not used: the displayed license restricts them to Apple-only products; this is a cross-platform game. Neutral phone/expanded-frame mockups were made instead. The expanded view is a responsive concept, not verified iPhone Duo hardware support.
- Replacement narrated video has a prepared brief, not a generated final video. Accurate text help is available now.

## Deliberate scope limits

Human judging cannot eliminate friendship bias; anonymity, private voting and independent judges reduce it. No AI judge, real-money gambling, native app, App Clip, sports packs, or custom content marketplace is claimed. Existing parked Mixer code remains outside the public modes.
