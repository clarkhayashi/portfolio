# Bad Bets

Browser party game for 2 to 8 players. Party mode has nine rounds and play chips; Minigames skips wagering. No purchases or cash prizes.

## Local

Run `npm start`, then open http://localhost:3210. Run `npm test` for engine and concurrent cloud-state checks.

## Vercel

Create a separate Vercel project from this repository with root directory `games/bad-bets`, framework Other, and the included build settings. Connect an Upstash Redis database to that project. The API reads `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or the integration's `KV_REST_API_URL` and `KV_REST_API_TOKEN`). Never expose tokens in public assets.

Room writes use Redis compare-and-swap, so votes and payouts survive concurrent requests and separate function instances. Clients poll for updates; each authenticated read advances due timers. A room with no requests does not progress until a device returns. Inactive rooms expire after 12 hours. Physical rounds pause if the host disconnects. This is a small-group beta; frequent polling consumes database commands and Vercel requests. Review usage before inviting a wider audience.

Environment variables should be isolated between production and preview databases. Do not connect untrusted preview branches to production rooms.
