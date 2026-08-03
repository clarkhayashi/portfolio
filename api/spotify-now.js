import { getAccessToken, spotifyGet, normalizeTrack } from "../lib/spotify.js";

/* What is playing right now, plus the tracks just before it.

   Split from `spotify-top.js` purely so the two can cache differently: this
   one has to stay near-live, the top lists barely move in a day.

   Deliberately absent: any "plays this week" count. The recently-played
   endpoint returns a 50-item window and nothing older, so any total derived
   from it would understate real listening. Counts come from the streaming
   history export instead. */

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken = await getAccessToken();

    const [playing, recent] = await Promise.all([
      spotifyGet("/me/player/currently-playing?additional_types=track", accessToken),
      spotifyGet("/me/player/recently-played?limit=12", accessToken),
    ]);

    /* `item` is null while an ad plays or on a private session, so a 200 is
       not by itself proof that there is a track to show. */
    const nowPlaying =
      playing?.is_playing && playing?.item
        ? { ...normalizeTrack(playing.item), progressMs: playing.progress_ms ?? null }
        : null;

    const items = Array.isArray(recent?.items) ? recent.items : [];
    const recentlyPlayed = items
      .map((item) => {
        const track = normalizeTrack(item?.track);
        if (!track) return null;
        return { ...track, playedAt: item.played_at ?? null };
      })
      .filter(Boolean);

    response.setHeader(
      "Cache-Control",
      "s-maxage=60, stale-while-revalidate=300",
    );

    return response.status(200).json({
      nowPlaying,
      recentlyPlayed,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    response.setHeader(
      "Cache-Control",
      "s-maxage=120, stale-while-revalidate=600",
    );
    return response
      .status(502)
      .json({ error: "Spotify listening data temporarily unavailable" });
  }
}
