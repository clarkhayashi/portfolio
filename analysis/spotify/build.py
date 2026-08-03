#!/usr/bin/env python3
"""Turns the raw Spotify export into the aggregates the site renders.

    python3 analysis/spotify/build.py

Reads every Streaming_History_Audio_*.json in analysis/spotify/data/ (gitignored)
and writes small JSON files to src/data/spotify/ (committed). Only aggregates
are published: the raw export records where Clark was and what he was doing,
minute by minute, for four years, and it carries an ip_addr on every row.

Requires duckdb. Install outside the site's dependency list:

    python3 -m pip install --user duckdb

Two decisions are load-bearing and are stated on the page as well as here.

1. A play counts at 30 seconds, matching Spotify's own bar for paying a rights
   holder. It excludes about 31% of starts, so that share is published rather
   than quietly dropped.

2. Times are local, not UTC. conn_country resolves most of it. The case it
   cannot resolve is US, which spans Seattle and Honolulu, three hours apart.
   The verified chronology puts Clark in Honolulu for the Bank of Hawaii
   internship in summer 2025, so that window maps to Pacific/Honolulu and every
   other US play maps to America/Los_Angeles. An hour-of-day chart built
   without this looks fine and is wrong.
"""

import json
import os
import duckdb

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DATA = os.path.join(HERE, "data")
OUT = os.path.join(ROOT, "src", "data", "spotify")

if not os.path.isdir(DATA) or not os.listdir(DATA):
    raise SystemExit(
        f"No export found in {DATA}\n"
        "Unzip the Extended Streaming History there first. It is gitignored."
    )

os.makedirs(OUT, exist_ok=True)

con = duckdb.connect()
con.execute("INSTALL icu; LOAD icu;")

con.execute(f"""
CREATE VIEW raw_plays AS
SELECT * FROM read_json_auto(
  '{DATA}/Streaming_History_Audio_*.json',
  union_by_name = true      -- the field set drifted between export vintages
);
""")

"""Every music start, with a timezone attached but no duration filter.
`plays` narrows this to streams; the Tableau extract keeps the skips so skip
behaviour stays analysable there."""
con.execute("""
CREATE VIEW music_starts AS
WITH base AS (
  SELECT
    CAST(ts AS TIMESTAMP)              AS utc,
    master_metadata_track_name         AS track,
    master_metadata_album_artist_name  AS artist,
    master_metadata_album_album_name   AS album,
    spotify_track_uri                  AS track_uri,
    ms_played,
    ms_played / 3600000.0              AS hours,
    conn_country, shuffle, reason_start, reason_end
  FROM raw_plays
  WHERE master_metadata_track_name IS NOT NULL   -- drops podcasts, audiobooks
)
SELECT *,
  CASE conn_country
    WHEN 'JP' THEN 'Asia/Tokyo'
    WHEN 'IT' THEN 'Europe/Rome'
    WHEN 'SG' THEN 'Asia/Singapore'
    WHEN 'CA' THEN 'America/Vancouver'
    WHEN 'US' THEN CASE
      WHEN utc >= TIMESTAMP '2025-06-01' AND utc < TIMESTAMP '2025-09-01'
        THEN 'Pacific/Honolulu'
      ELSE 'America/Los_Angeles' END
    ELSE 'America/Los_Angeles'
  END AS zone
FROM base;
""")

con.execute("""
CREATE VIEW local_plays_all AS
SELECT *, (utc AT TIME ZONE 'UTC' AT TIME ZONE zone) AS local_ts
FROM music_starts;
""")

# The 30 second threshold, applied once, inherited everywhere downstream.
con.execute("CREATE VIEW plays AS SELECT * FROM music_starts WHERE ms_played >= 30000;")
con.execute("CREATE VIEW local_plays AS SELECT * FROM local_plays_all WHERE ms_played >= 30000;")


def rows(sql):
    cur = con.execute(sql)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def write(name, payload):
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"  {name:<24} {os.path.getsize(path) / 1024:6.1f} KB")


