// one-time: sign in to spotify and print a refresh token for SPOTIFY_REFRESH_TOKEN.
// run with: node --env-file=.env scripts/spotify-token.mjs
import { exec } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";

const id = process.env.SPOTIFY_CLIENT_ID;
const secret = process.env.SPOTIFY_CLIENT_SECRET;
if (!id || !secret) {
  console.error(
    "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env first",
  );
  process.exit(1);
}

// must match the redirect URI in your spotify app settings exactly
const redirect = "http://127.0.0.1:3000/callback";
const state = randomBytes(8).toString("hex");

const auth = new URL("https://accounts.spotify.com/authorize");
auth.search = new URLSearchParams({
  client_id: id,
  response_type: "code",
  redirect_uri: redirect,
  scope: "user-read-currently-playing user-read-recently-played",
  state,
}).toString();

const server = createServer(async (req, res) => {
  const url = new URL(req.url, redirect);
  if (url.pathname !== "/callback") return res.end();

  const code = url.searchParams.get("code");
  if (!code || url.searchParams.get("state") !== state) {
    res.end("Sign-in failed, check the terminal.");
    console.error("Spotify returned:", url.searchParams.get("error"));
    return server.close();
  }

  const token = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirect,
    }),
  }).then((r) => r.json());

  if (!token.refresh_token) {
    res.end("Token exchange failed, check the terminal.");
    console.error(token);
  } else {
    res.end("Done, you can close this tab.");
    console.log(
      `\nAdd this to .env:\n\nSPOTIFY_REFRESH_TOKEN=${token.refresh_token}\n`,
    );
  }
  server.close();
});

// listen wherever the redirect points so the two can't drift apart
server.on("error", (e) => {
  console.error(
    e.code === "EADDRINUSE"
      ? `Port ${new URL(redirect).port} is busy, stop whatever's on it (your dev server?) and rerun`
      : e,
  );
  process.exit(1);
});

server.listen(Number(new URL(redirect).port), "127.0.0.1", () => {
  console.log("Opening Spotify sign-in...");
  exec(`open "${auth}"`);
});
