import {
  getAccessToken,
  spotifyGet,
  normalizeTrack,
  normalizeArtist,
} from "../lib/spotify.js";

/* Top tracks and artists across the three windows Spotify actually offers.

   There are exactly three, and they are not the month/quarter/year/all-time
   split people expect. `short_term` is roughly four weeks, `medium_term`
   roughly six months, `long_term` roughly the last year. There is no quarter
   window and no all-time window on this endpoint at any price. Those two come
   from the streaming history export, computed offline.

   The UI labels these by their real spans for that reason. Calling
   `long_term` "all time" would be the kind of overstatement the project's
   writing standards rule out. */

const RANGES = ["short_term", "medium_term", "long_term"];

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken = await getAccessToken();

    /* Six calls, one round trip. Well inside Spotify's rolling rate limit,
       and the whole payload is cached for six hours anyway. */
    const results = await Promise.all(
      RANGES.flatMap((range) => [
        spotifyGet(`/me/top/tracks?time_range=${range}&limit=10`, accessToken),
        spotifyGet(`/me/top/artists?time_range=${range}&limit=10`, accessToken),
      ]),
    );

    const ranges = {};
    RANGES.forEach((range, index) => {
      const tracks = results[index * 2];
      const artists = results[index * 2 + 1];

      ranges[range] = {
        tracks: (tracks?.items ?? []).map(normalizeTrack).filter(Boolean),
        artists: (artists?.items ?? []).map(normalizeArtist).filter(Boolean),
      };
    });

    response.setHeader(
      "Cache-Control",
      "s-maxage=21600, stale-while-revalidate=86400",
    );

    return response.status(200).json({
      ranges,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    response.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=900",
    );
    return response
      .status(502)
      .json({ error: "Spotify listening data temporarily unavailable" });
  }
}
