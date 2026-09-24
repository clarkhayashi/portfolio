# Bad Bets — current playable build

## Open it

Public game: https://bad-bets.vercel.app/
Website project: https://clarkhayashi.com/work/bad-bets

Join from separate devices using the same room code. Internet multiplayer uses shared Redis storage; no account or install is required. Physical games still require players to be together.

For local development, run npm start and open http://localhost:3210/. Phones on the same Wi-Fi use the network address printed in the lobby.

Home has Start a game and Join a game. Start asks for Party mode or Minigames, then your name. The host picks games in the lobby. Invite friends using the four-letter code or invite link.

## Modes

- **Party mode:** 100 starting chips; the host chooses 3, 6, 9, 12 or 15 rounds (default 9). Most chips wins. Everyone plays in ordinary rounds; choose a 5/10/20-chip bet before the game reveal. Every third round uses the spotlight entry ladder. Only selected contestants pay. If fewer than two stay in, an eligible everyone-plays game runs free. A win returns the stake plus an equal profit; a loss loses the stake; a draw refunds it. Balances below 5 top up to 5 before the next round.
- **Minigames:** choose one compatible game; no betting, chip changes, or tournament standings. Play again or choose another game using the same room. Ineligible games show their minimum player count.
- Mixer remains a parked prototype, outside the public mode menu.

## Seven games

| Game | Players | What happens | Win condition |
|---|---|---|---|
| Same Brain? | 2–8 | Everyone writes a short answer | Match another player; normalization ignores articles/case/punctuation |
| Ballpark | 2–8 | Guess a number | Closest guess, or lowest average team error in spotlight |
| Food Court Draft | 3–8 | Two contestants draft main/side/drink/wildcard, then pitch | Audience vote; tied/no votes refund |
| Drawn Into Trouble | 3–8 | Two contestants draw on their phones | Audience vote; tied/no votes refund |
| Who’s Faking? | 4–8 | One faker sees only the category; everyone takes a clue turn, discusses, votes | Identify the faker; a tied accusation lets the faker escape |
| Shadowbox | 2–8 | Two players point/look in person on the beat | First to 3 total hits; final score confirmed by both |
| Keep It Going | 2–8 | Everyone names an item on the beat, two laps | Fewest mistakes; whole-room tie refunds |

## Shadowbox controls

The app assigns two contestants and a starting attacker. An audience member is scorekeeper; in a two-player room the host records scores. The host can also correct a score.

Only the host device plays sound: a three-count lead-in, then two low beeps and a high GO beep. Try the beat runs one practice cycle without scoring. Start round runs the real beat. Same direction = hit for the attacker. Different direction = dodge and switch roles. Use +/− for hits and Dodged to change the attacker. Undo restores the previous score/attacker. Anyone can pause. The host resumes.

At 3 hits the beat stops. Both contestants confirm before any payout. Fix the score reopens a paused round and clears confirmations. The host can finish early for a group-agreed result; equal scores tie. No audience side bets here, since results are manually judged.

## Keep It Going controls

The group chooses a category, and the host selects a built-in one, enters a custom category (70 characters max), or taps **Can’t decide? Let us pick for you**. Includes US states, fast-food chains, cereals, sports teams, celebrities, cookout things, pizza toppings, bad first-date locations, and more.

Follow the displayed order. Two low beats to clap; say the answer on the high beat. Each turn lasts 4.5 seconds after the three-count lead-in. Two laps end automatically. The host records 0–2 mistakes per person: at most one per turn. A repeat, hesitation, or invalid answer is judged by the group. Pause to resolve a dispute. Everybody confirms the final scores; nobody is eliminated mid-round.

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

- Judges cannot place outcome bets; objective Ballpark audience predictions lock before play.
- Physical score changes reject stale requests. Changes clear score confirmations.
- If the host hides the rhythm tab, playback pauses. A missing host heartbeat also pauses the beat.
- After 30 seconds disconnected, another player can take over as host. The host can remove an absent player after 30 seconds; an unfinished round is cancelled and stakes refunded.
- Leaving an active round refunds stakes. Reconnect with the same tab to retain your seat.

## Current limits / review notes

- Physical games require the same room and human judging. No microphone/camera detection.
- Keep the host device awake and volume audible. Audio requires a user gesture; visual beat cues also appear.
- Public rooms use Redis and expire after 12 hours without a successful state write. The optional local server keeps rooms in memory and loses them on restart.
- The tutorial video covers the original Party loop; written rules also explain Minigames and the physical games.
- The Figma review is an earlier snapshot and does not yet include these new screens/styles.
- Prompt libraries are deliberately small for local testing. Same Brain currently uses normalized exact matching, not semantic matching.
- The phone drawing mode is freehand; the earlier funny-title extension is not implemented.

## Quick feedback

Copy any game/screen name above and add **keep / change / cut**, or describe what feels confusing, slow, or fun.
