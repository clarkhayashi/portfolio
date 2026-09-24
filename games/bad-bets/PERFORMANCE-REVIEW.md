# Performance and readiness review

Updated September 23, 2026.

## Fixed

- Cloud reads previously wrote the whole room on every poll. Presence now refreshes at most every 2 seconds per player; gameplay changes still commit immediately. An eight-player synthetic test went from 240 writes to 80 for 30 polling cycles. Redis reads and rate-limit commands still cost work; this is not a 67% reduction in total billing.
- Responses carry monotonic room versions. The browser discards older responses, and ignores action responses after leaving a room. This prevents a late poll from replacing a newer action result.
- Drawing canvases remain mounted during background room updates, preventing a refresh from interrupting a stroke.
- Departed lobby seats are pruned before another joins. Live seats remain capped at 8.
- Shadowbox undo history is capped at 60 for both hits and dodges. Minigame summaries are capped at 50. Party mode still retains its full nine rounds.
- Audio nodes disconnect after each beep.
- Local state reads refresh room activity so a long-lived active lobby does not expire simply because nobody pressed a button.

- Authenticated local actions refresh presence, so submitting players are not incorrectly shown as disconnected.

## Measurements

Reproduce with `node --expose-gc benchmark.mjs`. Raw data is in benchmark-results.json.

Eight concurrent clients, 800 HTTP state requests on the same machine: median 1.95 ms, p95 2.71 ms, maximum 3.87 ms, about 3,421 requests/second. These are synthetic loopback server measurements, not phone Wi-Fi latency, browser frame rates, or cloud capacity.

Six batches of 500 rooms, eight seats each, followed by expiration and forced garbage collection: zero rooms retained. Post-GC heap settled around 10.7 MB; this short test cannot prove there are no memory leaks.

45 regression checks pass, including concurrent joins/submissions/votes, single settlement, privacy, physical scoring, reconnect grace, bounded histories, expired-room cleanup, and all seven games.

## Complexity and remaining costs

Let P be players, R be rooms, and B be room payload bytes. P is capped at 8. Most rules scan a few player lists: O(P) or O(P²) for repeated lookups, with a small fixed maximum. Replacing these with indexes would add complexity for little benefit. Room lookup is a Map lookup (expected O(1)). The local timer scans rooms in O(R × P); expired rooms are removed after 12 hours. JSON serialization and Redis compare-and-swap transfer cost O(B), which matters more than the player loops. Drawings dominate B and are capped at 100,000 characters per submission. Minigame history and undo state are bounded.

Do not cache private room responses in a CDN. Static assets could use content hashes and long-lived caching later; correctness across releases comes first. Redis atomic compare-and-swap prevents lost writes across function instances. Frequent polling still consumes database commands and Vercel invocations; review actual usage before a wider public launch.

## Remaining verification

Public multiplayer currently returns HTTP 503 because the database connection is not complete. The connection form is prepared for Bad Bets production only. Real Redis latency, cold starts, concurrency and full public round completion must be verified after connection. Local multiplayer is the available fallback. Physical phone audio and touch behavior still need a real-device group playtest; simulated clients are not a substitute.
