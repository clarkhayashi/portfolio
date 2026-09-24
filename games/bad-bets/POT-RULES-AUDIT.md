# Shared-pot and All In adversarial design audit

Status: implemented locally and regression-tested September 24, 2026; deployment verification recorded in LAUNCH-STATUS.md. New rooms use potVersion 2; legacy rooms retain their old economy.

Implementation: pot.mjs supplies conserved layered settlement, sequential betting with revision checks, preassigned judges, short All In, explicit whole-stack confirmation, missing-entry forfeits, fixed entries for matching/deduction, and no side bets. Limits show a brief non-flashing “Fun police” notice. Reduced motion disables the bounce. Ballpark ranks individuals in the new economy, including Spotlight.

Known social limits: friends can still collude on answers or judgments. Fixed entries bound exposure but do not make play unbiased. Physical score disputes still draw after the existing review process. If nobody produces any eligible result, there is no legitimate winner and entries return. No real-device field test is claimed.

## Recommended direction
5 chips is a minimum aka "blind" entry, not the maximum wager. Opening two rounds teach the interface with 5/10/20 betting choices. From round 3, eligible competitive rounds support 50 100, custom, or  the kicker Oops All In. Spotlight describes contestant/audience format, not the sole opportunity to bet. Same Brain and Who's Faking need separate economic design before unrestricted betting: matching creates collusion and social deduction has asymmetric winner groups.

For a competitive pot round: reveal game and assign contestants and independent judges first; show roles and win condition, keep answers/prompts secret until betting ends. Minimum entry 5. One clockwise decision per contestant, with turn origin rotated each round. Choose match, raise the TOTAL entry by at least 5, All In, or fold. After this pass, players below the final entry get one match/all-in-for-less/fold response; no new raises. All-in-for-less does not reopen raising. Confirm All In with chips at risk. Betting ends automatically; an inactive player checks if fully matched, otherwise folds without further deduction. Lock contributions atomically and reject old or repeated actions.

## Break attempts and fixes
1. Leader has 300, rival has 20: leader cannot win unmatched chips. Return uncalled excess; layer matched contributions into pots. A 20/100/100 round has a 60 main pot and a 160 side pot. The 20 contributor may win only 60. Competitive rankings must resolve every layer, even when the overall winner is not eligible for another layer. A simple winners-only list is insufficient.
2. Player bets, folds, then judges: prohibit it. Judges are assigned before any money moves. Folded contestants can react but cannot vote on any pot they contributed to. If a judge disconnects, do not substitute a folded bettor.
3. Friends agree to answer 'banana' in Same Brain: hiding answers does not stop collusion. Do not offer unrestricted wager escalation for matching rounds. Fixed shared contributions with refund when everyone matches/no one matches can reduce exploit value but do not eliminate coordinated play.
4. Faker versus group: a single winner versus several winners produces radically different payouts. Do not apply equal-split pots blindly. Keep equal-entry rounds and explicitly define role payouts before betting is enabled; otherwise exclude from All In eligibility.
5. Withhold an answer to force a refund: distinguish verified server-wide failure from an individual missing submission. A committed player missing their deadline forfeits eligibility; keep their contribution. Refund for an unplayable system-wide round. This is a change from current creative-game refund behavior and needs explicit testing.
6. Disconnect/rejoin to erase a loss: retain player identity and committed contribution; reconnect to same state. No duplicate seats to reclaim starting chips. A leave does not refund a committed wager.
7. Everyone folds: the last remaining eligible contestant wins matched contributions; return their uncalled excess. Optional quick unscored play must not silently count as another tournament round. All players folding simultaneously must be impossible through authoritative sequential turns.
8. No votes/ties: distinguish an agreed draw from someone refusing a duty. Tie at a pot layer splits that layer among eligible tied leaders; no valid vote/valid comparison cancels that layer by the stated rule. Assign odd chips deterministically using a rotating seat order. No discretionary host awards.
9. Comeback farming: one optional comeback per identity per session. Explicitly record its 20 chips as new issuance; settlement otherwise conserves chips. Do not advertise a perfectly closed chip economy when comebacks create chips.
10. Final-round leader always folds: valid strategy, not a software bug. Show standings and accept it rather than inventing a forced double finale. Test whether ordinary entry costs and rotation create enough competition.
11. Friends vote as a bloc: anonymity, private simultaneous votes, no judging own entries, and role rotation reduce bias, not eliminate it. Never promise unbiased subjective results.
12. Raising consumes the night: bound the decision sequence and show a timer; never silently auto-call. Eight players and unlimited physical auction discussion mean duration is not guaranteed.
13. Players have 1–4 chips: allow an all-in below the minimum only where partial contributions are supported; otherwise offer comeback/audience. Decide this explicitly; never round their balance upward.
14. Fewer than two competitors/two independent judges: filter eligible games before charging entry; use objective games at low counts. Do not let folding or a depleted roster force an invalid creative matchup.

## Settlement acceptance gate
Define a per-game ranked result adapter, tie/refund/forfeit policy, chip conservation including comeback issuance, side-pot entitlement, role secrecy boundaries, judge eligibility, and reconnect behavior. Test examples manually plus property-style settlement tests. Hide the All In action where the round cannot settle it correctly. No rule or video should promise it before these gates pass.

## Session estimate
Visible in room setup for host and guests, updates with selected rounds:
3: 10–15 min; 6: 20–30; 9: 30–45; 12: 40–60; 15: 50–75.
These are unmeasured planning estimates including setup, not guarantees. Draft, auction and discussion can run longer; a no-countdown auction has no strict maximum. Recalibrate using real session durations, player count and selected games after field tests.
