# Oops, All In — current playable build

## Open it

Public game: https://bad-bets.vercel.app/
Website project: https://clarkhayashi.com/work/bad-bets

Join from separate devices using the same room code. Internet multiplayer uses shared Redis storage; no account or install is required. Physical games still require players to be together.

For local development, run npm start and open http://localhost:3210/. Phones on the same Wi-Fi use the network address printed in the lobby.

Home has Start a game and Join a game. Start asks for Party mode or Minigames, then your name. The host picks games in the lobby. Invite friends using the four-letter code or invite link.

## Modes

- **Party mode:** 100 starting pretend chips; host chooses 3/6/9/12/15 rounds. Game and roles are selected before betting; the prompt stays hidden. A 5-chip minimum goes into the shared pot. Competitive rounds allow one raise turn per contestant and one final match/fold response. Rounds 1–2 cap the total at 20. Round 3 onward unlocks 50, 100, custom totals and confirmed All In. A shorter stack can compete only for its matched portion; uncalled chips return. Same Brain and Imposter use fixed equal 5-chip entries. Most chips at the end wins. One optional, consensual 20-chip dare comeback is available below 5; no debt. Old rooms finish under the old economy; create a fresh room for these rules.
- **Timing:** planning estimates, not measured promises: 3 rounds 10–15 min; 6 rounds 20–30; 9 rounds 30–45; 12 rounds 40–60; 15 rounds 50–75. More players, raising, draft and discussion can run longer.

- **Minigames:** choose one compatible game; no betting, chip changes, or tournament standings. Play again or choose another game using the same room. Ineligible games show their minimum player count.
- Mixer remains a parked prototype, outside the public mode menu.

## Nine games

| Game | Players | What happens | Win condition |
|---|---|---|---|
| Same Brain? | 2–8 | Everyone writes a short answer | Match another player; normalization ignores articles/case/punctuation |
| Ballpark | 2–8 | Guess a number | Closest valid individual guess; each side pot ranks its eligible players |
| Fantasy Draft | 2–8 standalone; 4+ Party | Contestants snake-draft one pick per theme slot (4 or 5 rounds), then pitch | Audience vote; tied/no votes refund |
| Drawn Into Trouble | 2–8 standalone; 4+ Party | Contestants draw on their phones | Audience vote; tied/no votes refund |
| Imposter | 4–8 | One imposter sees only the category; everyone takes a clue turn, discusses, votes | Identify the imposter; a tied accusation lets the imposter escape |
| Shadowbox | 2–8 | Two players point/look in person on the beat | First to 3 total hits; 10-second score review |
| Keep It Going | 2–8 | Everyone names an item on the beat, two laps | Fewest mistakes; whole-room tie refunds |
| Bidding War | 2–8 standalone; 4+ Party | $20 budget, live bids on theme lots, one lot per slot | Independent audience vote in Party |
| Bad Answers | 2–8 standalone; 4+ Party | 45-second original prompt, 140-character answer, 20-second private vote | Highest votes; incomplete matchups refund |

Creative Party rounds reserve two judges; the host may enable larger matchups except Bad Answers, which remains a two-person face-off. Standalone creative games allow all players to create and vote for someone else with no chip payouts; two-player reveals are unscored.

### Themes (Fantasy Draft, Bidding War)

The host picks a theme per game in the lobby (under the game list when that game is on, or under Choose a game in Minigames). Default is Food, which plays exactly like the original food draft and restaurant auction. Other themes come from `theme-content.mjs` (Dream Vacation, Heist Crew, Zombie Survival, Starting Five, Perfect Date as of 2026-09-24); engine code is in `themes.mjs`. Non-food Bidding War lots fill the slot directly unless the theme sets `nameItem`. Theme art: `/art/theme-<id>.svg`, food uses `theme-food-draft.svg` / `theme-food-auction.svg`. Cards, lots and prompts use no-repeat bags per theme.

### Room-tuned prompts (R9)

