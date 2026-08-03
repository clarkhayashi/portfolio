#!/usr/bin/env node
/* One-time helper that produces the long-lived Spotify refresh token.
 *
 * Run it once on this machine (`npm run spotify:auth`), approve the consent
 * screen, then paste the printed token into Vercel as SPOTIFY_REFRESH_TOKEN.
 * After that the site refreshes its own access tokens forever and nobody,
 * including Clark, ever signs in again.
 *
 * The redirect URI must be exactly http://127.0.0.1:3000/callback and must be
 * registered on the Spotify app. Spotify dropped support for the hostname
 * `localhost` in favour of the literal loopback address, so `localhost` here
 * fails with INVALID_CLIENT even though the two resolve to the same machine.
 *
 * No dependencies on purpose: node:http and node:crypto are enough, and this
 * script must not add anything to the site's four-package dependency list.
 */

import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

const REDIRECT_URI = "http://127.0.0.1:3000/callback";
const PORT = 3000;

/* Read-only scopes, nothing that can change the account. `user-top-read`
   covers the ranked lists, the other two cover the live strip. */
const SCOPES = [
  "user-read-currently-playing",
  "user-read-recently-played",
  "user-top-read",
].join(" ");

/* Minimal .env reader so the command stays a single `npm run`. Adding dotenv
   for a script that runs once would not earn its place in package.json. */
function loadEnvFile() {
  try {
    const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!match) continue;
      const key = match[1];
      const value = (match[2] ?? "").replace(/^["']|["']$/g, "").trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    /* No .env is fine when the values are already exported in the shell. */
  }
}

loadEnvFile();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\nMissing credentials.\n\n" +
      "Create a .env file next to package.json containing:\n\n" +
      "  SPOTIFY_CLIENT_ID=your_client_id\n" +
      "  SPOTIFY_CLIENT_SECRET=your_client_secret\n\n" +
      "Both are on the app page at developer.spotify.com/dashboard.\n" +
      ".env is already gitignored.\n",
  );
  process.exit(1);
}

const state = randomBytes(16).toString("hex");

const authorizeUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state,
    /* Forces the consent screen even if this app was approved before, so a
       re-run always returns a fresh refresh token rather than omitting it. */
    show_dialog: "true",
  });

async function exchangeCodeForTokens(code) {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error_description || JSON.stringify(payload));
  }
  return payload;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname !== "/callback") {
    response.writeHead(404).end("Not found");
    return;
  }

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  if (error) {
    response.writeHead(400, { "Content-Type": "text/plain" });
    response.end(`Spotify returned: ${error}`);
    console.error(`\nAuthorization failed: ${error}\n`);
    server.close();
    process.exit(1);
  }

  /* Guards against a callback that did not originate from the request this
     process started. */
  if (returnedState !== state) {
    response.writeHead(400, { "Content-Type": "text/plain" });
    response.end("State mismatch. Run the command again.");
    console.error("\nState mismatch, discarding the response.\n");
    server.close();
    process.exit(1);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(
      "<title>Spotify connected</title>" +
        "<body style=\"font-family:system-ui;max-width:32rem;margin:6rem auto;color:#1c1c1c\">" +
        "<h1 style=\"font-weight:600\">Connected.</h1>" +
        "<p>The refresh token is in your terminal. You can close this tab.</p>" +
        "</body>",
    );

    console.log("\n" + "=".repeat(64));
    console.log("SPOTIFY_REFRESH_TOKEN=" + tokens.refresh_token);
    console.log("=".repeat(64));
    console.log(
      "\nAdd that line to .env for local runs, and add the same value in\n" +
        "Vercel under Settings > Environment Variables, along with\n" +
        "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.\n\n" +
        "Treat it like a password. It does not expire, and anyone holding it\n" +
        "plus the client secret can read this listening data.\n",
    );
  } catch (caught) {
    response.writeHead(500, { "Content-Type": "text/plain" });
    response.end("Token exchange failed. Check the terminal.");
    console.error(`\nToken exchange failed: ${caught.message}\n`);
    server.close();
    process.exit(1);
  }

  server.close();
  process.exit(0);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(
    "\nOpen this URL in the browser where you are signed in to Spotify:\n\n" +
      authorizeUrl +
      "\n\nWaiting for the redirect on " +
      REDIRECT_URI +
      " ...\n",
  );
});
