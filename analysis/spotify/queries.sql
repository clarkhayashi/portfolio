-- Spotify streaming history · DuckDB
--
-- Run:  duckdb
--       .read analysis/spotify/queries.sql
--
-- Put the unzipped export in analysis/spotify/data/ (gitignored). DuckDB reads
-- the JSON directly, so there is no load step and no database to run.

-- ---------------------------------------------------------------------------
-- 1. Normalize
-- ---------------------------------------------------------------------------

-- The extended export. One row per play, lifetime of the account.
CREATE OR REPLACE VIEW raw_plays AS
SELECT *
FROM read_json_auto(
  'analysis/spotify/data/Streaming_History_Audio_*.json',
  union_by_name = true          -- field set drifted between export vintages
);

-- A stream counts at 30 seconds. That is Spotify's own threshold for paying a
-- rights holder, and using it keeps skips and mis-taps out of the play counts.
-- Every downstream number depends on this line, so it is stated once, here,
-- rather than being buried in each query.
CREATE OR REPLACE VIEW plays AS
WITH base AS (
  SELECT
    CAST(ts AS TIMESTAMP)                       AS played_at_utc,
    master_metadata_track_name                  AS track,
    master_metadata_album_artist_name           AS artist,
    master_metadata_album_album_name            AS album,
    spotify_track_uri                           AS track_uri,
    ms_played,
    ms_played / 3600000.0                       AS hours,
    conn_country,
    platform,
    reason_start,
    reason_end,
    shuffle,
    skipped
  FROM raw_plays
  WHERE master_metadata_track_name IS NOT NULL  -- drops podcasts, audiobooks
    AND ms_played >= 30000
)
SELECT *,
  -- See the timezone note under `listening_clock` below. conn_country settles
  -- every country except the US, which spans Seattle and Honolulu.
  CASE conn_country
    WHEN 'JP' THEN 'Asia/Tokyo'
    WHEN 'IT' THEN 'Europe/Rome'
    WHEN 'SG' THEN 'Asia/Singapore'
    WHEN 'CA' THEN 'America/Vancouver'
    WHEN 'US' THEN CASE
      WHEN played_at_utc >= TIMESTAMP '2025-06-01'
       AND played_at_utc <  TIMESTAMP '2025-09-01'
        THEN 'Pacific/Honolulu'   -- Bank of Hawaii internship, summer 2025
      ELSE 'America/Los_Angeles' END
    ELSE 'America/Los_Angeles'
  END AS zone
FROM base;

-- Requires the icu extension: INSTALL icu; LOAD icu;
CREATE OR REPLACE VIEW local_plays AS
SELECT *, (played_at_utc AT TIME ZONE 'UTC' AT TIME ZONE zone) AS local_ts
FROM plays;

-- Sanity check before trusting anything below.
SELECT
  COUNT(*)                        AS plays,
  COUNT(DISTINCT artist)          AS artists,
  COUNT(DISTINCT track_uri)       AS tracks,
  ROUND(SUM(hours), 1)            AS total_hours,
  MIN(played_at_utc)              AS first_play,
  MAX(played_at_utc)              AS last_play
FROM plays;

-- ---------------------------------------------------------------------------
-- 2. The rankings the API cannot give (all time, and by quarter)
-- ---------------------------------------------------------------------------

-- Plays and hours disagree, and the disagreement is the interesting part: a
-- three-minute song played 200 times loses to an hour-long mix played 15.
CREATE OR REPLACE VIEW top_tracks_all_time AS
SELECT
  track,
  artist,
  COUNT(*)              AS plays,
  ROUND(SUM(hours), 1)  AS hours
FROM plays
GROUP BY track, artist
ORDER BY plays DESC
LIMIT 50;

CREATE OR REPLACE VIEW top_artists_by_quarter AS
SELECT
  YEAR(played_at_utc)                AS year,
  QUARTER(played_at_utc)             AS quarter,
  artist,
  COUNT(*)                           AS plays,
  ROUND(SUM(hours), 1)               AS hours,
  ROW_NUMBER() OVER (
    PARTITION BY YEAR(played_at_utc), QUARTER(played_at_utc)
    ORDER BY COUNT(*) DESC
  )                                  AS rank
FROM plays
GROUP BY year, quarter, artist
QUALIFY rank <= 10
ORDER BY year, quarter, rank;

-- The single most-played track of each month, which reads as a timeline of
-- what was actually going on.
CREATE OR REPLACE VIEW track_of_the_month AS
SELECT month, track, artist, plays
FROM (
  SELECT
    DATE_TRUNC('month', played_at_utc) AS month,
    track,
    artist,
    COUNT(*)                           AS plays,
    ROW_NUMBER() OVER (
      PARTITION BY DATE_TRUNC('month', played_at_utc)
      ORDER BY COUNT(*) DESC
    ) AS rank
  FROM plays
  GROUP BY month, track, artist
)
WHERE rank = 1
ORDER BY month;