overview = rows("""
SELECT COUNT(*) AS plays,
       COUNT(DISTINCT artist) AS artists,
       COUNT(DISTINCT track_uri) AS tracks,
       ROUND(SUM(hours), 0) AS hours,
       MIN(utc)::DATE::VARCHAR AS first_play,
       MAX(utc)::DATE::VARCHAR AS last_play
FROM plays;
""")[0]

starts = rows("""
SELECT COUNT(*) AS starts FROM raw_plays
WHERE master_metadata_track_name IS NOT NULL;
""")[0]["starts"]

overview["starts"] = starts
overview["abandoned_pct"] = round((starts - overview["plays"]) * 100.0 / starts, 1)
overview["generatedFrom"] = "Extended Streaming History"

monthly = rows("""
SELECT STRFTIME(DATE_TRUNC('month', local_ts), '%Y-%m') AS month,
       COUNT(*) AS plays, ROUND(SUM(hours), 1) AS hours
FROM local_plays GROUP BY month ORDER BY month;
""")

clock = rows("""
SELECT DAYOFWEEK(local_ts) AS dow, HOUR(local_ts) AS hour, COUNT(*) AS plays
FROM local_plays GROUP BY dow, hour ORDER BY dow, hour;
""")

discovery = rows("""
WITH first_heard AS (
  SELECT artist, MIN(local_ts) AS first_play FROM local_plays GROUP BY artist
)
SELECT STRFTIME(DATE_TRUNC('month', first_play), '%Y-%m') AS month,
       COUNT(*) AS new_artists
FROM first_heard GROUP BY month ORDER BY month;
""")

top_all_time = {
    "tracks": rows("""
        SELECT track, artist, COUNT(*) AS plays, ROUND(SUM(hours),1) AS hours
        FROM plays GROUP BY track, artist
        ORDER BY plays DESC, artist, track LIMIT 20;
    """),
    "artists": rows("""
        SELECT artist, COUNT(*) AS plays, ROUND(SUM(hours),1) AS hours,
               COUNT(DISTINCT track_uri) AS tracks
        FROM plays GROUP BY artist
        ORDER BY plays DESC, artist LIMIT 20;
    """),
}

# How he listens, not just what. Computed over all starts, not just streams,
# because a skip is by definition a start that did not become a stream.
behaviour = rows("""
SELECT STRFTIME(DATE_TRUNC('month', local_ts), '%Y-%m') AS month,
       ROUND(COUNT(*) FILTER (WHERE ms_played < 30000)*100.0/COUNT(*), 1) AS skip,
       ROUND(AVG(CASE WHEN shuffle THEN 1.0 ELSE 0 END)*100, 1) AS shuffle
FROM local_plays_all GROUP BY month ORDER BY month;
""")

# Skip rate per year, so the page can say which way the flat all-time figure
# is actually moving instead of presenting it as a settled fact.
skip_by_year = rows("""
SELECT YEAR(local_ts) AS year,
       ROUND(COUNT(*) FILTER (WHERE ms_played < 30000)*100.0/COUNT(*), 1) AS skip,
       ROUND(AVG(CASE WHEN shuffle THEN 1.0 ELSE 0 END)*100, 0) AS shuffle
FROM local_plays_all GROUP BY year ORDER BY year;
""")

# Monthly shape of the six biggest artists. Six, because a categorical palette
# stops separating past that, and these render as small multiples in one hue
# rather than six overlaid lines.
six = [r["artist"] for r in rows("""
    SELECT artist, COUNT(*) AS n FROM plays
    GROUP BY artist ORDER BY n DESC, artist LIMIT 6;
""")]
months = [m["month"] for m in monthly]
trajectory = {"artists": six, "months": months, "series": {}}
for name in six:
    safe = name.replace("'", "''")
    got = {r["m"]: r["n"] for r in rows(f"""
        SELECT STRFTIME(DATE_TRUNC('month', local_ts), '%Y-%m') AS m, COUNT(*) AS n
        FROM local_plays WHERE artist = '{safe}' GROUP BY m;
    """)}
    trajectory["series"][name] = [got.get(m, 0) for m in months]

