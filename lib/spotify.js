/* Shared Spotify helpers for the `api/spotify-*.js` functions.
   Lives outside `api/` so Vercel does not turn it into its own route; the
   functions import it relatively and the bundler traces it in.

   Auth model: Clark is the only user, so the OAuth dance runs once locally
   (`npm run spotify:auth`) and the resulting refresh token lives in Vercel
   env vars forever. Visitors never sign in. That also means the app can stay
   in Spotify's Development Mode permanently, which matters because extended
   mode now effectively requires 250K monthly users.

   Authorization Code with a client secret is deliberate over PKCE: PKCE
   rotates the refresh token on every use, so it would need writable storage.
   The secret-based flow keeps one stable token that a plain env var holds. */

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const API_ROOT = "https://api.spotify.com/v1";

/** Trades the long-lived refresh token for a short-lived access token. */
export async function getAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Spotify credentials are not configured");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh returned ${response.status}`);
  }

  const payload = await response.json();
  if (!payload?.access_token) {
    throw new Error("Token refresh returned no access token");
  }

  return payload.access_token;
}

/* A 204 means "nothing is playing", which is a normal state rather than a
   failure, so it resolves to null instead of throwing. */
export async function spotifyGet(path, accessToken) {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 204) return null;

  if (!response.ok) {
    throw new Error(`Spotify ${path} returned ${response.status}`);
  }

  return response.json();
}

/* Spotify sorts images largest first. The card wants a thumbnail and the
   stats page wants something bigger, so both sizes travel together and the
   markup picks. Falls back to the only image available when there is one. */
function pickArt(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const last = images[images.length - 1];
  return {
    large: images[0]?.url ?? last.url,
    small: last.url,
  };
}

function joinArtists(artists) {
  if (!Array.isArray(artists)) return "";
  return artists
    .map((artist) => artist?.name)
    .filter(Boolean)
    .join(", ");
}

/** Trims a full track object down to only the fields the site renders. */
export function normalizeTrack(track) {
  if (!track) return null;

  return {
    title: track.name ?? "Unknown track",
    artist: joinArtists(track.artists),
    album: track.album?.name ?? null,
    art: pickArt(track.album?.images),
    url: track.external_urls?.spotify ?? null,
    uri: track.uri ?? null,
  };
}

export function normalizeArtist(artist) {
  if (!artist) return null;

  return {
    name: artist.name ?? "Unknown artist",
    /* Genres are the only taste dimension the API still exposes. Spotify cut
       new apps off from audio-features and audio-analysis on 2024-11-27, so
       danceability and energy are gone and these strings replace them. */
    genres: Array.isArray(artist.genres) ? artist.genres.slice(0, 3) : [],
    art: pickArt(artist.images),
    url: artist.external_urls?.spotify ?? null,
  };
}