-- ---------------------------------------------------------------------------
-- 3. Behaviour over time
-- ---------------------------------------------------------------------------

-- Listening clock.
--
-- CAVEAT, and it matters: `ts` is UTC. Clark has listened from Honolulu,
-- Seattle, Tokyo and Italy, so neither raw UTC nor one fixed local offset is
-- correct across the whole history. `conn_country` is the lever: bucket by it
-- and apply the offset per country before drawing an hour-of-day chart.
-- Anything simpler is a chart that is quietly wrong.
CREATE OR REPLACE VIEW listening_clock AS
SELECT
  conn_country,
  DAYNAME(played_at_utc)   AS weekday,
  HOUR(played_at_utc)      AS hour_utc,
  COUNT(*)                 AS plays
FROM plays
GROUP BY conn_country, weekday, hour_utc
ORDER BY conn_country, hour_utc;

-- Discovery rate. First time each artist ever appears, bucketed by month.
-- A falling line here is the honest version of "my taste stopped moving".
CREATE OR REPLACE VIEW discovery_rate AS
WITH first_heard AS (
  SELECT artist, MIN(played_at_utc) AS first_play
  FROM plays
  GROUP BY artist
)
SELECT
  DATE_TRUNC('month', first_play) AS month,
  COUNT(*)                        AS new_artists
FROM first_heard
GROUP BY month
ORDER BY month;

-- Artist lifespan. How long an artist stays in rotation between the first
-- play and the last, and how concentrated that run was.
CREATE OR REPLACE VIEW artist_lifespan AS
SELECT
  artist,
  COUNT(*)                                           AS plays,
  MIN(played_at_utc)                                 AS first_play,
  MAX(played_at_utc)                                 AS last_play,
  DATE_DIFF('day', MIN(played_at_utc), MAX(played_at_utc)) AS days_in_rotation,
  ROUND(
    COUNT(*) / NULLIF(DATE_DIFF('day', MIN(played_at_utc), MAX(played_at_utc)), 0),
    3
  )                                                  AS plays_per_day
FROM plays
GROUP BY artist
HAVING plays >= 20
ORDER BY plays DESC;

-- Binge and abandon. Heavy rotation inside a single month, then silence.
-- These are the songs a year-end top-10 always hides.
CREATE OR REPLACE VIEW binged_then_dropped AS
WITH per_track AS (
  SELECT
    track,
    artist,
    COUNT(*)                        AS total_plays,
    MAX(played_at_utc)              AS last_play,
    MODE(DATE_TRUNC('month', played_at_utc)) AS peak_month
  FROM plays
  GROUP BY track, artist
  HAVING total_plays >= 15
)
SELECT
  p.track,
  p.artist,
  p.total_plays,
  p.peak_month,
  COUNT(*) FILTER (
    WHERE DATE_TRUNC('month', pl.played_at_utc) = p.peak_month
  )                                 AS plays_in_peak_month,
  ROUND(
    COUNT(*) FILTER (
      WHERE DATE_TRUNC('month', pl.played_at_utc) = p.peak_month
    ) * 100.0 / p.total_plays,
    1
  )                                 AS pct_in_peak_month
FROM per_track p
JOIN plays pl ON pl.track = p.track AND pl.artist = p.artist
GROUP BY p.track, p.artist, p.total_plays, p.peak_month
HAVING pct_in_peak_month >= 70
ORDER BY p.total_plays DESC;

-- Skip behaviour. Uses the unfiltered rows on purpose: a skip is by
-- definition a play that did not clear the 30 second bar.
CREATE OR REPLACE VIEW skip_rate_by_artist AS
SELECT
  master_metadata_album_artist_name        AS artist,
  COUNT(*)                                 AS started,
  COUNT(*) FILTER (WHERE ms_played < 30000) AS abandoned,
  ROUND(
    COUNT(*) FILTER (WHERE ms_played < 30000) * 100.0 / COUNT(*),
    1
  )                                        AS pct_abandoned
FROM raw_plays
WHERE master_metadata_track_name IS NOT NULL
GROUP BY artist
HAVING started >= 50
ORDER BY pct_abandoned DESC;

-- ---------------------------------------------------------------------------
-- 4. Emit aggregates for the site
-- ---------------------------------------------------------------------------
-- This file is for exploring. The aggregates the site actually renders are
-- written by `python3 analysis/spotify/build.py`, which owns those files so
-- there is only ever one writer:
--
--   src/data/spotify/{overview,monthly,clock,discovery,top-all-time,by-year}.json
--
-- Its rankings carry explicit tiebreakers (ORDER BY plays DESC, artist, track).
-- Without them, tied play counts order arbitrarily and two runs over identical
-- input produce different "top 20" files.
--
-- Only aggregates ship. The raw export stays local: it is a minute-by-minute
-- record of where someone was and what they were doing for four years, and it
-- carries an ip_addr on every row.