# Months with real listening from outside the US. This is the evidence for the
# timezone handling, so it belongs on the page rather than only in the docs.
countries = rows("""
SELECT STRFTIME(DATE_TRUNC('month', local_ts), '%Y-%m') AS month,
       conn_country AS country, COUNT(*) AS plays
FROM local_plays WHERE conn_country <> 'US'
GROUP BY month, country HAVING plays >= 40
ORDER BY month, plays DESC;
""")

by_year = {}
for year in [r["y"] for r in rows("SELECT DISTINCT YEAR(utc) AS y FROM plays ORDER BY y")]:
    by_year[str(year)] = {
        "tracks": rows(f"""
            SELECT track, artist, COUNT(*) AS plays FROM plays
            WHERE YEAR(utc) = {year}
            GROUP BY track, artist ORDER BY plays DESC, artist, track LIMIT 10;
        """),
        "artists": rows(f"""
            SELECT artist, COUNT(*) AS plays FROM plays
            WHERE YEAR(utc) = {year}
            GROUP BY artist ORDER BY plays DESC, artist LIMIT 10;
        """),
    }

# ---------------------------------------------------------------------------
# Tableau extract
# ---------------------------------------------------------------------------
# One flat, play-level table. Tableau wants granular rows so it can do its own
# aggregating; handing it pre-summarised tables would defeat the tool.
#
# What is deliberately NOT in here, because Tableau Public makes the underlying
# data downloadable by anyone:
#
#   ip_addr            an IP per play, four years of them
#   second precision   timestamps are truncated to the hour, so this supports
#                      every hour-of-day question without publishing a
#                      minute-by-minute record of when Clark was awake
#
# conn_country IS included: it carries the timezone story, and where Clark has
# lived and travelled is already public on /journey. Drop the column below if
# that ever stops being true.
#
# All starts are included, not just streams, with an is_stream flag. That keeps
# skip analysis possible in Tableau instead of filtering it away up front.
EXPORT = os.path.join(HERE, "export")
os.makedirs(EXPORT, exist_ok=True)
csv_path = os.path.join(EXPORT, "spotify_plays.csv")

con.execute(f"""
COPY (
  SELECT
    DATE_TRUNC('hour', local_ts)          AS played_at_local_hour,
    CAST(local_ts AS DATE)                AS played_date,
    YEAR(local_ts)                        AS year,
    DATE_TRUNC('month', local_ts)::DATE   AS month_start,
    HOUR(local_ts)                        AS hour_of_day,
    DAYNAME(local_ts)                     AS weekday,
    DAYOFWEEK(local_ts)                   AS weekday_number,
    track, artist, album,
    ms_played,
    ROUND(ms_played / 60000.0, 3)         AS minutes_played,
    ms_played >= 30000                    AS is_stream,
    reason_start, reason_end, shuffle,
    conn_country                          AS country,
    zone                                  AS timezone_applied
  FROM local_plays_all
  ORDER BY played_at_local_hour, artist, track
) TO '{csv_path}' (HEADER, DELIMITER ',');
""")
print(f"Tableau extract: {csv_path} ({os.path.getsize(csv_path) / 1048576:.1f} MB)")

print("Writing aggregates to src/data/spotify/")
write("overview.json", overview)
write("monthly.json", monthly)
write("clock.json", clock)
write("discovery.json", discovery)
write("top-all-time.json", top_all_time)
write("by-year.json", by_year)
write("behaviour.json", behaviour)
write("skip-by-year.json", skip_by_year)
write("trajectory.json", trajectory)
write("countries.json", countries)

print(
    f"\n{overview['plays']:,} streams · {overview['hours']:,.0f} hours · "
    f"{overview['artists']:,} artists · "
    f"{overview['first_play']} to {overview['last_play']}"
)
