# Spotify listening stats · runbook

Powers the Listening card on `/side-quests` and the page at
`/side-quests/listening`.

## How it fits together

The site stays a static Astro build. The Spotify calls live in two Vercel
functions next to `api/duolingo.js`, which is the pattern this follows:

| File | Does | Cache |
|---|---|---|
| `api/spotify-now.js` | Now playing, last 12 plays | 60s |
| `api/spotify-top.js` | Top tracks and artists, three windows | 6h |
| `lib/spotify.js` | Token refresh and payload trimming | n/a |

Clark is the only user, so the OAuth flow runs once and the refresh token
lives in Vercel env vars. Visitors never sign in, and the app can stay in
Spotify's Development Mode permanently. That matters: since May 2025 extended
mode effectively requires 250K monthly users, so it was never available anyway.

## One-time setup

**1. Create the app** at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard).

- Redirect URI, exactly: `http://127.0.0.1:3000/callback`
- API: Web API only

Spotify no longer accepts the hostname `localhost` for redirect URIs, only the
literal loopback address. Using `localhost` fails with `INVALID_CLIENT`.

**2. Add credentials locally.**

```bash
cp .env.example .env
```

Fill in `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` from the app page.

**3. Get the refresh token.**

```bash
npm run spotify:auth
```

Open the printed URL, approve, and copy the `SPOTIFY_REFRESH_TOKEN=` line into
`.env`. It does not expire.

**4. Add all three to Vercel** under Settings, Environment Variables, for
Production and Preview. Without them the functions return 502 and both surfaces
fall back to plain text.

Note that `npm run dev` does not run Vercel functions, so the fetches fail
locally and the page shows its fallback state. That is the correct behaviour,
not a bug. Use `vercel dev` to exercise the functions for real.

## What the API can and cannot do

Cannot, for any new app since 2024-11-27: audio features (danceability,
energy, valence), audio analysis, recommendations, related artists, 30 second
previews. Tutorials built on those endpoints return 403 now.

Cannot, at all: listening history. `recently-played` is a 50 item window,
and `/me/top` returns exactly three spans, roughly 4 weeks, 6 months and
1 year. There is no quarter window and no all-time window. The page labels
its tabs by the real spans for that reason.

Can: top tracks and artists in those three windows, recent plays, now playing,
saved library, playlists, and artist genres. Genres are the only taste
dimension left after the 2024 cuts, which is why the page counts genres across
the top ten artists instead of charting audio features.

## The streaming export

Everything measured over time comes from
[privacy.spotify.com](https://www.spotify.com/account/privacy/), not the API.
The Extended Streaming History arrived on 2026-08-02 and covers **2022-09-17
to 2026-08-01**: 115,286 music starts, 79,764 of which cleared 30 seconds.

Notes from loading it, all of which cost time to work out:

- **The filenames look like duplicates and are not.** The export pairs a bare
  year with `_1` and `_2` suffixes (`..._2023.json`, `..._2023_1.json`). These
  are sequential chunks at roughly 12.4 MB each, with contiguous,
  non-overlapping timestamps. Globbing all of them is correct. Verified: 9
  repeated `(ts, uri, ms_played)` fingerprints in 115,484 rows, 0.01%, all
  genuine rapid skips inside the same second rather than file overlap.
- **Every row carries `ip_addr`.** `analysis/spotify/data/` is gitignored for
  this reason. Never commit the raw files.
- **The Video files are not worth using.** 1,475 rows, 2.85% self-duplicating,
  and mostly `ms_played` of 0.
- **It is a music history.** Podcasts and audiobooks total 195 rows.

## Analysis

Install DuckDB outside the site's four-package dependency list:

```bash
python3 -m pip install --user duckdb
```

Regenerate the published aggregates:

```bash
python3 analysis/spotify/build.py
```

`analysis/spotify/build.py` owns everything in `src/data/spotify/`.
`analysis/spotify/queries.sql` is for interactive exploration and deliberately
does not write those files, so there is only one writer.

Three decisions are worth defending out loud, since being able to explain them
is most of the point of the exercise:

**The 30 second threshold.** A play counts at 30 seconds, matching Spotify's
own bar for paying a rights holder. It keeps skips and mis-taps out of the
counts. It also excludes 30.8% of starts, which is a large enough share that
the page reports it rather than quietly dropping it.

**Timezones.** The `ts` field is UTC, and Clark listened from the US, Japan,
Italy, Canada and Singapore across these four years, so neither raw UTC nor a
single fixed offset is right. Each play is converted using `conn_country`. The
one case that field cannot settle is US, which covers both Seattle and
Honolulu, three hours apart, so the summer 2025 Bank of Hawaii window maps to
`Pacific/Honolulu` and the rest to `America/Los_Angeles`. An hour-of-day chart
built without this looks fine and is wrong. `conn_country` independently
corroborates the verified chronology: JP peaks in 2024 Q2 and Q3, IT appears
only in 2025 Q3.

**Ties need explicit tiebreakers.** `ORDER BY plays DESC` alone orders tied
counts arbitrarily, so two runs over identical input produced different top-20
files. Every ranking now ends `ORDER BY plays DESC, artist, track`. Output is
byte-identical across runs.

Only aggregates get written to `src/data/spotify/` and published, and the
boundary months (2022-09, 2026-08) are dropped from the trend charts because
both are partial and otherwise read as a collapse in listening.

## Tableau Public

`build.py` also writes `analysis/spotify/export/spotify_plays.csv`, which is
gitignored and regenerated rather than committed. Upload that to Tableau, not
the raw JSON.

Do not point Tableau at `analysis/spotify/data/`. Three reasons:

1. The JSON connector infers schema from the first 10,000 rows of one file, and
   there are ten files to union.
2. The 30 second threshold and the timezone conversion live in the pipeline.
   Raw JSON gives Tableau UTC timestamps and inflated counts that contradict
   the site.
3. **Tableau Public makes the underlying data downloadable by anyone.** Every
   raw row carries an `ip_addr`.

The extract is one flat play-level table, 115,286 rows, about 18 MB, well
inside Tableau Public's 15 million row ceiling. Shape notes:

- **All starts, not just streams**, with an `is_stream` boolean. Filtering to
  streams up front would make skip analysis impossible in Tableau. Set
  `is_stream = True` as a data source filter for anything that needs to match
  the site's numbers.
- **Timestamps truncated to the hour.** Supports every hour-of-day question
  without publishing a minute-by-minute record of when Clark was awake.
- **`ip_addr` excluded.** `country` and `timezone_applied` are kept: they carry
  the timezone story and where Clark has lived is already public on /journey.
  Drop the `country` column in `build.py` if that stops being true.
- **Local time already applied.** `played_at_local_hour` is local, not UTC.
  Do not re-offset it in Tableau.

## Adding a playable embed

The Spotify iFrame API is now the only way to make a track audible on the page,
since `preview_url` went away with the other deprecations. It needs two CSP
additions in `vercel.json`, neither of which is there yet:

- `frame-src https://open.spotify.com`
- `script-src https://open.spotify.com`

Album art already works: `img-src` carries `https://i.scdn.co` and
`https://*.spotifycdn.com`.

Embeds are heavy iframes, so they suit one featured track rather than a list.

## Terms

Attribution to Spotify is required and sits at the foot of the listening page.
The data may not be used to train models and may not be monetised. A personal
portfolio dashboard is squarely within the developer terms.