Built-in prompts are drawn in a weighted order from the one-tap Fun/Meh counts: weight = 0.35 + 1.3 × (fire+1)/(fire+meh+2), so unrated = 1.0. Every prompt still shows once per bag cycle; good ones tend to come earlier. A room's own votes adjust that pack for the session (×0.6 when Meh leads by 2+, ×1.25 when Fun leads by 2+), stored as counts only in `r.mood`. Production refreshes the cached counts at most every 5 minutes with a 300 ms wait before an action; if Redis is slow or down, draws fall back silently.

## Shadowbox controls

The app assigns two contestants and a starting attacker. An audience member is scorekeeper; in a two-player room the host records scores. The host can also correct a score.

Only the host device plays sound: a three-count lead-in, then two low beeps and a high GO beep. Try the beat runs one practice cycle without scoring. Start round runs the real beat. Same direction = hit for the attacker. Different direction = dodge and switch roles. Use +/− for hits and Dodged to change the attacker. Undo restores the previous score/attacker. Anyone can pause. The host resumes.

At 3 hits the beat stops. Contestants have a 10-second review window before payout. An objection opens a 30-second correction window; unresolved disputes refund. Fix the score reopens a paused round and clears confirmations. The host can finish early for a group-agreed result; equal scores tie. No audience side bets here, since results are manually judged.

## Keep It Going controls

The group chooses a category, and the host selects a built-in one, enters a custom category (70 characters max), or taps **Can’t decide? Let us pick for you**. Includes US states, fast-food chains, cereals, sports teams, celebrities, cookout things, pizza toppings, bad first-date locations, and more.

Follow the displayed order. Two low beats to clap; say the answer on the high beat. Each turn lasts 4.5 seconds after the three-count lead-in. Two laps end automatically. The host records 0–2 mistakes per person: at most one per turn. A repeat, hesitation, or invalid answer is judged by the group. Pause to resolve a dispute. Everyone can review the final scores for 10 seconds; nobody is eliminated mid-round.

## Visual identity

- Same Brain: warm pink, rounded speech-like inputs.
- Ballpark: green scoreboard, monospaced numbers.
- Food Court Draft: red/yellow menu typography, receipt-style entries.
- Drawing: lined-paper stage and purple ink.
- Faker: muted dossier styling and concealed-word card.
- Shadowbox: dark arcade stage, peach/cyan opponent colors.
- Keep It Going: lime rhythm stage, large beat and turn cues.

Room code, navigation, and player names remain consistent. Reduced-motion preference removes decorative transitions/scaling.

## Recovery and fairness

- Judges are assigned before betting and cannot bet on their result. Folded contestants cannot judge. Side betting is off.
- Physical score changes reject stale requests. Changes clear score confirmations.
- If the host hides the rhythm tab, playback pauses. A missing host heartbeat also pauses the beat.
- After 30 seconds disconnected, another player can take over as host. The host can remove an absent player after 30 seconds. A departing contestant forfeits committed chips; an interrupted stateful challenge shares the matched pot among remaining contestants. Losing an independent judge below the two-judge minimum cancels the round consistently.
- Reconnect with the same tab to retain your seat and committed chips. Missing submissions do not automatically cancel everyone’s bets.

## Current limits / review notes

- Physical games require the same room and human judging. No microphone/camera detection.
- Keep the host device awake and volume audible. Audio requires a user gesture; visual beat cues also appear.
- Public rooms use Redis and expire after 12 hours without a successful state write. The optional local server keeps rooms in memory and loses them on restart.
- The obsolete tutorial is removed from help. The NotebookLM brief is updated; a new recording remains pending.
- Figma remains a partial review snapshot; see its sync manifest. Release mockups are separate evidence.
- Prompt libraries are deliberately small for local testing. Same Brain currently uses normalized exact matching, not semantic matching.
- The phone drawing mode is freehand; the earlier funny-title extension is not implemented.

## Quick feedback

Copy any game/screen name above and add **keep / change / cut**, or describe what feels confusing, slow, or fun.


## Date Night (local update, September 24)
Start a game → Date Night. Two people, 36 original spoken questions in three levels. Both opt in before going deeper; either can skip or finish. No scoring or typed answers. See DATE-NIGHT.md for provenance and validation. Public deployment not yet verified.
